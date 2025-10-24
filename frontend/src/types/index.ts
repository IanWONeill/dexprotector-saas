export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  credits: number
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
  config?: ProtectionConfig
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date
  processingTime?: number
}

export interface ProtectionConfig {
  // Basic Protection
  stringEncryption: boolean
  annotationEncryption: boolean
  classEncryption: boolean
  hideAccess: boolean

  // Advanced Protection
  jniObfuscation: boolean
  nativeLibraryEncryption: boolean

  // Resource Protection
  resourceEncryption: {
    enabled: boolean
    assets: boolean
    res: boolean
    strings: boolean
    nameObfuscation: boolean
  }

  // RASP Features
  antiDebug: 'off' | 'report' | 'exit'
  antiEmulator: 'off' | 'report' | 'exit'
  antiManualInstall: 'off' | 'report' | 'exit'
  antiMalware: 'off' | 'report'
  runtimeChecks: 'off' | 'report' | 'exit'

  // Build Settings
  verbose: boolean
  optimize: boolean

  // Filters
  includePackages: string[]
  excludePackages: string[]
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

export const DEFAULT_CONFIG: ProtectionConfig = {
  stringEncryption: true,
  annotationEncryption: true,
  classEncryption: false,
  hideAccess: true,
  jniObfuscation: false,
  nativeLibraryEncryption: false,
  resourceEncryption: {
    enabled: true,
    assets: true,
    res: false,
    strings: true,
    nameObfuscation: false,
  },
  antiDebug: 'report',
  antiEmulator: 'report',
  antiManualInstall: 'report',
  antiMalware: 'report',
  runtimeChecks: 'report',
  verbose: true,
  optimize: true,
  includePackages: [],
  excludePackages: [],
}

export const PRESET_CONFIGS = {
  basic: {
    name: 'Basic Protection',
    description: 'Essential protection for most apps',
    config: DEFAULT_CONFIG,
  },
  standard: {
    name: 'Standard Protection',
    description: 'Recommended for production apps',
    config: {
      ...DEFAULT_CONFIG,
      classEncryption: true,
      nativeLibraryEncryption: true,
      resourceEncryption: {
        enabled: true,
        assets: true,
        res: true,
        strings: true,
        nameObfuscation: true,
      },
    } as ProtectionConfig,
  },
  maximum: {
    name: 'Maximum Protection',
    description: 'Maximum security for sensitive apps',
    config: {
      ...DEFAULT_CONFIG,
      classEncryption: true,
      jniObfuscation: true,
      nativeLibraryEncryption: true,
      resourceEncryption: {
        enabled: true,
        assets: true,
        res: true,
        strings: true,
        nameObfuscation: true,
      },
      antiDebug: 'exit',
      antiEmulator: 'exit',
      antiManualInstall: 'exit',
      runtimeChecks: 'exit',
    } as ProtectionConfig,
  },
}
