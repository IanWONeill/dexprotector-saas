# Enhanced Pricing Model - DexProtector SaaS

## 🎯 New Tiered Credit System

### Overview
Different protection levels cost different amounts of credits based on:
- Complexity of configuration
- Processing power required
- Custom signing requirements
- Advanced features enabled

---

## 💰 Credit Pricing Structure

### Protection Tiers

| Tier | Credits | Features | Use Case |
|------|---------|----------|----------|
| **Basic** | 1 credit | Default config, default signing | Quick protection, testing |
| **Standard** | 2 credits | Preset config, default signing, package filtering | Production apps |
| **Advanced** | 3 credits | All DP features, default signing, full customization | High-value apps |
| **Custom** | 5 credits | Full control, custom keystore, all options | Enterprise/sensitive apps |

---

## 📋 Feature Comparison

### 1. Basic Protection (1 Credit)
**Quick & Simple**

✅ **Included**:
- String encryption
- Hide access
- Basic RASP (report mode)
- Default configuration
- **Signed with platform default key**
- No user input required

❌ **Not Included**:
- Class encryption
- Package filtering
- Custom configuration
- Custom signing key

**Perfect for**: Quick testing, demo apps, low-risk applications

---

### 2. Standard Protection (2 Credits)
**Recommended for Production**

✅ **Included**:
- Everything in Basic
- Class encryption
- Native library encryption
- Resource encryption (full)
- **Package/class filtering** (NEW!)
- RASP in exit mode
- **Signed with platform default key**

❌ **Not Included**:
- JNI obfuscation
- Custom signing key
- Full XML customization

**Perfect for**: Production apps, commercial applications, standard security needs

---

### 3. Advanced Protection (3 Credits)
**Maximum Pre-configured Security**

✅ **Included**:
- Everything in Standard
- JNI obfuscation
- All RASP features (maximum)
- **Advanced package filtering** (include/exclude patterns)
- **ProGuard mapping support**
- Certificate pinning options
- **Signed with platform default key**

❌ **Not Included**:
- Custom signing key
- Raw XML editing

**Perfect for**: Banking apps, fintech, healthcare, high-security apps

---

### 4. Custom Protection (5 Credits)
**Full Control & Enterprise**

✅ **Included**:
- **Everything in Advanced**
- **Upload your own signing keystore**
- **Full XML configuration editor**
- **All DexProtector options exposed**
- Signing configuration (key alias, passwords)
- Advanced build settings
- Custom ProGuard rules
- Certificate transparency
- Public key pinning
- Complete control over all settings

**Perfect for**: Enterprise apps, maximum customization, specific compliance needs

---

## 🔐 Signing Configuration

### Default Platform Signing (Tiers 1-3)

**We provide a platform signing key**:
- Generated securely by platform
- Stored in Cloud Secret Manager
- Automatically applied to all APKs
- Same key for consistency
- Users can re-sign later if needed

**Advantages**:
- No user setup required
- Fast processing
- Lower cost

**Note**: Users can always re-sign the APK with their own key after download using `jarsigner` or Android Studio.

### Custom Signing (Tier 4 Only)

**Users upload their own keystore**:
- Upload `.jks` or `.keystore` file
- Provide key alias
- Provide key password
- Provide store password
- APK signed with user's key

**Advantages**:
- Matches original signing
- Upload directly to Play Store
- Full control
- Production-ready

---

## 🎨 UI/UX Flow

### Basic Protection
```
1. Upload APK
2. Click "Basic Protection" (1 credit)
3. Submit
4. Download protected APK
```

**Configuration**: None needed (all defaults)

---

### Standard Protection
```
1. Upload APK
2. Select "Standard Protection" (2 credits)
3. (Optional) Specify packages to protect:
   ├─ Include: com.myapp.*
   └─ Exclude: com.myapp.test.*
4. Submit
5. Download protected APK
```

**Configuration**:
- Package filter (tree view or text input)
- Include/exclude patterns

---

### Advanced Protection
```
1. Upload APK
2. Select "Advanced Protection" (3 credits)
3. Configure:
   ├─ Package filtering (advanced patterns)
   ├─ ProGuard mapping file (upload)
   ├─ Certificate pinning (optional)
   └─ RASP behavior customization
4. Submit
5. Download protected APK
```

**Configuration**:
- Advanced package filtering with glob patterns
- ProGuard mapping upload
- RASP feature toggles
- Network security options

---

