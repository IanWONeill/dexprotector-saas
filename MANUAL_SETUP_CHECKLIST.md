# Manual Setup Checklist - What YOU Need to Do

This is your personal checklist for getting DexProtector SaaS running. Check off each item as you complete it.

## 🎯 Critical Path to Working Platform (30-45 minutes)

### Phase 1: Prerequisites (10 minutes)

- [ ] **Get DexProtector JAR file**
  - Copy `dexprotector.jar` to `backend/` directory
  - Verify: `ls backend/dexprotector.jar` should show the file
  - ⚠️ **This is REQUIRED** - nothing will work without it

- [ ] **Install Google Cloud SDK**
  - Download: https://cloud.google.com/sdk/docs/install
  - Run: `gcloud --version` to verify
  - Login: `gcloud auth login`

- [ ] **Install Firebase CLI**
  - Run: `npm install -g firebase-tools`
  - Verify: `firebase --version`
  - Login: `firebase login`

- [ ] **Install Node.js 18+**
  - Download: https://nodejs.org/
  - Verify: `node --version` (should be 18+)

- [ ] **Install Docker Desktop**
  - Download: https://www.docker.com/products/docker-desktop/
  - Start Docker Desktop
  - Verify: `docker ps` (should not error)

### Phase 2: Google Cloud Setup (10 minutes)

- [ ] **Create Google Cloud Project**
  ```bash
  gcloud projects create dexprotector-saas-prod --name="DexProtector SaaS"
  gcloud config set project dexprotector-saas-prod
  ```

- [ ] **Enable Billing**
  - Go to: https://console.cloud.google.com/billing
  - Link a billing account to your project
  - ⚠️ **Required** - Can't deploy without billing

- [ ] **Enable Required APIs**
  ```bash
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable run.googleapis.com
  gcloud services enable firestore.googleapis.com
  gcloud services enable storage.googleapis.com
  gcloud services enable cloudtasks.googleapis.com
  ```
  (This takes 2-3 minutes)

- [ ] **Create Storage Bucket**
  ```bash
  gsutil mb -l us-central1 gs://dexprotector-saas-prod-files
  ```

### Phase 3: Firebase Setup (5 minutes)

- [ ] **Initialize Firebase in Project**
  ```bash
  cd C:\Users\iano2\OneDrive\Desktop\test-project
  firebase init
  ```

  Select these options:
  - [x] Firestore
  - [x] Hosting
  - [x] Storage
  - Use existing project: `dexprotector-saas-prod`
  - Firestore rules file: `firestore.rules` (already exists)
  - Firestore indexes: `firestore.indexes.json` (already exists)
  - Public directory: `frontend/out`
  - Single-page app: YES
  - Storage rules: `storage.rules` (already exists)

- [ ] **Get Firebase Config**
  1. Go to: https://console.firebase.google.com/
  2. Select your project
  3. Click gear icon ⚙️ → Project settings
  4. Scroll to "Your apps" section
  5. Click web icon `</>`
  6. Register app name: "DexProtector SaaS Web"
  7. **Copy the firebaseConfig object**

- [ ] **Enable Firebase Authentication**
  1. In Firebase Console → Authentication
  2. Click "Get started"
  3. Enable "Email/Password" provider
  4. Enable "Google" provider
  5. Add your domain when deploying

### Phase 4: Configure Environment Variables (5 minutes)

- [ ] **Frontend Configuration**
  ```bash
  cd frontend
  cp .env.example .env.local
  ```

  Edit `frontend/.env.local` and paste your Firebase config:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
  NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
  ```

- [ ] **Backend Configuration**
  ```bash
  cd backend
  cp .env.example .env
  ```

  Edit `backend/.env`:
  ```
  GOOGLE_CLOUD_PROJECT=dexprotector-saas-prod
  GCS_BUCKET_NAME=dexprotector-saas-prod-files
  NODE_ENV=production
  ```

### Phase 5: Deploy to Cloud (10 minutes)

- [ ] **Deploy Backend to Cloud Run**
  ```bash
  cd backend

  # Make sure dexprotector.jar is here!
  ls dexprotector.jar

  # Deploy (this takes 5-7 minutes first time)
  gcloud run deploy dexprotector-processor \
    --source . \
    --platform managed \
    --region us-central1 \
    --memory 4Gi \
    --cpu 2 \
    --timeout 900 \
    --max-instances 10 \
    --allow-unauthenticated
  ```

- [ ] **Get Backend URL**
  ```bash
  gcloud run services describe dexprotector-processor \
    --platform managed \
    --region us-central1 \
    --format 'value(status.url)'
  ```
  Save this URL for later

- [ ] **Deploy Firebase Rules**
  ```bash
  cd ..
  firebase deploy --only firestore:rules,firestore:indexes,storage:rules
  ```

- [ ] **Build and Deploy Frontend**
  ```bash
  cd frontend
  npm install
  npm run build
  firebase deploy --only hosting
  ```

- [ ] **Get Frontend URL**
  ```bash
  firebase hosting:channel:list
  ```
  Your site URL will be shown (e.g., `https://your-project.web.app`)

### Phase 6: Test Everything (10 minutes)

