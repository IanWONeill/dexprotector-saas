/**
 * DexProtector Configuration Generator
 * Generates XML configuration based on tier presets
 * This ensures users can't inject unauthorized features via client-side manipulation
 */

const TIER_CREDITS = {
    basic: 1,
    standard: 2,
    enhanced: 3,
    custom: 5,
};

const PRESET_CONFIGS = {
    basic: {
        // Build Settings
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Security Assessment
        securityAssessment: {
            signingCertificateCompromised: 'error',
            signingCertificateWeakKey: 'error',
            dependencyCheck: 'warning',
        },

        // Code Protection (2 features - Basic)
        classEncryption: {
            enabled: true,
            filters: [{ pattern: 'com.myapp.**', type: 'include' }],
        },
        stringEncryption: {
            enabled: true,
            filters: [{ pattern: 'com.myapp.**', type: 'include' }],
        },
        hideAccess: { enabled: false },
        annotationEncryption: { enabled: false },
        jniObfuscation: false,
        nativeLibraryEncryption: { enabled: false },
        stripLogging: false,

        // Resource Protection (OFF)
        resourceEncryption: { enabled: false },
        assets: { enabled: false },

        // RASP - Minimal
        integrityControl: { enabled: true },
        antiDebug: false,
        antiEmulator: false,
        antiManualInstall: false,
        antiMalware: false,
        runtimeChecks: false,
    },

    standard: {
        // Build Settings
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Security Assessment
        securityAssessment: {
            signingCertificateCompromised: 'error',
            signingCertificateWeakKey: 'error',
            dependencyCheck: 'warning',
        },

        // Code Protection (5 features - Standard)
        classEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        stringEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        hideAccess: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        annotationEncryption: { enabled: false },
        jniObfuscation: false,
        nativeLibraryEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        stripLogging: false,

        // Resource Protection (ON)
        resourceEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        assets: { enabled: false },

        // RASP - Standard
        integrityControl: { enabled: true },
        antiDebug: false,
        antiEmulator: false,
        antiManualInstall: false,
        antiMalware: false,
        runtimeChecks: false,
    },

    enhanced: {
        // Build Settings
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Security Assessment
        securityAssessment: {
            signingCertificateCompromised: 'error',
            signingCertificateWeakKey: 'error',
            dependencyCheck: 'warning',
        },

        // Code Protection (8 features - Enhanced)
        classEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        stringEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        hideAccess: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        annotationEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        jniObfuscation: true,
        nativeLibraryEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        stripLogging: 'all',

        // Resource Protection (FULL)
        resourceEncryption: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },
        assets: {
            enabled: true,
            filters: [{ pattern: '**', type: 'include' }],
        },

        // RASP - Maximum
        integrityControl: { enabled: true },
        antiDebug: true,
        antiEmulator: true,
        antiManualInstall: true,
        antiMalware: false, // Requires Alice Threat Intelligence
        runtimeChecks: true,
        rasp: {
            antiRoot: { mode: 'on', onDetected: 'exit' },
            antiFrida: { mode: 'on', onDetected: 'exit' },
            antiXposed: { mode: 'on', onDetected: 'exit' },
            antiHook: { mode: 'on', onDetected: 'exit' },
        },
    },
};

function addFilterTag(tagName, filters) {
    if (!filters || filters.length === 0) {
        return '';
    }

    let xml = `  <${tagName}>\n`;
    xml += '    <filters>\n';
    filters.forEach(filter => {
        xml += `      <filter${filter.type === 'exclude' ? ' type="exclude"' : ''}>${filter.pattern}</filter>\n`;
    });
    xml += '    </filters>\n';
    xml += `  </${tagName}>\n`;
    return xml;
}