### Custom Protection
```
1. Upload APK
2. Select "Custom Protection" (5 credits)
3. Configure Protection:
   ├─ All Advanced options
   ├─ Raw XML editor (for experts)
   └─ All DexProtector features
4. Configure Signing:
   ├─ Upload keystore file (.jks)
   ├─ Enter key alias
   ├─ Enter passwords
   └─ Verify configuration
5. Submit
6. Download signed & protected APK
```

**Configuration**:
- Everything from Advanced
- XML editor with validation
- Keystore upload
- Signing configuration
- All DexProtector options

---

## 📦 Updated Credit Packages

### Credit Bundles (Updated Pricing)

| Package | Credits | Price | Avg. Cost/APK | Best For |
|---------|---------|-------|---------------|----------|
| **Starter** | 10 | $9.99 | $1.00/basic | Testing (10 basic APKs) |
| **Developer** | 25 | $22.99 | $0.92/credit | Small teams (5 standard, 5 basic) |
| **Professional** | 50 | $39.99 | $0.80/credit | Production (16 standard APKs) |
| **Business** | 150 | $99.99 | $0.67/credit | Multiple apps (30 custom APKs) |
| **Enterprise** | 500 | $299.99 | $0.60/credit | High volume (100 custom APKs) |

### Example Usage Calculations

**Starter Package** (10 credits = $9.99):
- 10× Basic protections, OR
- 5× Standard protections, OR
- 3× Advanced protections, OR
- 2× Custom protections

**Professional Package** (50 credits = $39.99):
- 50× Basic ($0.80 each)
- 25× Standard ($1.60 each)
- 16× Advanced ($2.50 each)
- 10× Custom ($4.00 each)

---

## 🛠️ Technical Implementation

### 1. Package/Class Filtering

**Frontend Component**: `PackageFilterUI.tsx`
```typescript
interface PackageFilter {
  includePatterns: string[];  // ['com.myapp.*', 'com.example.core.*']
  excludePatterns: string[];  // ['com.myapp.test.*', '*.BuildConfig']
}
```

**UI Features**:
- Text input for glob patterns
- APK analysis to show available packages
- Tree view of APK structure
- Toggle individual packages/classes

### 2. Default Signing Key

**Backend Setup**:
```bash
# Generate platform default key (one-time)
keytool -genkey -v \
  -keystore platform-default.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias platform-key \
  -storepass [SECURE_PASSWORD] \
  -keypass [SECURE_PASSWORD]

# Store in Google Secret Manager
gcloud secrets create dexprotector-platform-keystore \
  --data-file=platform-default.jks
```

**Backend Usage**:
```javascript
// Tiers 1-3: Use platform key
if (tier !== 'custom') {
  const keystorePath = await downloadPlatformKeystore();
  signAPK(outputPath, keystorePath, 'platform-key', PASSWORD);
}

// Tier 4: Use user's key
else {
  const userKeystorePath = await downloadUserKeystore(userId, jobId);
  signAPK(outputPath, userKeystorePath, userAlias, userPassword);
}
```

### 3. Custom Keystore Upload

**Frontend Flow**:
```typescript
// Upload keystore to Cloud Storage
const keystoreRef = ref(storage, `users/${userId}/keystores/${jobId}.jks`);
await uploadBytes(keystoreRef, keystoreFile);

// Store signing config in Firestore
await updateDoc(jobDoc, {
  signingConfig: {
    keystorePath: `users/${userId}/keystores/${jobId}.jks`,
    keyAlias: userAlias,
    keyPassword: encrypt(keyPassword),    // Encrypted
    storePassword: encrypt(storePassword), // Encrypted
  }
});
```

**Security**:
- Passwords encrypted at rest
- Keystore deleted after processing
- No persistent storage of passwords

### 4. XML Configuration Editor

**For Custom Tier Only**:

```typescript
<XMLEditor
  value={configXml}
  onChange={setConfigXml}
  onValidate={validateXML}
  schema={dexprotectorSchema}
/>
```

Features:
- Syntax highlighting
- XML validation
- Auto-complete for DexProtector tags
- Error messages for invalid config
- Preview of generated XML

---

## 📊 Updated Firestore Schema

### Job Document

