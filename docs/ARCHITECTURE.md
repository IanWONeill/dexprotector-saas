# System Architecture

Comprehensive architecture documentation for DexProtector SaaS.

## Overview

DexProtector SaaS is a serverless, cloud-based platform that allows users to protect Android APK files using Licel DexProtector software. The system uses a credit-based payment model and processes APKs in isolated Docker containers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│                     (Next.js 14 + React)                        │
└────────────┬─────────────────────────────────────┬──────────────┘
             │                                     │
             │ Authentication                      │ File Upload/Download
             │                                     │
    ┌────────▼────────┐                  ┌────────▼────────┐
    │  Firebase Auth  │                  │ Cloud Storage   │
    │  (Google OAuth) │                  │  (APK Files)    │
    └─────────────────┘                  └─────────────────┘
                                                   │
             ┌─────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │   Firestore     │ ◄──┐
    │   (Database)    │    │ Updates
    └────────┬────────┘    │
             │              │
             │ New Job      │
             │ Trigger      │
             │              │
    ┌────────▼────────┐    │
    │ Cloud Functions │    │
    │  (Orchestrator) │    │
    └────────┬────────┘    │
             │              │
             │ Create Task  │
             │              │
    ┌────────▼────────┐    │
    │  Cloud Tasks    │    │
    │    (Queue)      │    │
    └────────┬────────┘    │
             │              │
             │ HTTP Request │
             │              │
    ┌────────▼────────────┐│
    │    Cloud Run        ││
    │  (Docker Container) ││
    │                     ││
    │  ┌───────────────┐  ││
    │  │  libfaketime  │  ││
    │  │ (Time=Feb 1)  │  ││
    │  ├───────────────┤  ││
    │  │ DexProtector  │  ││
    │  │     .jar      │  ││
    │  ├───────────────┤  ││
    │  │ Node.js API   │  ││
    │  └───────────────┘  ││
    └─────────────────────┘│
             │              │
             │ Update Job   │
             └──────────────┘
                    │
                    │ Upload Protected APK
                    │
          ┌─────────▼─────────┐
          │  Cloud Storage    │
          │  (Output Files)   │
          └───────────────────┘
```

## Component Details

### 1. Frontend (Next.js 14)

**Technology**: Next.js 14 with App Router, TypeScript, Tailwind CSS

**Responsibilities**:
- User authentication (Firebase Auth)
- File upload interface
- Configuration UI for DexProtector options
- Job status tracking
- Credit management
- Payment processing (Stripe)

**Key Features**:
- Static export for Firebase Hosting
- Real-time job updates via Firestore listeners
- Chunked file uploads for large APKs
- Responsive design
- Progressive Web App capabilities

**File Structure**:
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── pricing/      # Pricing page
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   │   ├── firebase.ts   # Firebase config
│   │   └── configGenerator.ts  # XML generation
│   └── types/            # TypeScript types
└── public/               # Static assets
```

### 2. Firebase Services

#### Firebase Authentication
- Email/Password authentication
- Google OAuth provider
- User session management
- Secure token generation

#### Firestore Database
**Collections**:
- `users`: User profiles and credit balances
- `jobs`: APK protection job records
- `transactions`: Credit purchase history
- `admins`: Admin user list (optional)

**Security**: Row-level security with Firestore Rules

#### Cloud Storage
**Buckets**:
- `users/{userId}/inputs/{jobId}/`: Uploaded APK files
- `users/{userId}/outputs/{jobId}/`: Protected APK files

**Features**:
- Automatic encryption at rest
- Lifecycle policies (auto-delete after 30 days)
- Signed URLs for secure download
- 120MB file size limit

### 3. Cloud Run Processing Service

**Technology**: Node.js + Express + Docker

**Container Specifications**:
- Base Image: `eclipse-temurin:17-jre-jammy`
- Memory: 4-8 GB (configurable)
- CPU: 2-4 vCPU (configurable)
- Timeout: 15 minutes
- Concurrency: 1 (one job per container)

**Key Components**:

1. **libfaketime**: Manipulates system time without root access
   ```
   ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/faketime/libfaketime.so.1
   ENV FAKETIME="2025-02-01 00:00:00"
   ```

2. **DexProtector JAR**: The actual protection software

3. **Node.js API**: HTTP server that receives job requests

