# DexProtector SaaS Platform

A modern, cloud-based SaaS platform for protecting Android applications using Licel DexProtector.

## Features

- 🔐 Secure APK protection with DexProtector
- 💳 Credit-based payment system with Stripe
- ☁️ Serverless architecture with Google Cloud
- 🚀 Fast, isolated processing with Cloud Run
- 📱 Modern web interface with Next.js
- 🔒 Firebase Authentication & Authorization
- 📊 Real-time job tracking and history
- ⚙️ Customizable protection configurations

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Authentication**: Firebase Auth (Google, Email/Password)
- **Database**: Firestore
- **Storage**: Google Cloud Storage
- **Processing**: Cloud Run with Docker containers
- **Payments**: Stripe
- **Queue**: Cloud Tasks

## Critical Note

DexProtector requires the system time to be set to **February 1, 2025**. This is handled automatically using `libfaketime` in isolated Docker containers.

## Project Structure

```
dexprotector-saas/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and configs
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── backend/              # Cloud Run processing service
│   ├── src/
│   │   ├── handlers/     # Request handlers
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── Dockerfile        # Container with libfaketime
│   └── entrypoint.sh     # Container entry point
├── shared/               # Shared types and utilities
│   └── types/            # Shared TypeScript types
├── functions/            # Firebase Cloud Functions (optional)
└── docs/                 # Documentation

```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- Google Cloud account
- Firebase project
- Stripe account
- DexProtector license (dexprotector.jar)

### Setup Instructions

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

### Development

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
```

### Deployment

```bash
# Deploy frontend to Firebase Hosting
npm run deploy

# Build and deploy Cloud Run service
cd backend
gcloud run deploy dexprotector-processor --source .
```

## Environment Variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for all required environment variables.

## License

Proprietary - All Rights Reserved

## Security

This platform handles sensitive APK files. See [docs/SECURITY.md](docs/SECURITY.md) for security considerations.