```javascript
{
  userId: "user123",
  tier: "standard",           // NEW: basic | standard | advanced | custom
  creditsUsed: 2,            // NEW: Track credits per job
  status: "pending",

  // APK files
  inputFile: "users/user123/inputs/job456/app.apk",
  outputFile: "users/user123/outputs/job456/protected.apk",

  // Configuration
  config: {
    tier: "standard",
    packageFilter: {          // NEW: Standard+
      includePatterns: ["com.myapp.*"],
      excludePatterns: ["*.test.*"]
    },
    protectionOptions: {      // Existing
      stringEncryption: true,
      classEncryption: true,
      // ... etc
    }
  },

  // Signing (Custom tier only)
  signingConfig: {            // NEW: Custom tier
    keystorePath: "users/user123/keystores/job456.jks",
    keyAlias: "my-key",
    keyPasswordEncrypted: "...",
    storePasswordEncrypted: "..."
  },

  // ProGuard mapping (Advanced+ tiers)
  proguardMapping: {          // NEW: Advanced+
    filePath: "users/user123/mappings/job456/mapping.txt"
  },

  // Generated XML
  configXml: "<?xml...",

  // Timestamps
  createdAt: Timestamp,
  completedAt: Timestamp,
  processingTime: 125000
}
```

---

## 🎨 Updated Frontend Structure

### New Components Needed

```
frontend/src/components/
├── protection/
│   ├── TierSelector.tsx          # Choose tier (1-5 credits)
│   ├── PackageFilter.tsx         # Package/class selection (Standard+)
│   ├── AdvancedOptions.tsx       # Advanced features (Advanced+)
│   ├── XMLEditor.tsx             # Raw XML editing (Custom only)
│   ├── KeystoreUpload.tsx        # Custom keystore (Custom only)
│   └── SigningConfig.tsx         # Signing settings (Custom only)
└── apk/
    ├── APKAnalyzer.tsx           # Parse and show APK structure
    └── PackageTree.tsx           # Tree view of packages/classes
```

### Updated Protection Flow Page

```typescript
// frontend/src/app/dashboard/protect/page.tsx

const [tier, setTier] = useState<'basic' | 'standard' | 'advanced' | 'custom'>('basic');
const [packageFilter, setPackageFilter] = useState<PackageFilter>({
  includePatterns: [],
  excludePatterns: []
});
const [signingConfig, setSigningConfig] = useState<SigningConfig | null>(null);
const [customXml, setCustomXml] = useState<string>('');

// Calculate credits based on tier
const creditsRequired = {
  basic: 1,
  standard: 2,
  advanced: 3,
  custom: 5
}[tier];
```

---

## 📝 Implementation Checklist

### Phase 1: Tiered Pricing (Week 1)
- [ ] Update types with tier enum
- [ ] Add tier selector UI
- [ ] Update credit deduction logic
- [ ] Update pricing page with new structure
- [ ] Test credit calculations

### Phase 2: Package Filtering (Week 2)
- [ ] Create APK parser utility
- [ ] Build package tree component
- [ ] Add filter input UI
- [ ] Generate filtered XML config
- [ ] Test with real APKs

### Phase 3: Default Signing (Week 3)
- [ ] Generate platform keystore
- [ ] Store in Secret Manager
- [ ] Add signing logic to backend
- [ ] Test APK signing
- [ ] Verify APK installation

### Phase 4: Custom Tier (Week 4)
- [ ] Build XML editor component
- [ ] Add keystore upload UI
- [ ] Encrypt/decrypt password handling
- [ ] Backend signing with custom key
- [ ] Security audit
- [ ] End-to-end testing

---

## 💡 Revenue Impact

### Current Model
- 1 credit = 1 job
- Revenue: $0.70-0.99 per job

### New Model
- 1-5 credits per job based on tier
- Average: ~2.5 credits per job (assuming 40% standard, 30% basic, 20% advanced, 10% custom)
- Revenue: **$1.75-2.50 per job** (2.5× increase)

### Projected Revenue (1000 Jobs/Month)

**Credit Usage**:
- 300 basic (300 credits)
- 400 standard (800 credits)
- 200 advanced (600 credits)
- 100 custom (500 credits)
- **Total: 2,200 credits**

**Revenue**: 2,200 credits × $0.70 avg = **$1,540/month**
(vs $700/month with flat 1-credit model)

**Profit**: $1,540 - $31 costs = **$1,509/month** (98% margin)

---

## 🎯 User Value Proposition

### Why Pay More for Custom?

**Value Delivered**:
1. **Production-ready APK** - No need to re-sign
2. **Upload to Play Store** - Signed with your key
3. **Full control** - All DexProtector features
4. **Security compliance** - Meet specific requirements
5. **Enterprise support** - Priority processing

**Cost Comparison**:
- DexProtector License: $2,000-10,000+ per year
- Our Custom Tier: $3-5 per APK (pay as you go)
- **Savings: 95%+** vs buying license

---

**This enhanced model provides better value to users AND increases revenue by 2-3×!** 🚀