- [ ] **Test Authentication**
  1. Visit your Firebase Hosting URL
  2. Click "Get Started" or "Sign Up"
  3. Try Email/Password signup
  4. Try Google OAuth signup
  5. Verify you see 10 free credits in dashboard

- [ ] **Test APK Upload (Without Processing)**
  1. Go to Dashboard → "Protect APK"
  2. Drag and drop any APK file (< 120MB)
  3. Select "Basic Protection"
  4. Click "Protect APK"
  5. Check job appears in dashboard (will be "pending")

- [ ] **Check Cloud Run Logs**
  ```bash
  gcloud logging read "resource.type=cloud_run_revision" --limit 20
  ```
  Should see processing attempts (may fail if DexProtector license issues)

- [ ] **Verify Firestore Data**
  - Go to: https://console.firebase.google.com/
  - Firestore Database
  - Should see: `users` and `jobs` collections

---

## ⚠️ Known Issues & Solutions

### Issue: DexProtector License Error
**Symptom**: Jobs fail with license errors
**Solution**: The `libfaketime` should handle this, but if it fails:
1. Check logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 50`
2. Verify FAKETIME is set: Should see "FAKETIME=2025-02-01 00:00:00" in logs
3. Check DexProtector JAR is valid

### Issue: "Permission Denied" on Upload
**Symptom**: Can't upload APK files
**Solution**: Check Storage rules are deployed:
```bash
firebase deploy --only storage:rules
```

### Issue: Frontend Build Fails
**Symptom**: `npm run build` fails
**Solution**:
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Backend Won't Deploy
**Symptom**: Cloud Run deployment fails
**Solution**:
- Check Docker is running: `docker ps`
- Check billing is enabled
- Check `dexprotector.jar` exists in backend/

---

## 📝 What to Remember for Future Sessions

### Repository Info
- **GitHub**: https://github.com/IanWONeill/dexprotector-saas.git
- **Branch**: main
- **Private**: Yes 🔒

### Project Structure
```
dexprotector-saas/
├── frontend/          # Next.js app
├── backend/           # Cloud Run service (needs dexprotector.jar)
├── docs/             # All documentation
├── firestore.rules   # Database security
├── storage.rules     # File storage security
└── deploy.sh         # Automated deployment
```

### Key Files You Created
- `frontend/.env.local` - Firebase config (NOT in Git)
- `backend/.env` - Backend config (NOT in Git)
- `backend/dexprotector.jar` - DexProtector software (NOT in Git)

### Important Commands
```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Redeploy backend
cd backend && gcloud run deploy dexprotector-processor --source .

# Redeploy frontend
cd frontend && npm run build && firebase deploy --only hosting

# Check costs
gcloud billing accounts list
```

### URLs to Bookmark
- Firebase Console: https://console.firebase.google.com/
- Google Cloud Console: https://console.cloud.google.com/
- Cloud Run: https://console.cloud.google.com/run
- Your App: (URL from firebase hosting:channel:list)

---

## 🚀 Next Steps After Basic Setup

### Immediate (This Week)
- [ ] Set up Stripe account and products
- [ ] Add Stripe API keys to `.env.local`
- [ ] Test payment flow end-to-end
- [ ] Set up budget alerts in Google Cloud

### Soon (This Month)
- [ ] Configure custom domain
- [ ] Set up monitoring and alerts
- [ ] Create support email
- [ ] Add terms of service and privacy policy
- [ ] Test with real APK files

### Later (Next Quarter)
- [ ] Implement email notifications
- [ ] Add APK class picker UI
- [ ] Build admin dashboard
- [ ] Add usage analytics
- [ ] Marketing and launch

---

## 💰 Cost Tracking

### Free Tier Limits (You Won't Pay)
- Cloud Run: 2M requests/month free
- Firestore: 50K reads, 20K writes/day free
- Cloud Storage: 5GB free
- Firebase Hosting: 10GB/month free
- Authentication: 50K MAU free

### When You'll Start Paying
- After ~100-200 jobs in a month
- Expected: $0-5/month during testing
- Production: ~$30/month per 1000 jobs

### Set Budget Alert
```bash
# Visit: https://console.cloud.google.com/billing/budgets
# Create alert at $50/month
```

---

## 🆘 If You Get Stuck

### Quick Diagnostics
```bash
# Check everything is configured
gcloud config list
firebase projects:list
node --version
docker ps

# Check what's deployed
gcloud run services list
firebase hosting:channel:list

# View recent errors
gcloud logging read "severity>=ERROR" --limit 20
```

### Documentation
- Quick Start: `docs/QUICK_START.md`
- Full Setup: `docs/SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`
- Deployment: `docs/DEPLOYMENT.md`

### Get Help
- Check logs first
- Review error messages
- Search docs folder
- Check Stack Overflow
- Review Google Cloud/Firebase docs

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ You can sign up and see 10 credits
2. ✅ You can upload an APK file
3. ✅ Job appears in dashboard
4. ✅ Job status changes (pending → processing → completed/failed)
5. ✅ No errors in Cloud Run logs
6. ✅ Can download protected APK (if job succeeds)

**Current Status**: Not yet set up
**Time to Complete**: 30-45 minutes
**Estimated Cost**: $0-5/month for testing

---

Last Updated: January 2025
Your Project: https://github.com/IanWONeill/dexprotector-saas
