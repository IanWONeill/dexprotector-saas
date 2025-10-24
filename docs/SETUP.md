# DexProtector SaaS - Setup Guide

Complete guide to set up and deploy the DexProtector SaaS platform.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Google Cloud Account** ([Sign up](https://cloud.google.com/))
- **Firebase Account** (included with Google Cloud)
- **Stripe Account** ([Sign up](https://stripe.com/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **DexProtector License** (`dexprotector.jar` file)

## Step 1: Google Cloud Setup

### 1.1 Create a New Project

```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create a new project
gcloud projects create dexprotector-saas --name="DexProtector SaaS"

# Set as active project
gcloud config set project dexprotector-saas

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudtasks.googleapis.com
```

### 1.2 Create Cloud Storage Bucket

```bash
# Create bucket for APK files
gsutil mb -l us-central1 gs://dexprotector-saas-files

# Set lifecycle policy (auto-delete after 30 days)
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://dexprotector-saas-files
```

## Step 2: Firebase Setup

### 2.1 Initialize Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project directory
firebase init

# Select:
# - Firestore
# - Hosting
# - Storage
```

### 2.2 Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **General**
4. Scroll to **Your apps** and click **Web app** icon
5. Register your app and copy the config

### 2.3 Enable Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google**
4. Add authorized domains

### 2.4 Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

## Step 3: Stripe Setup

### 3.1 Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** > **Add product**
3. Create products for each credit package:

   - **Starter**: 10 credits for $9.99
   - **Professional**: 50 credits for $39.99
   - **Business**: 100 credits for $69.99
   - **Enterprise**: 500 credits for $299.99

4. Copy the **Price IDs** for each product

### 3.2 Get API Keys

1. Go to **Developers** > **API keys**
2. Copy your **Publishable key** and **Secret key**

## Step 4: Backend Setup (Cloud Run)

### 4.1 Prepare DexProtector

```bash
# Copy your dexprotector.jar to the backend directory
cp /path/to/dexprotector.jar backend/dexprotector.jar
```

### 4.2 Build and Deploy

```bash
cd backend

# Build Docker image
gcloud builds submit --tag gcr.io/dexprotector-saas/processor

# Deploy to Cloud Run
gcloud run deploy dexprotector-processor \
  --image gcr.io/dexprotector-saas/processor \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=dexprotector-saas \
  --set-env-vars GCS_BUCKET_NAME=dexprotector-saas-files

# Get the service URL
gcloud run services describe dexprotector-processor \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

## Step 5: Frontend Setup

### 5.1 Configure Environment Variables

```bash
cd frontend

# Copy example env file
cp .env.example .env.local

# Edit .env.local with your values
# - Firebase configuration
# - Stripe publishable key
# - Cloud Run URL
```

### 5.2 Install Dependencies

```bash
npm install
```

### 5.3 Test Locally

```bash
npm run dev
# Visit http://localhost:3000
```

### 5.4 Deploy to Firebase Hosting

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
npm run deploy

# Or use Firebase CLI directly
firebase deploy --only hosting
```

## Step 6: Cloud Functions (Job Orchestration)

Create a Cloud Function to trigger processing when a job is created:

```bash
# Create functions directory
mkdir -p functions
cd functions

# Initialize
npm init -y
npm install firebase-admin firebase-functions @google-cloud/tasks

# Create index.js
```

Example Cloud Function (`functions/index.js`):

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { CloudTasksClient } = require('@google-cloud/tasks');

admin.initializeApp();
const client = new CloudTasksClient();

exports.onJobCreated = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobId = context.params.jobId;
    const job = snap.data();

    // Create Cloud Task to trigger processing
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = 'us-central1';
    const queue = 'dexprotector-jobs';

    const parent = client.queuePath(project, location, queue);

    const task = {
      httpRequest: {
        httpMethod: 'POST',
        url: process.env.CLOUD_RUN_URL + '/process',
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify({
          jobId,
          userId: job.userId,
          inputFile: job.inputFile,
          configXml: job.configXml,
        })).toString('base64'),
      },
    };

    await client.createTask({ parent, task });
  });
```

Deploy Cloud Functions:

```bash
firebase deploy --only functions
```

## Step 7: Create Cloud Tasks Queue

```bash
gcloud tasks queues create dexprotector-jobs \
  --location=us-central1 \
  --max-concurrent-dispatches=10 \
  --max-attempts=3
```

## Step 8: Testing

### 8.1 Test Authentication

1. Visit your deployed frontend URL
2. Sign up with email/password
3. Sign in with Google
4. Verify you receive 10 free credits

### 8.2 Test APK Upload

1. Login to dashboard
2. Click "Protect APK"
3. Upload a test APK (< 120MB)
4. Configure protection settings
5. Click "Protect APK"
6. Verify job appears in dashboard

### 8.3 Monitor Processing

```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dexprotector-processor" --limit 50

# Check Firestore for job status
# Visit Firebase Console > Firestore > jobs collection
```

## Step 9: Monitoring & Alerts

### 9.1 Set Up Cloud Monitoring

```bash
# Create alert policy for failed jobs
# Visit Cloud Console > Monitoring > Alerting
```

### 9.2 Enable Error Reporting

```bash
gcloud services enable clouderrorreporting.googleapis.com
```

## Step 10: Security Hardening

### 10.1 Enable VPC Connector (Optional)

For additional security, connect Cloud Run to a VPC:

```bash
gcloud compute networks vpc-access connectors create dexprotector-connector \
  --region=us-central1 \
  --range=10.8.0.0/28

gcloud run services update dexprotector-processor \
  --vpc-connector=dexprotector-connector \
  --vpc-egress=private-ranges-only \
  --region=us-central1
```

### 10.2 Enable Binary Authorization

```bash
gcloud services enable binaryauthorization.googleapis.com
```

## Troubleshooting

### DexProtector License Issues

If you see license errors, verify:
- `FAKETIME` environment variable is set to `2025-02-01 00:00:00`
- `libfaketime` is installed in Docker container
- `LD_PRELOAD` is set correctly

### Upload Failures

Check:
- Cloud Storage bucket permissions
- Storage rules in Firebase
- File size limits

### Processing Timeouts

Adjust Cloud Run settings:
```bash
gcloud run services update dexprotector-processor \
  --timeout=900 \
  --memory=8Gi \
  --cpu=4
```

## Cost Optimization

1. **Set max instances** to prevent runaway costs:
   ```bash
   gcloud run services update dexprotector-processor --max-instances=10
   ```

2. **Use Cloud Storage Lifecycle** policies to auto-delete old files

3. **Monitor usage** in Cloud Console billing dashboard

4. **Set budget alerts**:
   - Go to Cloud Console > Billing > Budgets & alerts
   - Create budget with email notifications

## Next Steps

- [ ] Configure custom domain for Firebase Hosting
- [ ] Set up email templates for transactional emails
- [ ] Implement Stripe webhooks for payment verification
- [ ] Add usage analytics with Google Analytics
- [ ] Create admin dashboard for user management
- [ ] Set up automated backups for Firestore

## Support

For issues or questions:
- Check logs: `gcloud logging read`
- Firebase Console: https://console.firebase.google.com/
- Cloud Console: https://console.cloud.google.com/

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` files to Git
- Keep `dexprotector.jar` private (add to `.gitignore`)
- Rotate API keys regularly
- Enable 2FA on all accounts
- Review Firestore and Storage rules regularly
