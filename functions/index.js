const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

// Simple in-memory cache for user data (reduces Firestore reads)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached user data with TTL
 */
async function getCachedUserData(userId) {
    const now = Date.now();
    const cached = userCache.get(userId);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }

    // Cache miss or expired - fetch from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        return null;
    }

    const userData = userDoc.data();

    // Cache the result
    userCache.set(userId, {
        data: userData,
        timestamp: now
    });

    return userData;
}

/**
 * Clear user cache (useful for testing or when user data changes)
 */
function clearUserCache(userId = null) {
    if (userId) {
        userCache.delete(userId);
    } else {
        userCache.clear();
    }
}

// Configuration
const CREDIT_PACKAGES = {
    'price_1SLx6hKdyWMKWoqkYKjSCZzA': { credits: 10, name: 'Starter', price: 9.99 },
    'price_1SLx7uKdyWMKWoqkzQeVpNpG': { credits: 50, name: 'Professional', price: 39.99 },
    'price_1SLx8dKdyWMKWoqkapfgJqRN': { credits: 100, name: 'Business', price: 69.99 },
    'price_1SLx9iKdyWMKWoqkmURWWEB8': { credits: 500, name: 'Enterprise', price: 299.99 },
};

const BACKEND_URL = process.env.BACKEND_URL || 'https://dexprotector-processor-447369235479.us-central1.run.app';

/**
 * Structured logging helper
 */
function log(level, message, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...metadata,
    };
    console.log(JSON.stringify(logEntry));
}

/**
 * Create Stripe Checkout Session
 * Called from frontend when user clicks purchase button
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated to create checkout session'
        );
    }

    const { priceId, origin } = data;
    const userId = context.auth.uid;

    log('info', 'Creating checkout session', { userId, priceId });

    // Validate price ID
    if (!CREDIT_PACKAGES[priceId]) {
        log('warn', 'Invalid price ID requested', { userId, priceId });
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid price ID'
        );
    }

    try {
        // Get cached user data (reduces Firestore reads)
        const userData = await getCachedUserData(userId);
        const userEmail = userData?.email || context.auth.token.email;

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin || 'https://dexprotector-saas-ian.web.app'}/dashboard?payment=success`,
            cancel_url: `${origin || 'https://dexprotector-saas-ian.web.app'}/pricing?payment=cancelled`,
            customer_email: userEmail,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                priceId: priceId,
                credits: CREDIT_PACKAGES[priceId].credits,
            },
        });

        log('info', 'Checkout session created', {
            userId,
            sessionId: session.id,
            credits: CREDIT_PACKAGES[priceId].credits,
        });

        return { sessionId: session.id, url: session.url };
    } catch (error) {
        log('error', 'Error creating checkout session', {
            userId,
            error: error.message,
            stack: error.stack,
        });
        throw new functions.https.HttpsError(
            'internal',
            'Failed to create checkout session'
        );
    }
});

/**
 * Stripe Webhook Handler
 * Handles payment confirmation and credit addition
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        log('error', 'Webhook signature verification failed', { error: err.message });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object);
            break;

        case 'payment_intent.succeeded':
            log('info', 'Payment intent succeeded', { paymentIntentId: event.data.object.id });
            break;

        case 'payment_intent.payment_failed':
            log('warn', 'Payment intent failed', { paymentIntentId: event.data.object.id });
            break;

        default:
            log('debug', 'Unhandled event type', { eventType: event.type });
    }

    res.json({ received: true });
});

/**
 * Handle successful checkout session
 * Uses transaction to ensure atomic credit addition and prevent double-processing
 */