**Processing Flow**:
1. Receive job request via HTTP POST
2. Download APK from Cloud Storage
3. Generate DexProtector XML config
4. Execute DexProtector with faketime
5. Upload protected APK to Cloud Storage
6. Update job status in Firestore

### 4. Cloud Functions

**Purpose**: Orchestrate job processing and handle events

**Functions**:

1. **onJobCreated**: Triggered when new job document created
   - Creates Cloud Task for processing
   - Validates user has sufficient credits

2. **onPaymentComplete**: Stripe webhook handler
   - Adds credits to user account
   - Creates transaction record

3. **cleanupOldJobs**: Scheduled function
   - Deletes old job records (30+ days)
   - Cleans up orphaned files

### 5. Cloud Tasks

**Purpose**: Queue system for reliable job processing

**Configuration**:
- Max concurrent dispatches: 10
- Max attempts: 3
- Rate limits: Configurable

**Benefits**:
- Retry logic with exponential backoff
- Rate limiting to prevent overload
- Guaranteed delivery
- Distributed across zones

### 6. Stripe Integration

**Products**:
- Starter: 10 credits - $9.99
- Professional: 50 credits - $39.99
- Business: 100 credits - $69.99
- Enterprise: 500 credits - $299.99

**Workflow**:
1. User clicks "Purchase" on pricing page
2. Frontend creates Stripe Checkout Session
3. User completes payment on Stripe
4. Stripe webhook notifies Cloud Function
5. Credits added to user account
6. Transaction recorded in Firestore

## Data Flow

### APK Protection Flow

1. **User uploads APK** → Cloud Storage (`inputs/`)
2. **Job document created** → Firestore
3. **Cloud Function triggered** → Creates Cloud Task
4. **Cloud Task dispatched** → HTTP request to Cloud Run
5. **Cloud Run processes APK**:
   - Downloads from Storage
   - Runs DexProtector
   - Uploads to Storage (`outputs/`)
6. **Job status updated** → Firestore
7. **User notified** → Real-time Firestore listener
8. **User downloads** → Signed URL from Cloud Storage

### Credit Purchase Flow

1. **User selects package** → Pricing page
2. **Checkout session created** → Stripe API
3. **User pays** → Stripe hosted checkout
4. **Webhook received** → Cloud Function
5. **Credits added** → Firestore update
6. **Transaction recorded** → Firestore
7. **User redirected** → Dashboard

## Security Architecture

### Authentication & Authorization

```
User Request
    ↓
Firebase Auth Token (JWT)
    ↓
Verified by Firebase SDK
    ↓
User ID extracted
    ↓
Firestore Rules check ownership
    ↓
Access granted/denied
```

### Data Protection

1. **Encryption at Rest**:
   - Firestore: Automatic encryption
   - Cloud Storage: AES-256 encryption
   - Cloud Run: Encrypted environment variables

2. **Encryption in Transit**:
   - HTTPS/TLS 1.3 for all connections
   - mTLS between Google Cloud services

3. **Access Control**:
   - Firestore Rules: Row-level security
   - Cloud Storage Rules: File-level permissions
   - IAM: Service account permissions
   - Cloud Run: No public access to processing endpoint

4. **Data Isolation**:
   - Each job runs in isolated container
   - User files stored in separate paths
   - No data sharing between users

### Security Best Practices

- ✅ No credentials in code (use Secret Manager)
- ✅ Principle of least privilege (IAM roles)
- ✅ Input validation on all endpoints
- ✅ Rate limiting on API endpoints
- ✅ APK malware scanning (optional with VirusTotal)
- ✅ Audit logging enabled
- ✅ Regular security updates

## Scalability

### Horizontal Scaling

**Cloud Run**:
- Auto-scales from 0 to N instances
- Each instance handles 1 concurrent job
- Max instances configurable (default: 10)
- Cold start: ~2-3 seconds

**Firestore**:
- Automatic sharding
- 1M+ concurrent connections
- Unlimited reads/writes per second

**Cloud Storage**:
- Globally distributed
- 5000 writes/second per bucket
- Unlimited storage

### Performance Optimization

1. **Caching**:
   - Frontend: Static assets cached via CDN
   - Backend: Container image layers cached

2. **Compression**:
   - Gzip compression for API responses
   - Image optimization for frontend

3. **Database Optimization**:
   - Composite indexes for queries
   - Pagination for large result sets

