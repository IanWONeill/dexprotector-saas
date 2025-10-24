import { ProtectionConfig } from '@/types'

/**
 * Generate DexProtector XML configuration from ProtectionConfig
 */
export function generateDexProtectorXML(config: ProtectionConfig): string {
  const xml: string[] = []

  xml.push('<?xml version="1.0" encoding="UTF-8"?>')
  xml.push('<config xmlns="http://www.licelus.com/products/dexprotector">')
  xml.push('')

  // Build Settings
  xml.push('  <!-- Build Settings -->')
  xml.push(`  <verbose>${config.verbose}</verbose>`)
  xml.push(`  <optimize>${config.optimize}</optimize>`)
  xml.push('')

  // String Encryption
  if (config.stringEncryption) {
    xml.push('  <!-- String Encryption -->')
    xml.push('  <stringEncryption>')
    if (config.includePackages.length > 0) {
      config.includePackages.forEach(pkg => {
        xml.push(`    <include>glob:${pkg}</include>`)
      })
    } else {
      xml.push('    <include>glob:**</include>')
    }
    if (config.excludePackages.length > 0) {
      config.excludePackages.forEach(pkg => {
        xml.push(`    <exclude>glob:${pkg}</exclude>`)
      })
    }
    xml.push('  </stringEncryption>')
    xml.push('')
  }

  // Annotation Encryption
  if (config.annotationEncryption) {
    xml.push('  <!-- Annotation Encryption (Kotlin) -->')
    xml.push('  <annotationEncryption>')
    xml.push('    <include>glob:**</include>')
    xml.push('  </annotationEncryption>')
    xml.push('')
  }

  // Class Encryption
  if (config.classEncryption) {
    xml.push('  <!-- Class Encryption -->')
    xml.push('  <classEncryption>')
    if (config.includePackages.length > 0) {
      config.includePackages.forEach(pkg => {
        xml.push(`    <include>glob:${pkg}</include>`)
      })
    } else {
      xml.push('    <include>glob:**</include>')
    }
    if (config.excludePackages.length > 0) {
      config.excludePackages.forEach(pkg => {
        xml.push(`    <exclude>glob:${pkg}</exclude>`)
      })
    }
    xml.push('  </classEncryption>')
    xml.push('')
  }

  // Hide Access
  if (config.hideAccess) {
    xml.push('  <!-- Hide Access -->')
    xml.push('  <hideAccess>')
    xml.push('    <include>glob:**</include>')
    xml.push('  </hideAccess>')
    xml.push('')
  }

  // JNI Obfuscation
  if (config.jniObfuscation) {
    xml.push('  <!-- JNI Obfuscation -->')
    xml.push('  <jniObfuscation>true</jniObfuscation>')
    xml.push('')
  }

  // Native Library Encryption
  if (config.nativeLibraryEncryption) {
    xml.push('  <!-- Native Library Encryption -->')
    xml.push('  <nativeLibraryEncryption>')
    xml.push('    <include>glob:**</include>')
    xml.push('  </nativeLibraryEncryption>')
    xml.push('')
  }

  // Resource Encryption
  if (config.resourceEncryption.enabled) {
    xml.push('  <!-- Resource Encryption -->')
    xml.push('  <resourceEncryption>')

    if (config.resourceEncryption.assets) {
      xml.push('    <assets>')
      xml.push('      <include>glob:**</include>')
      xml.push('    </assets>')
    }

    if (config.resourceEncryption.res) {
      xml.push('    <res>')
      xml.push('      <include>glob:**</include>')
      xml.push('    </res>')
    }

    if (config.resourceEncryption.strings) {
      xml.push('    <strings>')
      xml.push('      <include>glob:**</include>')
      xml.push('    </strings>')
    }

    if (config.resourceEncryption.nameObfuscation) {
      xml.push('    <nameObfuscation>true</nameObfuscation>')
    }

    xml.push('  </resourceEncryption>')
    xml.push('')
  }

  // RASP Features
  xml.push('  <!-- RASP Features -->')

  if (config.antiDebug !== 'off') {
    xml.push(`  <antiDebug>${config.antiDebug}</antiDebug>`)
  }

  if (config.antiEmulator !== 'off') {
    xml.push(`  <antiEmulator>${config.antiEmulator}</antiEmulator>`)
  }

  if (config.antiManualInstall !== 'off') {
    xml.push(`  <antiManualInstall>${config.antiManualInstall}</antiManualInstall>`)
  }

  if (config.antiMalware !== 'off') {
    xml.push(`  <antiMalware>${config.antiMalware}</antiMalware>`)
  }

  if (config.runtimeChecks !== 'off') {
    xml.push(`  <runtimeChecks>${config.runtimeChecks}</runtimeChecks>`)
  }

  xml.push('')
  xml.push('</config>')

  return xml.join('\n')
}

/**
 * Validate protection configuration
 */
export function validateConfig(config: ProtectionConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if at least one protection is enabled
  const hasProtection =
    config.stringEncryption ||
    config.classEncryption ||
    config.hideAccess ||
    config.resourceEncryption.enabled

  if (!hasProtection) {
    errors.push('At least one protection feature must be enabled')
  }

  // Validate package patterns
  const validatePattern = (pattern: string) => {
    if (!pattern.match(/^[a-zA-Z0-9.*_/-]+$/)) {
      errors.push(`Invalid package pattern: ${pattern}`)
    }
  }

  config.includePackages.forEach(validatePattern)
  config.excludePackages.forEach(validatePattern)

  return {
    valid: errors.length === 0,
    errors,
  }
}
