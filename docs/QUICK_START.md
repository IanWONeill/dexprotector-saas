# Quick Start Guide

Get DexProtector SaaS up and running in 15 minutes.

## Prerequisites

Install these tools:
- [Node.js 18+](https://nodejs.org/)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- DexProtector license (`dexprotector.jar`)

## Step 1: Clone and Setup (2 minutes)

```bash
cd dexprotector-saas

# Copy your DexProtector JAR
cp /path/to/dexprotector.jar backend/dexprotector.jar

# Verify it's there
ls backend/dexprotector.jar
```

## Step 2: Google Cloud Setup (5 minutes)

```bash
# Login
gcloud auth login

# Create project
gcloud projects create dexprotector-saas --name="DexProtector SaaS"
gcloud config set project dexprotector-saas

# Enable APIs (this takes 2-3 minutes)
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    firestore.googleapis.com \
    storage.googleapis.com

# Create storage bucket
gsutil mb -l us-central1 gs://dexprotector-saas-files
```

## Step 3: Firebase Setup (3 minutes)

```bash
# Login
firebase login

# Initialize (select: Firestore, Hosting, Storage)
firebase init

# Use existing project: dexprotector-saas
# Use default settings for everything
```

## Step 4: Configure Firebase (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **General**
4. Under "Your apps", click Web icon (</>)
5. Register app: "DexProtector SaaS"
6. Copy the config values

Create `frontend/.env.local`:
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local and paste your Firebase config
```

## Step 5: Deploy Everything (5 minutes)

```bash
# Make deploy script executable (Mac/Linux)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

For Windows, use Git Bash or run commands manually:
```bash
cd backend
gcloud run deploy dexprotector-processor --source . --region us-central1

cd ../frontend
npm install
npm run build
firebase deploy --only hosting
```

## Step 6: Test It Out

1. Visit your Firebase Hosting URL (shown after deployment)
2. Click "Sign Up"
3. Create an account (you'll get 10 free credits)
4. Go to Dashboard > Protect APK
5. Upload a test APK
6. Click "Protect APK"
7. Wait for processing (1-3 minutes)
8. Download protected APK

## Troubleshooting

### "gcloud: command not found"
Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install

### "firebase: command not found"
```bash
npm install -g firebase-tools
```

### "dexprotector.jar not found"
```bash
cp /path/to/your/dexprotector.jar backend/dexprotector.jar
```

### "Permission denied" on deploy.sh
```bash
chmod +x deploy.sh
```

### Backend deployment fails
Check Docker is running:
```bash
docker ps
```

### Frontend build fails
Delete node_modules and reinstall:
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

## What's Next?

- [ ] **Set up Stripe** for payments (see [SETUP.md](SETUP.md#step-3-stripe-setup))
- [ ] **Configure custom domain** (optional)
- [ ] **Set up monitoring** (Cloud Monitoring)
- [ ] **Review security rules** (firestore.rules, storage.rules)
- [ ] **Add team members** (IAM permissions)

## Need Help?

- Full setup guide: [docs/SETUP.md](SETUP.md)
- Architecture docs: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Deployment guide: [docs/DEPLOYMENT.md](DEPLOYMENT.md)

## Common Commands

```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View frontend URL
firebase hosting:channel:list

# Update backend only
cd backend && gcloud run deploy dexprotector-processor --source .

# Update frontend only
cd frontend && npm run build && firebase deploy --only hosting

# View all deployments
gcloud run services list
firebase projects:list
```

## Development Mode

Run locally for development:

```bash
# Backend (requires Docker)
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

## Cost Management

Set up budget alerts to avoid surprises:

```bash
# Create budget alert at $100
gcloud billing budgets create \
    --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --display-name="DexProtector Budget" \
    --budget-amount=100USD \
    --threshold-rule=percent=80
```

Check current costs:
- Visit: https://console.cloud.google.com/billing

## Support

- GitHub Issues: [Report a bug](https://github.com/yourorg/dexprotector-saas/issues)
- Documentation: Full docs in `/docs` folder
- Email: support@yourdomain.com

---

**Estimated setup time**: 15-20 minutes
**Estimated cost**: $0-5/month for testing (with free tier)
**Production cost**: ~$30/month per 1000 jobs
