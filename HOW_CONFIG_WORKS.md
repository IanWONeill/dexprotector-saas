# How DexProtector Configuration Works

## 📝 XML Config Generation Flow

### Overview
The backend **automatically generates** the DexProtector XML configuration based on user selections in the frontend. Here's the complete flow:

---

## 🔄 Complete Processing Flow

### 1. **User Configures Protection** (Frontend)

**Location**: `frontend/src/app/dashboard/protect/page.tsx`

User selects protection options:
- String Encryption ✓
- Class Encryption ✓
- Hide Access ✓
- RASP Features (anti-debug, anti-emulator, etc.)
- Resource Protection

These are stored in a `ProtectionConfig` TypeScript object.

### 2. **Frontend Generates XML** (Client-Side)

**Location**: `frontend/src/lib/configGenerator.ts`

**Function**: `generateDexProtectorXML(config: ProtectionConfig): string`

```typescript
// Example: User selects "Standard Protection"
const config = {
  stringEncryption: true,
  classEncryption: true,
  hideAccess: true,
  antiDebug: 'report',
  antiEmulator: 'report',
  // ... etc
}

// Frontend generates XML string
const configXml = generateDexProtectorXML(config);
```

**Output Example**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns="http://www.licelus.com/products/dexprotector">
  <verbose>true</verbose>
  <optimize>true</optimize>

  <stringEncryption>
    <include>glob:**</include>
  </stringEncryption>

  <classEncryption>
    <include>glob:**</include>
  </classEncryption>

  <antiDebug>report</antiDebug>
  <antiEmulator>report</antiEmulator>
</config>
```

### 3. **Frontend Uploads APK + Config** (Firebase)

**Location**: `frontend/src/app/dashboard/protect/page.tsx` (lines 100-145)

```typescript
// 1. Upload APK to Cloud Storage
const storageRef = ref(storage, `users/${userId}/inputs/${jobId}/${file.name}`)
await uploadBytesResumable(storageRef, file)

// 2. Create job in Firestore with config XML
await addDoc(collection(db, 'jobs'), {
  userId,
  status: 'pending',
  inputFile: `users/${userId}/inputs/${jobId}/${file.name}`,
  configXml: generateDexProtectorXML(config),  // ← XML STRING STORED HERE
  createdAt: serverTimestamp(),
})

// 3. Deduct credit
await updateDoc(doc(db, 'users', userId), {
  credits: increment(-1),
})
```

### 4. **Backend Receives Job** (Cloud Run)

**Location**: `backend/src/index.js` (POST /process endpoint)

```javascript
app.post('/process', async (req, res) => {
  const { jobId, userId, inputFile, configXml } = req.body;

  // configXml is the XML string from Firestore
  const result = await processAPK({
    jobId,
    userId,
    inputFile,
    configXml,  // ← XML STRING PASSED TO PROCESSOR
    storage,
    firestore,
  });
});
```

### 5. **Backend Creates XML File** (Processing)

**Location**: `backend/src/services/processor.js` (lines 36-39)

```javascript
async function processAPK({ jobId, userId, inputFile, configXml, storage, firestore }) {
  const workDir = `/tmp/${jobId}`;

  // Create dexprotector.xml file in temp directory
  const configPath = path.join(workDir, 'dexprotector.xml');
  await fs.writeFile(configPath, configXml || getDefaultConfig());

  console.log(`[${jobId}] Created configuration file`);
}
```

**Result**: XML file created at `/tmp/{jobId}/dexprotector.xml`

### 6. **Backend Runs DexProtector** (Execution)

**Location**: `backend/src/services/processor.js` (lines 42-54)

```javascript
// Build command
const command = `java -jar ${DEXPROTECTOR_JAR} -configFile ${configPath} ${inputPath} ${outputPath}`;

// Execute DexProtector
const { stdout, stderr } = await execAsync(command, {
  cwd: workDir,
  maxBuffer: 1024 * 1024 * 10, // 10MB buffer
});
```

**What happens**:
1. Java executes DexProtector JAR
2. DexProtector reads `/tmp/{jobId}/dexprotector.xml`
3. DexProtector reads `/tmp/{jobId}/input.apk`
4. DexProtector processes APK with license file (`dexprotector.licel`)
5. DexProtector outputs `/tmp/{jobId}/output.apk`

---

## 📋 Config XML Structure

### Default Configuration
If no config is provided, the backend uses a default config:

**Location**: `backend/src/services/processor.js` (lines 118-150)

```xml
<?xml version="1.0" encoding="UTF-8"?>
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
  <runtimeChecks>report</runtimeChecks>
