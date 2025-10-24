# Deployment Guide

Quick deployment checklist for the DexProtector SaaS platform.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase project created and configured
- [ ] Google Cloud project created with APIs enabled
- [ ] Stripe products and prices created
- [ ] `dexprotector.jar` file available
- [ ] Docker Desktop installed and running

## Quick Deploy Commands

### 1. Deploy Backend to Cloud Run

```bash
cd backend

# Make sure dexprotector.jar is in this directory
ls dexprotector.jar

# Build and deploy in one command
gcloud run deploy dexprotector-processor \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project) \
  --set-env-vars GCS_BUCKET_NAME=$(gcloud config get-value project)-files
```

### 2. Deploy Frontend to Firebase Hosting

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy
firebase deploy --only hosting
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

### 5. Deploy Cloud Functions (if using)

```bash
cd functions
npm install
firebase deploy --only functions
```

## Verification Steps

### Check Backend Deployment

```bash
# Get Cloud Run URL
BACKEND_URL=$(gcloud run services describe dexprotector-processor \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

echo "Backend URL: $BACKEND_URL"

# Test health endpoint
curl $BACKEND_URL/health
```

### Check Frontend Deployment

```bash
# Get Firebase Hosting URL
firebase hosting:channel:list

# Test frontend
# Visit the URL in your browser
```

### Check Firestore Rules

```bash
firebase firestore:rules:release
```

## Rollback Procedure

### Rollback Backend

```bash
# List revisions
gcloud run revisions list \
  --service=dexprotector-processor \
  --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic dexprotector-processor \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

### Rollback Frontend

```bash
# List previous releases
firebase hosting:channel:list

# Rollback using Firebase Console
# Go to Hosting > Release history > Rollback
```

## Update Deployment

### Update Backend Only

```bash
cd backend
gcloud run deploy dexprotector-processor \
  --source . \
  --region us-central1
```

### Update Frontend Only

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Update Configuration Only

```bash
# Update Cloud Run environment variables
gcloud run services update dexprotector-processor \
  --update-env-vars KEY=VALUE \
  --region us-central1

# Update Firestore rules
firebase deploy --only firestore:rules

# Update Storage rules
firebase deploy --only storage:rules
```

## Monitoring After Deployment

### View Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dexprotector-processor" \
  --limit 50 \
  --format json

# Frontend logs (Firebase Console)
# Visit: https://console.firebase.google.com/project/PROJECT_ID/hosting/sites

# Cloud Functions logs
firebase functions:log
```

### Monitor Performance

```bash
# Cloud Run metrics
gcloud monitoring dashboards list

# Or visit Cloud Console
echo "https://console.cloud.google.com/run/detail/us-central1/dexprotector-processor/metrics?project=$(gcloud config get-value project)"
```

## Production Checklist

Before going live:

- [ ] Enable HTTPS/SSL (automatic with Firebase Hosting)
- [ ] Configure custom domain
- [ ] Set up monitoring and alerts
- [ ] Configure budget alerts
- [ ] Enable error reporting
- [ ] Set up backup procedures
- [ ] Test payment flow end-to-end
- [ ] Test APK protection end-to-end
- [ ] Load test the backend
- [ ] Review security rules
- [ ] Set up status page (optional)
- [ ] Prepare support documentation

## Custom Domain Setup

### Firebase Hosting

```bash
# Add custom domain
firebase hosting:channel:deploy production --only hosting

# Or use Firebase Console
# Hosting > Add custom domain
# Follow DNS configuration steps
```

### Cloud Run Custom Domain

```bash
# Map custom domain to Cloud Run
gcloud run domain-mappings create \
  --service=dexprotector-processor \
  --domain=api.yourdomain.com \
  --region=us-central1
```

## Scaling Configuration

### Auto-scaling Backend

```bash
# Set min/max instances
gcloud run services update dexprotector-processor \
  --min-instances=0 \
  --max-instances=20 \
  --region=us-central1

# Set concurrency (requests per instance)
gcloud run services update dexprotector-processor \
  --concurrency=10 \
  --region=us-central1
```

### Increase Resources

```bash
# For larger APKs or faster processing
gcloud run services update dexprotector-processor \
  --memory=8Gi \
  --cpu=4 \
  --region=us-central1
```

## Backup Procedures

### Firestore Backup

```bash
# Set up automated backups
gcloud firestore export gs://$(gcloud config get-value project)-backups

# Or use Firebase Console
# Firestore > Import/Export > Export
```

### Storage Backup

```bash
# Copy to backup bucket
gsutil -m rsync -r gs://$(gcloud config get-value project)-files gs://$(gcloud config get-value project)-files-backup
```

## Cost Management

### Set Spending Limits

```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="DexProtector SaaS Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### Review Costs

```bash
# Check current costs
gcloud billing accounts list
gcloud billing projects describe $(gcloud config get-value project)

# Or visit Cloud Console > Billing
```

## Emergency Procedures

### Stop All Processing

```bash
# Scale Cloud Run to 0
gcloud run services update dexprotector-processor \
  --max-instances=0 \
  --region=us-central1
```

### Disable New Signups

1. Go to Firebase Console
2. Authentication > Sign-in method
3. Disable Email/Password and Google providers

### Emergency Rollback

```bash
# Rollback everything
cd backend
gcloud run services update-traffic dexprotector-processor --to-revisions=PREVIOUS_REVISION=100

cd ../frontend
firebase hosting:channel:delete production
firebase hosting:channel:deploy production --only hosting
```

## Support Contacts

- **Google Cloud Support**: https://cloud.google.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Stripe Support**: https://support.stripe.com/

## Useful Commands

```bash
# View all deployed services
gcloud run services list

# View all Cloud Functions
firebase functions:list

# View all Firestore indexes
firebase firestore:indexes

# View Cloud Storage buckets
gsutil ls

# Check project configuration
gcloud config list
firebase projects:list
```
