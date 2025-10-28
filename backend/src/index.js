const express = require('express');
const cors = require('cors');
const { processAPK } = require('./services/processor');
const { validateTierCredits, getConfigForTier } = require('./utils/configGenerator');
const { validateProcessRequest, sanitizeErrorMessage } = require('./utils/validation');
const { Logger } = require('./utils/logger');
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');

// Initialize logger
const logger = new Logger('api-server');

// Startup logging
logger.info('DexProtector Processor Starting', {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT,
});

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Google Cloud clients
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'dexprotector-saas-ian';
logger.info('Initializing cloud clients', { projectId: PROJECT_ID });

const storage = new Storage({ projectId: PROJECT_ID });

// Initialize Firebase Admin SDK
admin.initializeApp({ projectId: PROJECT_ID });

const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

// Test Firestore connectivity on startup
(async () => {
    try {
        logger.info('Testing Firestore connectivity...');
        const testPromise = firestore.collection('_test').doc('connection').get();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        );

        await Promise.race([testPromise, timeoutPromise]);
        logger.info('Firestore connection successful');
    } catch (error) {
        logger.error('Firestore connection failed', {
            error: error.message,
            stack: error.stack,
        });
    }
})();

/**
 * Add timeout to async operations
 * @param {Promise} promise - Promise to race
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operation - Operation name for error message
 * @returns {Promise}
 */
function withTimeout(promise, timeoutMs, operation) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
        });
    });

    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});

// Main processing endpoint
app.post('/process', async (req, res) => {
    const { jobId, userId, inputFile, configXml } = req.body;
    const jobLogger = logger.forJob(jobId);

    // Validate request
    const validation = validateProcessRequest(req.body);
    if (!validation.valid) {
        jobLogger.warn('Invalid request', { error: validation.error });
        return res.status(400).json({ error: validation.error });
    }

    jobLogger.info('Processing request received', {
        userId,
        inputFile,
    });

    try {
        // Fetch job document
        jobLogger.debug('Fetching job document');
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

        jobLogger.info('Job metadata retrieved', {
            tier: configTier,
            credits: creditsUsed,
        });

        // Validate credits match tier (security check)
        validateTierCredits(configTier, creditsUsed);
        jobLogger.debug('Tier/credits validation passed');

        // Get validated config
        const validatedConfigXml = getConfigForTier(configTier, configXml);
        jobLogger.debug('Configuration validated', { tier: configTier });

        // Update job status to processing
        jobLogger.debug('Updating status to processing');
        const processingBatch = firestore.batch();
        processingBatch.update(firestore.collection('jobs').doc(jobId), {
            status: 'processing',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Clear any previous error from failed attempts
            error: null,
            failedAt: null,
        });
        await withTimeout(
            processingBatch.commit(),
            10000,
            'Firestore processing status batch'
        );

        // Process the APK
        jobLogger.info('Starting APK processing');
        const result = await processAPK({
            jobId,
            userId,
            inputFile,
            configXml: validatedConfigXml,
            storage,
            firestore,
            logger: jobLogger,
        });

        // Update job status to completed
        jobLogger.debug('Updating status to completed');
        const completionBatch = firestore.batch();
        completionBatch.update(firestore.collection('jobs').doc(jobId), {
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            outputFile: result.outputFile,
            processingTime: result.processingTime,
        });
        await withTimeout(
            completionBatch.commit(),
            10000,
            'Firestore completion batch'
        );

        jobLogger.info('Processing completed successfully', {
            outputFile: result.outputFile,
            processingTime: result.processingTime,
        });

        res.status(200).json({
            success: true,
            outputFile: result.outputFile,
            processingTime: result.processingTime,
        });
    } catch (error) {
        jobLogger.error('Processing failed', {
            error: error.message,
            stack: error.stack,
        });

        // Update job status to failed
        try {
            const failureBatch = firestore.batch();
            failureBatch.update(firestore.collection('jobs').doc(jobId), {
                status: 'failed',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
                error: error.message,
            });
            await failureBatch.commit();
            jobLogger.debug('Status updated to failed');
        } catch (updateError) {
            jobLogger.error('Failed to update status', {
                error: updateError.message,
            });
        }

        // Send sanitized error to client
        const sanitizedError = sanitizeErrorMessage(error);
        res.status(500).json({ error: sanitizedError });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
    });

    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    process.exit(1);
});
