// DexProtector Configuration Presets and Options

export interface DexProtectorConfig {
    // Build & Logging
    verbose?: boolean;
    proguardMapFile?: string;
    optimize?: boolean;

    // Signing
    signMode?: 'debug' | 'release' | 'google' | 'amazon' | 'none';
    keystore?: string;
    storepass?: string;
    alias?: string;
    keypass?: string;
    sha256CertificateFingerprint?: string;

    // Code Stripping
    stripLogging?: 'wtf' | 'error' | 'warning' | 'info' | 'debug' | 'verbose' | 'all' | false;

    // Code Protection (self-closing tags or with filters)
    classEncryption?: ConfigOption;
    stringEncryption?: ConfigOption;
    hideAccess?: ConfigOption;
    annotationEncryption?: ConfigOption;
    jniObfuscation?: boolean; // Self-closing tag
    nativeLibraryEncryption?: ConfigOption;

    // Resource & Asset Protection
    resourceEncryption?: ResourceEncryptionOption;

    // RASP - Runtime Application Self-Protection (boolean values or self-closing tags)
    antiDebug?: boolean;
    antiEmulator?: boolean;
    antiManualInstall?: boolean;
    antiMalware?: boolean; // Requires Alice Threat Intelligence
    runtimeChecks?: boolean; // Self-closing tag when true

    // Network Security
    publicKeyPinning?: any;
    certificateTransparency?: any;

    // Security Assessment
    securityAssessment?: SecurityAssessment;
}

interface ConfigOption {
    enabled: boolean;
    filters?: Filter[];
}

interface ResourceEncryptionOption {
    enabled: boolean;
    filters?: Filter[];
    assets?: {
        enabled: boolean;
        filters?: Filter[];
    };
}

interface SecurityAssessment {
    signingCertificateCompromised?: 'error' | 'warning' | 'off';
    signingCertificateWeakKey?: 'error' | 'warning' | 'off';
    dependencyCheck?: 'error' | 'warning' | 'off';
}

interface Filter {
    pattern: string;
    type: 'include' | 'exclude';
}

// Configuration Tiers
export const CONFIG_TIERS = {
    BASIC: 'basic',
    STANDARD: 'standard',
    ENHANCED: 'enhanced',
    CUSTOM: 'custom',
} as const;

export type ConfigTier = typeof CONFIG_TIERS[keyof typeof CONFIG_TIERS];

// Credit costs per tier
export const TIER_CREDITS: Record<ConfigTier, number> = {
    basic: 1,
    standard: 2,
    enhanced: 3,
    custom: 5,
};

// Tier descriptions
export const TIER_DESCRIPTIONS: Record<ConfigTier, { name: string; description: string; features: string[] }> = {
    basic: {
        name: 'Basic Protection',
        description: '⚠️ MINIMAL - Testing only. Very limited scope - NOT for production apps.',
        features: [
            '✓ Class encryption (VERY limited scope)',
            '✓ String encryption (VERY limited scope)',
            '✓ Basic integrity control',
            '✗ No method obfuscation',
            '✗ No RASP protection',
            '✗ No resource encryption',
            '✗ No native lib protection',
            '✗ Very weak - easily cracked',
        ],
    },
    standard: {
        name: 'Standard Protection',
        description: '🔑 BASIC - Minimal features. Consider Custom for better protection.',
        features: [
            '✓ Class encryption (basic patterns)',
            '✓ String encryption (basic patterns)',
            '✓ Method call obfuscation',
            '✓ Native library encryption',
            '✓ Resource encryption (basic)',
            '✗ No annotation encryption',
            '✗ No JNI obfuscation',
            '✗ No log stripping',
            '✗ Limited RASP features',
        ],
    },
    enhanced: {
        name: 'Enhanced Protection',
        description: '🔒 MODERATE - Decent protection but missing fine-tuned control.',
        features: [
            '✓ ALL Standard features PLUS:',
            '✓ Annotation encryption',
            '✓ JNI obfuscation',
            '✓ Asset encryption',
            '✓ Strip all logging',
            '✓ Advanced RASP features',
            '✗ No filter customization',
            '✗ No include/exclude patterns',
            '✗ Generic configuration (not optimized)',
        ],
    },
    custom: {
        name: 'Custom Configuration',
        description: '🛡️ MAXIMUM - Expert-level control. Best value for serious apps.',
        features: [
            '✓ ALL protection features unlocked',
            '✓ Granular filter control per feature',
            '✓ Custom include/exclude patterns',
            '✓ Optimized for YOUR app structure',
            '✓ Advanced RASP callbacks & modes',
            '✓ Security assessment fine-tuning',
            '✓ ProGuard mapping integration',
            '✓ Custom signing & keystore options',
            '✓ Maximum security & flexibility',
            '✓ Production-ready enterprise grade',
        ],
    },
};