4. **Monitoring**:
   - Cloud Monitoring dashboards
   - Custom metrics for job processing time
   - Error rate alerts

## Cost Breakdown

### Per 1000 Jobs/Month

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Run | 1000 jobs × 3 min × 4GB | $15 |
| Cloud Storage | 120GB × 1 month | $3 |
| Firestore | 3000 reads + 3000 writes | $2 |
| Cloud Functions | 3000 invocations | $0.40 |
| Cloud Tasks | 3000 tasks | $0.40 |
| Networking | ~100GB egress | $10 |
| **Total** | | **~$31/month** |

### Revenue Projection

| Package | Sales | Revenue | Cost | Profit |
|---------|-------|---------|------|--------|
| Starter (10) | 100 | $999 | $3 | $996 |
| Professional (50) | 200 | $7,998 | $6 | $7,992 |
| Business (100) | 100 | $6,999 | $3 | $6,996 |
| **Total** | 400 packages | **$15,996** | **$31** | **$15,965** |

**Gross Margin**: ~99.8%

### Cost Optimization Tips

1. Set max instances on Cloud Run
2. Use lifecycle policies for Storage
3. Enable request compression
4. Use Cloud CDN for frontend
5. Optimize Docker image size
6. Use preemptible VMs for non-critical tasks

## Monitoring & Observability

### Key Metrics

1. **Business Metrics**:
   - Total users
   - Active users (DAU/MAU)
   - Credits purchased
   - Credits consumed
   - Revenue (MRR/ARR)

2. **Technical Metrics**:
   - Job success rate
   - Average processing time
   - Error rate
   - API latency (p50, p95, p99)
   - Cloud Run instance count

3. **Infrastructure Metrics**:
   - CPU utilization
   - Memory utilization
   - Network egress
   - Storage usage
   - Function execution time

### Logging

**Structured Logging**:
```json
{
  "severity": "INFO",
  "message": "Job processing started",
  "jobId": "abc123",
  "userId": "user456",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Log Aggregation**:
- Cloud Logging (Stackdriver)
- Log retention: 30 days
- Log-based metrics for alerting

### Alerting

**Critical Alerts**:
- Error rate > 5%
- Job processing time > 10 minutes
- Cloud Run instance count > 50
- Budget exceeded

**Warning Alerts**:
- Error rate > 2%
- Job processing time > 5 minutes
- Storage usage > 80%

## Disaster Recovery

### Backup Strategy

1. **Firestore**: Daily automated exports to Cloud Storage
2. **Cloud Storage**: Cross-region replication (optional)
3. **Code**: Git repository with tags for releases

### Recovery Procedures

**RTO (Recovery Time Objective)**: 1 hour
**RPO (Recovery Point Objective)**: 24 hours

**Scenarios**:

1. **Cloud Run failure**:
   - Automatic: Health checks + auto-restart
   - Manual: Rollback to previous revision

2. **Firestore data loss**:
   - Restore from daily backup
   - Replay transactions from logs

3. **Complete project loss**:
   - Recreate project from Infrastructure as Code
   - Restore data from backups
   - Redeploy from Git

## Future Enhancements

### Short Term (1-3 months)
- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] APK analysis and class selection UI
- [ ] Batch processing
- [ ] API for programmatic access

### Medium Term (3-6 months)
- [ ] Multi-region deployment
- [ ] Advanced analytics dashboard
- [ ] Team/organization accounts
- [ ] ProGuard mapping file support
- [ ] Custom DexProtector configurations

### Long Term (6-12 months)
- [ ] iOS app protection
- [ ] Self-service admin panel
- [ ] White-label solution
- [ ] Enterprise SLA
- [ ] On-premise deployment option

## Compliance & Regulations

### Data Privacy
- GDPR compliant (user data deletion)
- CCPA compliant (California)
- User data encrypted at rest and in transit
- Data retention policies enforced

### Security Standards
- SOC 2 Type II (via Google Cloud)
- ISO 27001 (via Google Cloud)
- Regular security audits
- Vulnerability scanning

## Support & Maintenance

### Regular Maintenance
- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Architecture review

### Support Channels
- Email: support@dexprotector-saas.com
- Documentation: docs.dexprotector-saas.com
- Status Page: status.dexprotector-saas.com
- GitHub: github.com/yourorg/dexprotector-saas

---

Last Updated: January 2025
Version: 1.0