async function handleCheckoutCompleted(session) {
    log('info', 'Processing completed checkout session', { sessionId: session.id });

    const userId = session.metadata.userId || session.client_reference_id;
    const priceId = session.metadata.priceId;
    const credits = parseInt(session.metadata.credits);

    if (!userId || !credits) {
        log('error', 'Missing userId or credits in session metadata', { metadata: session.metadata });
        return;
    }

    try {
        // Use Firestore transaction for atomic operation
        // This prevents race conditions and double-processing
        const transactionRef = db.collection('transactions').doc(session.id);
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
            // Check if transaction already exists (idempotency)
            const existingTransaction = await transaction.get(transactionRef);
            if (existingTransaction.exists) {
                log('info', 'Transaction already processed', { sessionId: session.id });
                return;
            }

            // Get user document
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const currentCredits = userDoc.data().credits || 0;
            const newCredits = currentCredits + credits;

            // Update user credits
            transaction.update(userRef, {
                credits: newCredits,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Create transaction record
            transaction.set(transactionRef, {
                userId: userId,
                type: 'purchase',
                amount: credits,
                price: session.amount_total / 100, // Convert from cents
                currency: session.currency,
                stripeSessionId: session.id,
                stripePaymentIntent: session.payment_intent,
                priceId: priceId,
                packageName: CREDIT_PACKAGES[priceId]?.name || 'Unknown',
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        log('info', 'Successfully added credits to user', {
            userId,
            credits,
            sessionId: session.id,
        });
    } catch (error) {
        log('error', 'Error processing checkout completion', {
            sessionId: session.id,
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
}

/**
 * Get user's transaction history
 * Cost-optimized with limit parameter
 */
exports.getTransactions = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const userId = context.auth.uid;
    const limit = Math.min(data.limit || 50, 100); // Cap at 100 to prevent excessive reads

    log('info', 'Fetching transactions', { userId, limit });

    try {
        const transactionsSnapshot = await db
            .collection('transactions')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const transactions = transactionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
        }));

        log('info', 'Transactions fetched', { userId, count: transactions.length });

        return { transactions };
    } catch (error) {
        log('error', 'Error fetching transactions', {
            userId,
            error: error.message,
        });
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch transactions'
        );
    }
});

/**
 * Firestore Trigger: Process APK when job is created with inputFile
 * Optimized to trigger only on document creation, not updates
 * This reduces function invocations and costs
 */
exports.processJob = functions.firestore
    .document('jobs/{jobId}')
    .onCreate(async (snapshot, context) => {
        const jobId = context.params.jobId;
        const jobData = snapshot.data();

        // Only process if inputFile is present and status is pending
        if (!jobData.inputFile || jobData.status !== 'pending') {
            log('debug', 'Job created but not ready for processing', {
                jobId,
                hasInputFile: !!jobData.inputFile,
                status: jobData.status,
            });
            return null;
        }

        log('info', 'Job ready for processing', {
            jobId,
            userId: jobData.userId,
            tier: jobData.configTier,
        });

        // Call the backend processing service
        // Using fire-and-forget pattern to avoid function timeout
        const fetch = require('node-fetch');

        try {
            const response = await fetch(`${BACKEND_URL}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobId: jobId,
                    userId: jobData.userId,
                    inputFile: jobData.inputFile,
                    configXml: jobData.configXml,
                }),
                timeout: 5000, // 5 second timeout for request initiation
            });

            if (response.ok) {
                log('info', 'Backend processing request sent successfully', { jobId });
            } else {
                const errorText = await response.text();
                log('error', 'Backend returned error', {
                    jobId,
                    status: response.status,
                    error: errorText,
                });

                // Update job status to failed
                await snapshot.ref.update({
                    status: 'failed',
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                    error: 'Failed to initiate processing',
                });
            }
        } catch (error) {
            log('error', 'Error sending request to backend', {
                jobId,
                error: error.message,
                stack: error.stack,
            });

            // Update job status to failed
            try {
                await snapshot.ref.update({
                    status: 'failed',
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                    error: 'Failed to connect to processing service',
                });
            } catch (updateError) {
                log('error', 'Failed to update job status', {
                    jobId,
                    error: updateError.message,
                });
            }
        }

        return { success: true, jobId };
    });

/**
 * Scheduled function to clean up old jobs (run daily)
 * Cost optimization: Remove old completed/failed jobs to reduce storage
 */
exports.cleanupOldJobs = functions.pubsub
    .schedule('0 2 * * *') // Run at 2 AM daily
    .timeZone('America/Los_Angeles')
    .onRun(async (context) => {
        log('info', 'Starting cleanup of old jobs');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            // Find old completed/failed jobs
            const oldJobsQuery = db
                .collection('jobs')
                .where('status', 'in', ['completed', 'failed'])
                .where('createdAt', '<', thirtyDaysAgo)
                .limit(500); // Process in batches to avoid timeout

            const snapshot = await oldJobsQuery.get();

            if (snapshot.empty) {
                log('info', 'No old jobs to clean up');
                return null;
            }

            // Batch delete for efficiency
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            log('info', 'Old jobs cleaned up', { count: snapshot.size });
        } catch (error) {
            log('error', 'Error cleaning up old jobs', {
                error: error.message,
                stack: error.stack,
            });
        }

        return null;
    });