// Preset Configurations
export const PRESET_CONFIGS: Record<Exclude<ConfigTier, 'custom'>, DexProtectorConfig> = {
    basic: {
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Code Protection - Minimal (2 features only)
        classEncryption: {
            enabled: true,
            filters: [
                { pattern: 'com.myapp.**', type: 'include' },
            ],
        },
        stringEncryption: {
            enabled: true,
            filters: [
                { pattern: 'com.myapp.**', type: 'include' },
            ],
        },

        // RASP - None (basic tier has no RASP)
    },

    standard: {
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Code Protection - 5 features
        classEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        stringEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        hideAccess: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        nativeLibraryEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },

        // Resource Protection (basic)
        resourceEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },

        // RASP - Basic environment checks
        antiDebug: true,
        antiEmulator: true,
    },

    enhanced: {
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Security Assessment
        securityAssessment: {
            signingCertificateCompromised: 'error',
            signingCertificateWeakKey: 'error',
            dependencyCheck: 'warning',
        },

        // Code Stripping
        stripLogging: 'all', // Valid values: wtf, error, warning, info, debug, verbose, all

        // Code Protection - Maximum (8 features)
        classEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        stringEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        hideAccess: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        annotationEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        jniObfuscation: true,
        nativeLibraryEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },

        // Resource Protection - Full (assets nested inside)
        resourceEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
            assets: {
                enabled: true,
                filters: [
                    { pattern: '**', type: 'include' },
                ],
            },
        },

        // RASP - Maximum (all valid DexProtector tags)
        antiDebug: true,
        antiEmulator: true,
        antiManualInstall: true,
        antiMalware: false, // Requires Alice Threat Intelligence
        runtimeChecks: true,
    },
};