function generateXML(config) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<dexprotector>\n';

    // Build settings (always include)
    xml += `  <verbose>${config.verbose !== undefined ? config.verbose : false}</verbose>\n`;
    xml += `  <optimize>${config.optimize !== undefined ? config.optimize : false}</optimize>\n`;

    // Security Assessment (always include)
    if (config.securityAssessment) {
        xml += '  <securityAssessment mode="on">\n';
        if (config.securityAssessment.signingCertificateCompromised) {
            xml += `    <signingCertificateCompromised mode="${config.securityAssessment.signingCertificateCompromised}"/>\n`;
        }
        if (config.securityAssessment.signingCertificateWeakKey) {
            xml += `    <signingCertificateWeakKey mode="${config.securityAssessment.signingCertificateWeakKey}"/>\n`;
        }
        if (config.securityAssessment.dependencyCheck) {
            xml += `    <dependencyCheck mode="${config.securityAssessment.dependencyCheck}"/>\n`;
        }
        xml += '  </securityAssessment>\n';
    }

    // Signing
    if (config.signMode) {
        xml += `  <signMode>${config.signMode}</signMode>\n`;
        if (config.signMode === 'release') {
            if (config.keystore) xml += `  <keystore>${config.keystore}</keystore>\n`;
            if (config.storepass) xml += `  <storepass>${config.storepass}</storepass>\n`;
            if (config.alias) xml += `  <alias>${config.alias}</alias>\n`;
            if (config.keypass) xml += `  <keypass>${config.keypass}</keypass>\n`;
        } else if (config.signMode === 'google' || config.signMode === 'amazon') {
            // Google Play App Signing or Amazon Appstore signing requires SHA-256 fingerprint
            if (config.sha256CertificateFingerprint) {
                xml += `  <sha256CertificateFingerprint>${config.sha256CertificateFingerprint}</sha256CertificateFingerprint>\n`;
            }
        }
    }

    // Code Stripping
    if (config.stripLogging) {
        if (typeof config.stripLogging === 'string') {
            xml += `  <stripLogging>${config.stripLogging}</stripLogging>\n`;
        } else if (config.stripLogging?.enabled) {
            xml += addFilterTag('stripLogging', config.stripLogging.filters);
        }
    }

    // Code Protection - Always output, even if disabled
    if (config.classEncryption?.enabled) {
        xml += addFilterTag('classEncryption', config.classEncryption.filters);
    }
    if (config.stringEncryption?.enabled) {
        xml += addFilterTag('stringEncryption', config.stringEncryption.filters);
    }
    if (config.hideAccess?.enabled) {
        xml += addFilterTag('hideAccess', config.hideAccess.filters);
    }
    if (config.annotationEncryption?.enabled) {
        xml += addFilterTag('annotationEncryption', config.annotationEncryption.filters);
    }
    if (config.jniObfuscation === true) {
        xml += '  <jniObfuscation/>\n';
    }
    if (config.nativeLibraryEncryption?.enabled) {
        xml += addFilterTag('nativeLibraryEncryption', config.nativeLibraryEncryption.filters);
    }

    // Resource Protection
    if (config.resourceEncryption?.enabled) {
        xml += '  <resourceEncryption>\n';
        if (config.resourceEncryption.filters) {
            xml += '    <filters>\n';
            config.resourceEncryption.filters.forEach(filter => {
                xml += `      <filter${filter.type === 'exclude' ? ' type="exclude"' : ''}>${filter.pattern}</filter>\n`;
            });
            xml += '    </filters>\n';
        }
        if (config.assets?.enabled) {
            xml += '    <assets>\n';
            if (config.assets.filters) {
                xml += '      <filters>\n';
                config.assets.filters.forEach(filter => {
                    xml += `        <filter${filter.type === 'exclude' ? ' type="exclude"' : ''}>${filter.pattern}</filter>\n`;
                });
                xml += '      </filters>\n';
            }
            xml += '    </assets>\n';
        }
        xml += '  </resourceEncryption>\n';
    }

    // RASP - Always include, explicitly set true/false
    if (config.integrityControl?.enabled) {
        const callback = config.integrityControl.callback ? ` callback="${config.integrityControl.callback}"` : '';
        xml += `  <integrityControl${callback}/>\n`;
    }

    // Boolean RASP elements - explicitly set
    if (config.antiDebug !== undefined) {
        xml += `  <antiDebug>${config.antiDebug}</antiDebug>\n`;
    }
    if (config.antiEmulator !== undefined) {
        xml += `  <antiEmulator>${config.antiEmulator}</antiEmulator>\n`;
    }
    if (config.antiManualInstall !== undefined) {
        xml += `  <antiManualInstall>${config.antiManualInstall}</antiManualInstall>\n`;
    }
    if (config.antiMalware !== undefined) {
        xml += `  <antiMalware>${config.antiMalware}</antiMalware>\n`;
    }
    if (config.runtimeChecks === true) {
        xml += '  <runtimeChecks/>\n';
    }

    // Advanced RASP with mode/onDetected attributes
    if (config.rasp) {
        if (config.rasp.antiRoot) {
            xml += `  <antiRoot mode="${config.rasp.antiRoot.mode}" onDetected="${config.rasp.antiRoot.onDetected}"/>\n`;
        }
        if (config.rasp.antiFrida) {
            xml += `  <antiFrida mode="${config.rasp.antiFrida.mode}" onDetected="${config.rasp.antiFrida.onDetected}"/>\n`;
        }
        if (config.rasp.antiXposed) {
            xml += `  <antiXposed mode="${config.rasp.antiXposed.mode}" onDetected="${config.rasp.antiXposed.onDetected}"/>\n`;
        }
        if (config.rasp.antiHook) {
            xml += `  <antiHook mode="${config.rasp.antiHook.mode}" onDetected="${config.rasp.antiHook.onDetected}"/>\n`;
        }
        if (config.rasp.antiScreenCapture) {
            xml += `  <antiScreenCapture mode="${config.rasp.antiScreenCapture.mode}" onDetected="${config.rasp.antiScreenCapture.onDetected}"/>\n`;
        }
        if (config.rasp.antiVPN) {
            xml += `  <antiVPN mode="${config.rasp.antiVPN.mode}" onDetected="${config.rasp.antiVPN.onDetected}"/>\n`;
        }
    }

    xml += '</dexprotector>\n';
    return xml;
}

/**
 * Validate that credits used matches the tier
 */
function validateTierCredits(tier, creditsUsed) {
    const expectedCredits = TIER_CREDITS[tier];
    if (!expectedCredits) {
        throw new Error(`Invalid tier: ${tier}`);
    }
    if (creditsUsed !== expectedCredits) {
        throw new Error(`Credits mismatch for tier ${tier}: expected ${expectedCredits}, got ${creditsUsed}`);
    }
    return true;
}

/**
 * Get configuration for a tier
 * For presets (basic, standard, enhanced), return the server-side preset
 * For custom, validate the provided XML
 */
function getConfigForTier(tier, clientXml) {
    if (tier === 'custom') {
        // For custom tier, use the client-provided XML (user paid for full control)
        if (!clientXml) {
            throw new Error('Custom tier requires configuration XML');
        }
        return clientXml;
    }

    // For presets, regenerate XML from server-side preset (ignore client XML)
    const preset = PRESET_CONFIGS[tier];
    if (!preset) {
        throw new Error(`Invalid preset tier: ${tier}`);
    }

    return generateXML(preset);
}

module.exports = {
    TIER_CREDITS,
    PRESET_CONFIGS,
    generateXML,
    validateTierCredits,
    getConfigForTier,
};
