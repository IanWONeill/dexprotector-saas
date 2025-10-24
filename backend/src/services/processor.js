const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'dexprotector-saas-files';
const DEXPROTECTOR_JAR = '/app/dexprotector.jar';

/**
 * Process an APK file with DexProtector
 * @param {Object} params - Processing parameters
 * @param {string} params.jobId - Unique job identifier
 * @param {string} params.userId - User ID
 * @param {string} params.inputFile - GCS path to input APK
 * @param {string} params.configXml - DexProtector XML configuration
 * @param {Object} params.storage - Google Cloud Storage client
 * @param {Object} params.firestore - Firestore client
 */
async function processAPK({ jobId, userId, inputFile, configXml, storage, firestore }) {
  const startTime = Date.now();
  const workDir = `/tmp/${jobId}`;

  try {
    // Create working directory
    await fs.mkdir(workDir, { recursive: true });
    console.log(`[${jobId}] Created working directory: ${workDir}`);

    // Download input APK from GCS
    const inputPath = path.join(workDir, 'input.apk');
    await downloadFromGCS(storage, inputFile, inputPath);
    console.log(`[${jobId}] Downloaded input APK`);

    // Create configuration XML file
    const configPath = path.join(workDir, 'dexprotector.xml');
    await fs.writeFile(configPath, configXml || getDefaultConfig());
    console.log(`[${jobId}] Created configuration file`);

    // Run DexProtector
    const outputPath = path.join(workDir, 'output.apk');
    console.log(`[${jobId}] Starting DexProtector...`);

    const command = `java -jar ${DEXPROTECTOR_JAR} -configFile ${configPath} ${inputPath} ${outputPath}`;
    console.log(`[${jobId}] Command: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    if (stdout) console.log(`[${jobId}] DexProtector stdout:`, stdout);
    if (stderr) console.log(`[${jobId}] DexProtector stderr:`, stderr);

    // Verify output file exists
    try {
      await fs.access(outputPath);
    } catch (error) {
      throw new Error('DexProtector did not produce output file');
    }

    // Upload output APK to GCS
    const outputFileName = `users/${userId}/outputs/${jobId}/protected.apk`;
    await uploadToGCS(storage, outputPath, outputFileName);
    console.log(`[${jobId}] Uploaded output APK to GCS`);

    // Cleanup
    await fs.rm(workDir, { recursive: true, force: true });
    console.log(`[${jobId}] Cleaned up working directory`);

    const processingTime = Date.now() - startTime;
    console.log(`[${jobId}] Processing completed in ${processingTime}ms`);

    return {
      outputFile: outputFileName,
      processingTime,
    };
  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error(`[${jobId}] Cleanup failed:`, cleanupError);
    }

    throw new Error(`DexProtector processing failed: ${error.message}`);
  }
}

/**
 * Download file from Google Cloud Storage
 */
async function downloadFromGCS(storage, gcsPath, localPath) {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(gcsPath);

  await file.download({ destination: localPath });
}

/**
 * Upload file to Google Cloud Storage
 */
async function uploadToGCS(storage, localPath, gcsPath) {
  const bucket = storage.bucket(BUCKET_NAME);

  await bucket.upload(localPath, {
    destination: gcsPath,
    metadata: {
      cacheControl: 'no-cache',
    },
  });
}

/**
 * Get default DexProtector configuration
 */
function getDefaultConfig() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<config xmlns="http://www.licelus.com/products/dexprotector">
  <!-- Build Settings -->
  <verbose>true</verbose>
  <optimize>true</optimize>

  <!-- String Encryption -->
  <stringEncryption>
    <include>glob:**</include>
  </stringEncryption>

  <!-- Hide Access -->
  <hideAccess>
    <include>glob:**</include>
  </hideAccess>

  <!-- Resource Encryption -->
  <resourceEncryption>
    <assets>
      <include>glob:**</include>
    </assets>
  </resourceEncryption>

  <!-- RASP Features -->
  <antiDebug>report</antiDebug>
  <antiEmulator>report</antiEmulator>
  <antiManualInstall>report</antiManualInstall>

  <!-- Runtime Checks -->
  <runtimeChecks>report</runtimeChecks>
</config>`;
}

module.exports = {
  processAPK,
};
