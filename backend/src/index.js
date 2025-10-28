const express = require('express');
const cors = require('cors');
const { processAPK } = require('./services/processor');
const { validateTierCredits, getConfigForTier } = require('./utils/configGenerator');
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');

// Startup logging
console.log('=== DexProtector Processor Starting ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PORT from env:', process.env.PORT);
console.log('========================================');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Google Cloud clients with explicit project ID
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'dexprotector-saas-ian';
console.log('Initializing with project:', PROJECT_ID);

const storage = new Storage({ projectId: PROJECT_ID });

// Initialize Firebase Admin SDK (bypasses Firestore security rules)
admin.initializeApp({
    projectId: PROJECT_ID,
    // In Cloud Run, credentials are automatically detected via Application Default Credentials
});

// Get Firestore with explicit settings
const firestore = admin.firestore();
firestore.settings({
    ignoreUndefinedProperties: true,
});

// Test Firestore connectivity on startup
(async () => {
    try {
        console.log('Testing Firestore connectivity...');
        const testPromise = firestore.collection('_test').doc('connection').get();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        );

        await Promise.race([testPromise, timeoutPromise]);
        console.log('✓ Firestore connection successful (using Firebase Admin SDK)');
    } catch (error) {
        console.error('✗ Firestore connection failed:', error.message);
        console.error('  Stack:', error.stack);
        console.error('  This will cause issues with job processing!');
    }
})();

// Helper function to add timeout to async operations
function withTimeout(promise, timeoutMs, operation) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main processing endpoint
app.post('/process', async (req, res) => {
    const { jobId, userId, inputFile, configXml } = req.body;

    if (!jobId || !userId || !inputFile) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`[${jobId}] Starting processing for user ${userId}`);
    console.log(`[${jobId}] Input file: ${inputFile}`);

    try {
        // Fetch job document to get tier and credits
        console.log(`[${jobId}] Fetching job document...`);
        const jobDoc = await withTimeout(
            firestore.collection('jobs').doc(jobId).get(),
            10000,
            'Firestore job fetch'
        );

        if (!jobDoc.exists) {
            throw new Error('Job not found');
        }

        const jobData = jobDoc.data();
        const { configTier, creditsUsed } = jobData;

        if (!configTier) {
            throw new Error('Job missing configTier');
        }

        console.log(`[${jobId}] Tier: ${configTier}, Credits: ${creditsUsed}`);

        // Validate credits match tier (prevent client manipulation)
        validateTierCredits(configTier, creditsUsed);
        console.log(`[${jobId}] Tier/credits validation passed`);

        // Get validated config (regenerate for presets, use provided for custom)
        const validatedConfigXml = getConfigForTier(configTier, configXml);
        console.log(`[${jobId}] Configuration validated for tier: ${configTier}`);

        // Update job status to processing with timeout
        console.log(`[${jobId}] Updating status to processing...`);

        await withTimeout(
            firestore.collection('jobs').doc(jobId).update({
                status: 'processing',
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            10000,
            'Firestore update to processing'
        );
        console.log(`[${jobId}] Status updated to processing`);

        // Process the APK with validated config
        console.log(`[${jobId}] Starting APK processing...`);
        const result = await processAPK({
            jobId,
            userId,
            inputFile,
            configXml: validatedConfigXml,
            storage,
            firestore,
        });
        console.log(`[${jobId}] APK processing completed`);

        // Update job status to completed with timeout
        console.log(`[${jobId}] Updating status to completed...`);
        await withTimeout(
            firestore.collection('jobs').doc(jobId).update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                outputFile: result.outputFile,
                processingTime: result.processingTime,
            }),
            10000,
            'Firestore update to completed'
        );

        console.log(`[${jobId}] Processing completed successfully`);
        res.status(200).json({ success: true, outputFile: result.outputFile });
    } catch (error) {
        console.error(`[${jobId}] Processing failed:`, error);
        console.error(`[${jobId}] Error stack:`, error.stack);

        // Update job status to failed
        try {
            await firestore.collection('jobs').doc(jobId).update({
                status: 'failed',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
                error: error.message,
            });
            console.log(`[${jobId}] Status updated to failed`);
        } catch (updateError) {
            console.error(`[${jobId}] Failed to update status to failed:`, updateError);
        }

        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`DexProtector Processor running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Fake time enabled: ${process.env.FAKETIME || 'not set'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