// Configuration sections for Custom tier UI
export const CONFIG_SECTIONS = {
    BUILD: {
        title: 'Build & Logging',
        description: 'Control build process and output verbosity',
        options: [
            { key: 'verbose', label: 'Verbose Logging', type: 'boolean', default: false },
            { key: 'optimize', label: 'Optimize Package', type: 'boolean', default: true },
            { key: 'proguardMapFile', label: 'ProGuard Map File', type: 'file', default: null },
        ],
    },
    CODE_PROTECTION: {
        title: 'Code Protection',
        description: 'Protect Java/Kotlin bytecode from reverse engineering',
        options: [
            { key: 'classEncryption', label: 'Class Encryption', type: 'filter', default: true, description: 'Encrypt DEX files' },
            { key: 'stringEncryption', label: 'String Encryption', type: 'filter', default: true, description: 'Encrypt string literals' },
            { key: 'hideAccess', label: 'Hide Access', type: 'filter', default: true, description: 'Obfuscate method calls' },
            { key: 'annotationEncryption', label: 'Annotation Encryption', type: 'filter', default: false, description: 'Encrypt runtime annotations' },
            { key: 'jniObfuscation', label: 'JNI Obfuscation', type: 'boolean', default: false, description: 'Obfuscate native methods' },
            { key: 'nativeLibraryEncryption', label: 'Native Library Encryption', type: 'filter', default: false, description: 'Encrypt .so files' },
            { key: 'stripLogging', label: 'Strip Logging', type: 'enum', values: ['wtf', 'error', 'warning', 'info', 'debug', 'verbose', 'all'], default: false, description: 'Remove android.util.Log calls' },
        ],
    },
    RESOURCE_PROTECTION: {
        title: 'Resource & Asset Protection',
        description: 'Protect resources and assets from extraction',
        options: [
            { key: 'resourceEncryption', label: 'Resource Encryption', type: 'filter', default: false, description: 'Encrypt res/ folder' },
            { key: 'assets', label: 'Asset Encryption', type: 'filter', default: false, description: 'Encrypt assets/ folder' },
        ],
    },
    RASP: {
        title: 'Runtime Protection (RASP)',
        description: 'Runtime Application Self-Protection - environment checks',
        options: [
            { key: 'antiDebug', label: 'Anti-Debug', type: 'boolean', default: true, description: 'Close app if debugger attached' },
            { key: 'antiEmulator', label: 'Anti-Emulator', type: 'boolean', default: true, description: 'Prevent running on emulators' },
            { key: 'antiManualInstall', label: 'Anti-Manual Install', type: 'boolean', default: true, description: 'Detect sideloaded apps' },
            { key: 'antiMalware', label: 'Anti-Malware', type: 'boolean', default: false, description: 'Detect malware (requires Alice)' },
            { key: 'runtimeChecks', label: 'Runtime Checks', type: 'boolean', default: true, description: 'Detect custom firmware & root' },
        ],
    },
    SECURITY_ASSESSMENT: {
        title: 'Security Assessment',
        description: 'Pre-build vulnerability checks',
        options: [
            { key: 'securityAssessment.signingCertificateCompromised', label: 'Check Compromised Cert', type: 'enum', values: ['error', 'warning', 'off'], default: 'error' },
            { key: 'securityAssessment.signingCertificateWeakKey', label: 'Check Weak Key', type: 'enum', values: ['error', 'warning', 'off'], default: 'error' },
            { key: 'securityAssessment.dependencyCheck', label: 'Dependency CVE Check', type: 'enum', values: ['error', 'warning', 'off'], default: 'warning' },
        ],
    },
    SIGNING: {
        title: 'Signing Configuration',
        description: 'Configure APK/AAB signing',
        options: [
            { key: 'signMode', label: 'Sign Mode', type: 'enum', values: ['debug', 'release', 'google', 'amazon', 'none'], default: 'debug' },
        ],
    },
};