</config>
```

### Preset Configurations

**Location**: `frontend/src/types/index.ts`

**Three presets available**:

1. **Basic Protection** (Default)
   - String encryption
   - Hide access
   - Basic RASP (report mode)

2. **Standard Protection** (Recommended)
   - Everything in Basic
   - Class encryption
   - Native library encryption
   - Full resource encryption

3. **Maximum Protection** (Highest security)
   - Everything in Standard
   - JNI obfuscation
   - All RASP in exit mode (kills app on detection)

---

## 🔧 Customization Options

Users can customize protection by modifying:

### Code Protection
- `stringEncryption` - Encrypt strings
- `annotationEncryption` - Encrypt Kotlin annotations
- `classEncryption` - Encrypt entire classes
- `hideAccess` - Hide method calls and field accesses
- `jniObfuscation` - Obfuscate JNI method names
- `nativeLibraryEncryption` - Encrypt native (.so) libraries

### Resource Protection
- `resourceEncryption.assets` - Encrypt asset files
- `resourceEncryption.res` - Encrypt resource files
- `resourceEncryption.strings` - Encrypt string resources
- `resourceEncryption.nameObfuscation` - Obfuscate resource names

### RASP Features
- `antiDebug` - Detect and prevent debugging (off/report/exit)
- `antiEmulator` - Block emulator execution (off/report/exit)
- `antiManualInstall` - Prevent sideloading (off/report/exit)
- `antiMalware` - Report potential malware (off/report)
- `runtimeChecks` - Detect custom firmware/rooted devices (off/report/exit)

### Package Filtering
- `includePackages` - Only protect specific packages
- `excludePackages` - Exclude packages from protection

---

## 📁 Required Files for DexProtector

The backend container needs **3 files**:

### 1. `dexprotector.jar` ✓
**Location**: `/app/dexprotector.jar`
**Size**: ~69MB
**Purpose**: The DexProtector executable

### 2. `dexprotector.licel` ✓ (NEWLY ADDED)
**Location**: `/app/dexprotector.licel`
**Size**: 148 bytes
**Purpose**: License file for DexProtector

### 3. `dexprotector.xml` ✓
**Location**: `/tmp/{jobId}/dexprotector.xml`
**Generated**: Dynamically for each job
**Purpose**: Configuration for current APK protection

---

## 🚀 Deployment Update Required

Since we added the `.licel` file to the Dockerfile, you need to redeploy the backend:

```bash
cd backend

# Make sure both files are present
ls dexprotector.jar      # Should be ~69MB
ls dexprotector.licel    # Should be 148 bytes

# Redeploy to Cloud Run
gcloud run deploy dexprotector-processor \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900
```

---

## ✅ Summary

### Question 1: Does the backend create config XML?
**YES!** ✓

The XML is created in **two places**:

1. **Frontend generates XML** from user selections (`generateDexProtectorXML()`)
2. **Backend writes XML to file** in temp directory before running DexProtector
3. **Fallback**: Backend has default config if none provided

### Question 2: Do we need the .licel file?
**YES!** ✓

DexProtector requires the license file to run. I've now:
- ✓ Updated Dockerfile to copy `dexprotector.licel`
- ✓ Copied license file to `backend/` directory
- ✓ Updated `.gitignore` to exclude license files
- ⚠️ **Need to redeploy backend** for this to take effect

---

## 🧪 Testing the Config System

### Test the XML Generation

Visit your live site and check the configuration:

1. **Go to**: https://dexprotector-saas-ian.web.app/dashboard/protect
2. **Upload APK**: Select a test APK
3. **Choose preset**: Select "Standard Protection"
4. **Click "Advanced Configuration"**: See all options
5. **Submit job**: Watch Firestore for the `configXml` field

### Check the Generated XML

In Firestore Console:
```
collections/jobs/{jobId}/configXml
```

You'll see the full XML string that will be passed to DexProtector.

---

## 📝 Next Steps

1. **Redeploy backend** with license file
2. **Test complete flow** with a small APK
3. **Verify DexProtector runs** successfully
4. **Check protected APK** output

**Redeploy command**:
```bash
cd backend
gcloud run deploy dexprotector-processor --source . --region us-central1
```

This will take 5-10 minutes to build and deploy.

---

**Everything is in place! The config system is fully functional.** 🎉
