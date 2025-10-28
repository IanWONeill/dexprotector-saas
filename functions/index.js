const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

// Credit packages configuration
const CREDIT_PACKAGES = {
    'price_1SLx6hKdyWMKWoqkYKjSCZzA': { credits: 10, name: 'Starter' },
    'price_1SLx7uKdyWMKWoqkzQeVpNpG': { credits: 50, name: 'Professional' },
    'price_1SLx8dKdyWMKWoqkapfgJqRN': { credits: 100, name: 'Business' },
    'price_1SLx9iKdyWMKWoqkmURWWEB8': { credits: 500, name: 'Enterprise' },
};

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

    const { priceId } = data;
    const userId = context.auth.uid;

    // Validate price ID
    if (!CREDIT_PACKAGES[priceId]) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid price ID'
        );
    }

    try {
        // Get user email
        const userDoc = await db.collection('users').doc(userId).get();
        const userEmail = userDoc.exists ? userDoc.data().email : context.auth.token.email;

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
            success_url: `${data.origin || 'https://dexprotector-saas-ian.web.app'}/dashboard?payment=success`,
            cancel_url: `${data.origin || 'https://dexprotector-saas-ian.web.app'}/pricing?payment=cancelled`,
            customer_email: userEmail,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                priceId: priceId,
                credits: CREDIT_PACKAGES[priceId].credits,
            },
        });

        return { sessionId: session.id, url: session.url };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to create checkout session: ' + error.message
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
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object);
            break;

        case 'payment_intent.succeeded':
            console.log('Payment intent succeeded:', event.data.object.id);
            break;

        case 'payment_intent.payment_failed':
            console.log('Payment intent failed:', event.data.object.id);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session) {
    console.log('Processing completed checkout session:', session.id);

    const userId = session.metadata.userId || session.client_reference_id;
    const priceId = session.metadata.priceId;
    const credits = parseInt(session.metadata.credits);

    if (!userId || !credits) {
        console.error('Missing userId or credits in session metadata:', session.metadata);
        return;
    }

    try {
        // Check if this session was already processed
        const transactionRef = db.collection('transactions').doc(session.id);
        const existingTransaction = await transactionRef.get();

        if (existingTransaction.exists) {
            console.log('Transaction already processed:', session.id);
            return;
        }

        // Add credits to user account
        const userRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
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
                price: session.amount_total / 100, // Convert from cents to dollars
                currency: session.currency,
                stripeSessionId: session.id,
                stripePaymentIntent: session.payment_intent,
                priceId: priceId,
                packageName: CREDIT_PACKAGES[priceId]?.name || 'Unknown',
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        console.log(`Successfully added ${credits} credits to user ${userId}`);
    } catch (error) {
        console.error('Error processing checkout completion:', error);
        throw error;
    }
}

/**
 * Get user's transaction history
 */
exports.getTransactions = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const userId = context.auth.uid;
    const limit = data.limit || 50;

    try {
        const transactionsSnapshot = await db
            .collection('transactions')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const transactions = [];
        transactionsSnapshot.forEach((doc) => {
            transactions.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString(),
            });
        });

        return { transactions };
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch transactions'
        );
    }
});

/**
 * Firestore Trigger: Process APK when job is updated with inputFile
 * Automatically triggers backend processing when inputFile is added to job document
 */
exports.processJob = functions.firestore
    .document('jobs/{jobId}')
    .onUpdate(async (change, context) => {
        const jobId = context.params.jobId;
        const beforeData = change.before.data();
        const afterData = change.after.data();

        // Only trigger if inputFile was just added and status is still pending
        if (!beforeData.inputFile && afterData.inputFile && afterData.status === 'pending') {
            console.log(`[${jobId}] Job updated with inputFile, triggering backend processing`);
        } else {
            console.log(`[${jobId}] Job updated but not triggering (already has inputFile or not pending)`);
            return null;
        }

        // Backend Cloud Run URL
        const BACKEND_URL = 'https://dexprotector-processor-65sqz4zwra-uc.a.run.app';

        // Call the backend processing service (fire-and-forget)
        // Don't wait for response since processing can take minutes
        const fetch = require('node-fetch');
        
        fetch(`${BACKEND_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobId: jobId,
                userId: afterData.userId,
                inputFile: afterData.inputFile,
                configXml: afterData.configXml,
            }),
        }).then(response => {
            if (response.ok) {
                console.log(`[${jobId}] Backend processing request sent successfully`);
            } else {
                console.error(`[${jobId}] Backend returned ${response.status}`);
            }
        }).catch(error => {
            console.error(`[${jobId}] Error sending request to backend:`, error.message);
        });

        console.log(`[${jobId}] Backend processing initiated (async)`);
        return { success: true, jobId };
    });
