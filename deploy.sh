#!/bin/bash

# DexProtector SaaS Deployment Script
# This script deploys the entire platform to Google Cloud and Firebase

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI not found. Please install: npm install -g firebase-tools"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install: https://nodejs.org/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log_error "Docker not found. Please install: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if dexprotector.jar exists
if [ ! -f "backend/dexprotector.jar" ]; then
    log_error "dexprotector.jar not found in backend/ directory"
    log_error "Please copy your DexProtector JAR file to backend/dexprotector.jar"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    log_error "No active GCP project. Run: gcloud config set project PROJECT_ID"
    exit 1
fi

log_info "Deploying to project: $PROJECT_ID"

# Confirm deployment
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deployment cancelled"
    exit 0
fi

# Deploy Backend
log_info "Deploying backend to Cloud Run..."
cd backend

gcloud run deploy dexprotector-processor \
    --source . \
    --platform managed \
    --region us-central1 \
    --memory 4Gi \
    --cpu 2 \
    --timeout 900 \
    --max-instances 10 \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
    --set-env-vars GCS_BUCKET_NAME=$PROJECT_ID-files

if [ $? -eq 0 ]; then
    log_info "Backend deployed successfully"
else
    log_error "Backend deployment failed"
    exit 1
fi

# Get Cloud Run URL
BACKEND_URL=$(gcloud run services describe dexprotector-processor \
    --platform managed \
    --region us-central1 \
    --format 'value(status.url)')

log_info "Backend URL: $BACKEND_URL"

cd ..

# Deploy Firestore Rules
log_info "Deploying Firestore rules..."
firebase deploy --only firestore:rules,firestore:indexes --project $PROJECT_ID

if [ $? -eq 0 ]; then
    log_info "Firestore rules deployed successfully"
else
    log_error "Firestore rules deployment failed"
    exit 1
fi

# Deploy Storage Rules
log_info "Deploying Storage rules..."
firebase deploy --only storage:rules --project $PROJECT_ID

if [ $? -eq 0 ]; then
    log_info "Storage rules deployed successfully"
else
    log_error "Storage rules deployment failed"
    exit 1
fi

# Deploy Frontend
log_info "Building frontend..."
cd frontend

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    log_warning ".env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    log_warning "Please edit frontend/.env.local with your configuration"
    log_warning "Then run this script again"
    exit 1
fi

npm install

if [ $? -eq 0 ]; then
    log_info "Dependencies installed"
else
    log_error "Failed to install dependencies"
    exit 1
fi

npm run build

if [ $? -eq 0 ]; then
    log_info "Frontend built successfully"
else
    log_error "Frontend build failed"
    exit 1
fi

log_info "Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting --project $PROJECT_ID

if [ $? -eq 0 ]; then
    log_info "Frontend deployed successfully"
else
    log_error "Frontend deployment failed"
    exit 1
fi

cd ..

# Get Firebase Hosting URL
FRONTEND_URL=$(firebase hosting:channel:list --project $PROJECT_ID | grep "live" | awk '{print $2}')

# Summary
log_info "========================================="
log_info "Deployment Complete!"
log_info "========================================="
log_info ""
log_info "Frontend URL: $FRONTEND_URL"
log_info "Backend URL: $BACKEND_URL"
log_info ""
log_info "Next steps:"
log_info "1. Configure custom domain (optional)"
log_info "2. Set up Stripe products and update pricing page"
log_info "3. Test authentication and file upload"
log_info "4. Set up monitoring and alerts"
log_info ""
log_info "View logs:"
log_info "  Backend: gcloud logging read 'resource.type=cloud_run_revision' --limit 50"
log_info "  Frontend: firebase hosting:channel:list"
log_info ""
log_info "========================================="
