const express = require('express');
const cors = require('cors');
const { processAPK } = require('./services/processor');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');

// Startup logging
console.log('=== DexProtector Processor Starting ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PORT from env:', process.env.PORT);
console.log('========================================');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Google Cloud clients
const storage = new Storage();
const firestore = new Firestore();

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
    // Update job status to processing
    await firestore.collection('jobs').doc(jobId).update({
      status: 'processing',
      startedAt: Firestore.FieldValue.serverTimestamp(),
    });

    // Process the APK
    const result = await processAPK({
      jobId,
      userId,
      inputFile,
      configXml,
      storage,
      firestore,
    });

    // Update job status to completed
    await firestore.collection('jobs').doc(jobId).update({
      status: 'completed',
      completedAt: Firestore.FieldValue.serverTimestamp(),
      outputFile: result.outputFile,
      processingTime: result.processingTime,
    });

    console.log(`[${jobId}] Processing completed successfully`);
    res.status(200).json({ success: true, outputFile: result.outputFile });
  } catch (error) {
    console.error(`[${jobId}] Processing failed:`, error);

    // Update job status to failed
    await firestore.collection('jobs').doc(jobId).update({
      status: 'failed',
      failedAt: Firestore.FieldValue.serverTimestamp(),
      error: error.message,
    });

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
