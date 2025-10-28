# DexProtector SaaS - Android App Protection Platform

A cloud-based SaaS platform for protecting Android applications using Licel DexProtector.

## Features

- 🔐 Enterprise-grade APK protection powered by Licel DexProtector
- 💳 Credit-based system (5 free credits on signup)
- ☁️ Serverless architecture with Google Cloud
- 🚀 Fast, isolated processing with Cloud Run
- 📱 Modern web interface with Next.js 14
- 🔒 Firebase Authentication (Email/Password + Google OAuth)
- 📊 Real-time job tracking and history
- ⚙️ Customizable DexProtector configurations

## Architecture

- **Frontend**: Next.js 14.1.0 (Static Export) + TypeScript + Tailwind CSS
- **Hosting**: Firebase Hosting
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Backend**: Node.js 18 + Express on Cloud Run
- **Processing**: DexProtector with libfaketime in Docker containers

## URLs

- **Frontend**: https://dexprotector-saas-ian.web.app
- **Backend**: https://dexprotector-processor-447369235479.us-central1.run.app
- **Firebase Console**: https://console.firebase.google.com/project/dexprotector-saas-ian

## Critical Notes

### DexProtector License

DexProtector requires the system time to be set to **February 1, 2025**. This is handled automatically using `libfaketime` in the Docker container.

### Firebase SDK Version

**Must use Firebase 9.23.0** - Do not upgrade to v10+ as it breaks Next.js static export with undici module.

## Project Structure

```
dexprotector-saas/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Firebase config and utilities
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── backend/              # Cloud Run processing service
│   ├── src/
│   │   ├── handlers/     # Request handlers
│   │   ├── services/     # DexProtector processing logic
│   │   └── utils/        # Utilities
│   ├── Dockerfile        # Container with libfaketime
│   ├── dexprotector.jar  # DexProtector binary
│   └── dexprotector.licel # DexProtector license
├── docs/                 # Documentation
├── firestore.rules       # Firestore security rules
├── storage.rules         # Firebase Storage security rules
├── firebase.json         # Firebase configuration
├── CLAUDE.md            # AI assistant memory/context
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud SDK
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with:
  - Authentication enabled (Email/Password + Google)
  - Firestore database
  - Firebase Storage
- DexProtector license files:
  - `dexprotector.jar`
  - `dexprotector.licel`

### Quick Start

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

### Development

```bash
# Frontend development
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000

# Backend development (requires Docker)
cd backend
npm install
docker build -t dexprotector-processor .
docker run -p 8080:8080 dexprotector-processor
```

### Deployment

```bash
# Deploy Frontend
cd frontend
npm run build
firebase deploy --only hosting

# Deploy Backend
cd backend
gcloud run deploy dexprotector-processor
  --source .
  --region us-central1
  --allow-unauthenticated
  --memory 2Gi
  --timeout 600
  --clear-base-image

# Deploy Firestore Rules
firebase deploy --only firestore:rules

# Deploy Storage Rules (Manual via Firebase Console)
# CLI deployment is currently broken
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System architecture and design
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Quick Start](docs/QUICK_START.md) - Get started quickly
- [Deployment](docs/DEPLOYMENT.md) - Deployment procedures
- [CLAUDE.md](CLAUDE.md) - AI assistant memory and troubleshooting

## Current Status

✅ **Deployed and Working:**

- Frontend (Firebase Hosting)
- Backend (Cloud Run)
- Authentication (Email + Google OAuth)
- User registration with 5 free credits
- APK upload to Firebase Storage
- Firestore job tracking

⏳ **In Progress:**

- Backend APK processing integration
- Job status updates
- Protected APK downloads
- Credit deduction system

## Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## License

Proprietary - All Rights Reserved

```

## Environment Variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for all required environment variables.

## License

Proprietary - All Rights Reserved

## Security

This platform handles sensitive APK files. See [docs/SECURITY.md](docs/SECURITY.md) for security considerations.
```