// Generate XML from config
export function generateXML(config: DexProtectorConfig): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<dexprotector>\n';

    // Build settings
    if (config.verbose !== undefined) {
        xml += `  <verbose>${config.verbose}</verbose>\n`;
    }
    if (config.optimize !== undefined) {
        xml += `  <optimize>${config.optimize}</optimize>\n`;
    }
    if (config.proguardMapFile) {
        xml += `  <proguardMapFile>${config.proguardMapFile}</proguardMapFile>\n`;
    }

    // Signing
    if (config.signMode) {
        xml += `  <signMode>${config.signMode}</signMode>\n`;
        if (config.signMode === 'release') {
            if (config.keystore) xml += `  <keystore>${config.keystore}</keystore>\n`;
            if (config.storepass) xml += `  <storepass>${config.storepass}</storepass>\n`;
            if (config.alias) xml += `  <alias>${config.alias}</alias>\n`;
            if (config.keypass) xml += `  <keypass>${config.keypass}</keypass>\n`;
        }
        if (config.signMode === 'google' && config.sha256CertificateFingerprint) {
            xml += `  <sha256CertificateFingerprint>${config.sha256CertificateFingerprint}</sha256CertificateFingerprint>\n`;
        }
    }

    // Code Stripping - stripLogging is a simple string value
    // Only add if it has a valid value (not false, not empty string, not undefined)
    // If explicitly set to false, don't include it. Otherwise default to 'all' for enhanced tier
    if (config.stripLogging && typeof config.stripLogging === 'string' && config.stripLogging.length > 0) {
        xml += `  <stripLogging>${config.stripLogging}</stripLogging>\n`;
    } else if (config.stripLogging !== false && config.stripLogging !== undefined) {
        // If it's an empty string or any other truthy non-string value, default to 'all'
        xml += `  <stripLogging>all</stripLogging>\n`;
    }

    // Code Protection
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
    if (config.jniObfuscation) {
        xml += '  <jniObfuscation/>\n';
    }
    if (config.nativeLibraryEncryption?.enabled) {
        xml += addFilterTag('nativeLibraryEncryption', config.nativeLibraryEncryption.filters);
    }

    // Resource Protection - assets nested inside resourceEncryption
    if (config.resourceEncryption?.enabled) {
        xml += '  <resourceEncryption>\n';
        if (config.resourceEncryption.filters) {
            xml += '    <filters>\n';
            config.resourceEncryption.filters.forEach(filter => {
                xml += `      <filter${filter.type === 'exclude' ? ' type="exclude"' : ''}>${filter.pattern}</filter>\n`;
            });
            xml += '    </filters>\n';
        }
        // Assets nested inside resourceEncryption
        if (config.resourceEncryption.assets?.enabled) {
            xml += '    <assets>\n';
            if (config.resourceEncryption.assets.filters) {
                xml += '      <filters>\n';
                config.resourceEncryption.assets.filters.forEach(filter => {
                    xml += `        <filter${filter.type === 'exclude' ? ' type="exclude"' : ''}>${filter.pattern}</filter>\n`;
                });
                xml += '      </filters>\n';
            }
            xml += '    </assets>\n';
        }
        xml += '  </resourceEncryption>\n';
    }

    // RASP - boolean elements or self-closing tags
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

    // Security Assessment - mode attribute syntax
    if (config.securityAssessment) {
        xml += '  <securityAssessment>\n';
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

    // Network Security - Public Key Pinning
    if (config.publicKeyPinning?.enabled && config.publicKeyPinning.domains && config.publicKeyPinning.domains.length > 0) {
        const trace = config.publicKeyPinning.trace ? ` trace="${config.publicKeyPinning.trace}"` : '';
        const actions = config.publicKeyPinning.actions ? ` actions="${config.publicKeyPinning.actions}"` : '';
        xml += `  <publicKeyPinning${trace}${actions}>\n`;
        config.publicKeyPinning.domains.forEach((domain: any) => {
            const includeSubdomains = domain.includeSubdomains ? ' includeSubdomains="true"' : '';
            const expiration = domain.expiration ? ` expiration="${domain.expiration}"` : '';
            xml += `    <domain${includeSubdomains}${expiration}>\n`;
            xml += `      <name>${domain.domain}</name>\n`;
            if (domain.pins && domain.pins.length > 0) {
                domain.pins.forEach((pin: any) => {
                    xml += `      <pin digest="${pin.digest}">${pin.hash}</pin>\n`;
                });
            }
            xml += `    </domain>\n`;
        });
        xml += '  </publicKeyPinning>\n';
    }

    // Network Security - Certificate Transparency
    if (config.certificateTransparency?.enabled && config.certificateTransparency.domains && config.certificateTransparency.domains.length > 0) {
        const trace = config.certificateTransparency.trace ? ` trace="${config.certificateTransparency.trace}"` : '';
        const logFile = config.certificateTransparency.logFile ? ` logFile="${config.certificateTransparency.logFile}"` : '';
        xml += `  <certificateTransparency${trace}${logFile}>\n`;
        config.certificateTransparency.domains.forEach((domain: any) => {
            const includeSubdomains = domain.includeSubdomains ? ' includeSubdomains="true"' : '';
            xml += `    <domain${includeSubdomains}>${domain.domain}</domain>\n`;
        });
        xml += '  </certificateTransparency>\n';
    }

    xml += '</dexprotector>';
    return xml;
}

function addFilterTag(tagName: string, filters?: Filter[]): string {
    // Don't add the tag at all if no filters (DexProtector requires filters)
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
