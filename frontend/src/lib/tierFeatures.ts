/**
 * Defines which features are included in each tier
 * Used to hide unavailable features in the UI (not just disable them)
 */

export interface TierFeatures {
    // Code Protection
    classEncryption: boolean
    stringEncryption: boolean
    hideAccess: boolean
    annotationEncryption: boolean
    jniObfuscation: boolean
    nativeLibraryEncryption: boolean
    stripLogging: boolean

    // Resource Protection
    resourceEncryption: boolean
    assets: boolean

    // RASP
    integrityControl: boolean
    environmentChecks: boolean

    // Network Security
    publicKeyPinning: boolean
    certificateTransparency: boolean
}

export const TIER_FEATURES: Record<string, TierFeatures> = {
    basic: {
        // Code Protection (2 features)
        classEncryption: true,
        stringEncryption: true,
        hideAccess: false,
        annotationEncryption: false,
        jniObfuscation: false,
        nativeLibraryEncryption: false,
        stripLogging: false,

        // Resource Protection
        resourceEncryption: false,
        assets: false,

        // RASP
        integrityControl: true,
        environmentChecks: false, // Removed due to DexProtector compatibility

        // Network Security
        publicKeyPinning: false,
        certificateTransparency: false,
    },

    standard: {
        // Code Protection (5 features)
        classEncryption: true,
        stringEncryption: true,
        hideAccess: true,
        annotationEncryption: false,
        jniObfuscation: false,
        nativeLibraryEncryption: true,
        stripLogging: false,

        // Resource Protection
        resourceEncryption: true,
        assets: false,

        // RASP
        integrityControl: true,
        environmentChecks: false,

        // Network Security
        publicKeyPinning: false,
        certificateTransparency: false,
    },

    enhanced: {
        // Code Protection (8 features)
        classEncryption: true,
        stringEncryption: true,
        hideAccess: true,
        annotationEncryption: true,
        jniObfuscation: true,
        nativeLibraryEncryption: true,
        stripLogging: true,

        // Resource Protection
        resourceEncryption: true,
        assets: true,

        // RASP
        integrityControl: true,
        environmentChecks: true, // Includes antiRoot, antiEmulator, antiFrida

        // Network Security
        publicKeyPinning: false,
        certificateTransparency: false,
    },

    custom: {
        // All features available
        classEncryption: true,
        stringEncryption: true,
        hideAccess: true,
        annotationEncryption: true,
        jniObfuscation: true,
        nativeLibraryEncryption: true,
        stripLogging: true,
        resourceEncryption: true,
        assets: true,
        integrityControl: true,
        environmentChecks: true,

        // Network Security
        publicKeyPinning: true,
        certificateTransparency: true,
    },
}

/**
 * Check if a feature is available for a given tier
 */
export function isFeatureAvailable(tier: string, feature: keyof TierFeatures): boolean {
    const tierFeatures = TIER_FEATURES[tier]
    if (!tierFeatures) return false
    return tierFeatures[feature]
}

/**
 * Get list of all available features for a tier
 */
export function getAvailableFeatures(tier: string): (keyof TierFeatures)[] {
    const tierFeatures = TIER_FEATURES[tier]
    if (!tierFeatures) return []

    return (Object.keys(tierFeatures) as (keyof TierFeatures)[]).filter(
        feature => tierFeatures[feature]
    )
}

/**
 * Get count of features in a tier
 */
export function getFeatureCount(tier: string): number {
    return getAvailableFeatures(tier).length
}

/**
 * Get maximum number of filters allowed per feature for a tier
 * Basic: 1 filter (VERY limited scope)
 * Standard: 3 filters (basic patterns)
 * Enhanced: 5 filters (moderate control)
 * Custom: unlimited filters (full control)
 */
export function getMaxFilters(tier: string): number {
    switch (tier) {
        case 'basic':
            return 1
        case 'standard':
            return 3
        case 'enhanced':
            return 5
        case 'custom':
            return Infinity
        default:
            return 1
    }
}

/**
 * Check if a filter pattern is allowed for a tier
 * Basic: only '**' (all packages)
 * Standard: simple patterns (**, com.example.**, !com.test.**)
 * Enhanced & Custom: all patterns allowed
 */
export function isPatternAllowed(tier: string, pattern: string): boolean {
    switch (tier) {
        case 'basic':
            // Basic tier: only allow '**' pattern
            return pattern === '**'
        case 'standard':
            // Standard tier: only simple patterns (no complex wildcards)
            // Allow: **, com.example.**, !com.test.**
            // Disallow: com.*.example.**, **.*test**, etc.
            const isSimple = /^!?([a-zA-Z_][a-zA-Z0-9_]*\.)*(\*\*|\*)$/.test(pattern)
            return isSimple
        case 'enhanced':
        case 'custom':
            // Enhanced and Custom: all patterns allowed
            return true
        default:
            return false
    }
}

/**
 * Get pattern validation message for a tier
 */
export function getPatternValidationMessage(tier: string): string {
    switch (tier) {
        case 'basic':
            return 'Basic tier only allows "**" pattern (all packages)'
        case 'standard':
            return 'Standard tier allows simple patterns: **, com.example.**, !com.test.**'
        case 'enhanced':
        case 'custom':
            return 'All glob patterns allowed: **, *, !, complex wildcards'
        default:
            return ''
    }
}
