export interface User {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
    credits: number
    isAdmin?: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Job {
    id: string
    userId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    inputFile: string
    outputFile?: string
    configXml?: string
    config?: DexProtectorConfig
    configTier?: ConfigTier
    creditsUsed?: number
    error?: string
    createdAt: Date
    startedAt?: Date
    completedAt?: Date
    failedAt?: Date
    processingTime?: number
}

export type ConfigTier = 'basic' | 'standard' | 'enhanced' | 'custom'

export interface DexProtectorConfig {
    // Build & Logging
    verbose?: boolean
    proguardMapFile?: string
    optimize?: boolean

    // Signing
    signMode?: 'debug' | 'release' | 'google' | 'amazon' | 'none'
    keystore?: string
    storepass?: string
    alias?: string
    keypass?: string
    sha256CertificateFingerprint?: string
    certificate?: string
    legacySha256CertificateFingerprint?: string

    // Code Stripping
    stripLogging?: ConfigOption
    stripMethodCalls?: ConfigOption

    // Code Protection
    classEncryption?: ConfigOption
    stringEncryption?: ConfigOption
    hideAccess?: ConfigOption
    annotationEncryption?: ConfigOption
    jniObfuscation?: boolean
    nativeLibraryEncryption?: ConfigOption

    // Resource & Asset Protection
    resourceEncryption?: ResourceEncryptionOption
    assets?: ConfigOption

    // RASP (Runtime Application Self-Protection)
    integrityControl?: RaspOption
    environmentChecks?: EnvironmentChecks
    antiDebug?: boolean
    antiEmulator?: boolean
    antiManualInstall?: boolean
    antiMalware?: boolean
    runtimeChecks?: boolean

    // Network Security
    publicKeyPinning?: PublicKeyPinning
    certificateTransparency?: CertificateTransparency

    // UI Protection
    uiProtection?: boolean

    // Threat Reporting (Alice)
    reportMonitoring?: ReportMonitoring

    // Security Assessment
    securityAssessment?: SecurityAssessment
}

export interface ConfigOption {
    enabled: boolean
    filters?: Filter[]
}

export interface ResourceEncryptionOption {
    enabled: boolean
    nameObfuscation?: boolean
    webViewSupport?: boolean
    idObfuscationMode?: 'auto' | 'on' | 'off'
    filters?: Filter[]
    androidManifestMangling?: boolean
    xamarinAssemblies?: boolean
}

export interface PublicKeyPinning {
    enabled: boolean
    trace?: number
    actions?: string
    domains?: Array<{
        domain: string
        includeSubdomains: boolean
        pins: Array<{
            digest: string
            hash: string
        }>
        expiration?: string
    }>
}

export interface CertificateTransparency {
    enabled: boolean
    trace?: number
    domains?: Array<{
        domain: string
        includeSubdomains: boolean
    }>
    logFile?: string
}

export interface ReportMonitoring {
    enabled: boolean
    apiKey?: string
    trace?: number
    customFieldsUpdate?: string
}

export interface RaspOption {
    enabled: boolean
    callback?: string
}

export interface EnvironmentChecks {
    enabled: boolean
    callback?: string
    debug?: boolean
    root?: boolean
    emulator?: boolean
    hooks?: boolean
}

export interface SecurityAssessment {
    signingCertificateCompromised?: 'error' | 'warning' | 'off'
    signingCertificateWeakKey?: 'error' | 'warning' | 'off'
    dependencyCheck?: 'error' | 'warning' | 'off'
}

export interface Filter {
    pattern: string
    type: 'include' | 'exclude'
}

export interface Transaction {
    id: string
    userId: string
    type: 'purchase' | 'deduction' | 'refund'
    amount: number
    credits: number
    description: string
    stripePaymentId?: string
    createdAt: Date
}

export interface CreditPackage {
    id: string
    name: string
    credits: number
    price: number
    pricePerCredit: number
    stripePriceId: string
    popular?: boolean
}

export interface APKInfo {
    packageName: string
    versionName: string
    versionCode: number
    minSdkVersion: number
    targetSdkVersion: number
    classes: APKClass[]
    size: number
}

export interface APKClass {
    name: string
    package: string
    methods: number
}

