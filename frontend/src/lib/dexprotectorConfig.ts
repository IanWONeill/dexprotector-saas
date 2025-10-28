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

    // Code Protection
    classEncryption?: ConfigOption;
    stringEncryption?: ConfigOption;
    hideAccess?: ConfigOption;
    annotationEncryption?: ConfigOption;
    jniObfuscation?: boolean;
    nativeLibraryEncryption?: ConfigOption;
    stripLogging?: ConfigOption;

    // Resource & Asset Protection
    resourceEncryption?: ConfigOption;
    assets?: ConfigOption;

    // RASP (Runtime Application Self-Protection)
    integrityControl?: RaspOption;
    environmentChecks?: EnvironmentChecks;

    // Network Security
    publicKeyPinning?: any; // Using types from types/index.ts
    certificateTransparency?: any; // Using types from types/index.ts

    // Security Assessment
    securityAssessment?: SecurityAssessment;
}

interface ConfigOption {
    enabled: boolean;
    filters?: Filter[];
}

interface RaspOption {
    enabled: boolean;
    callback?: string;
}

interface EnvironmentChecks {
    enabled: boolean;
    callback?: string;
    debug?: boolean;
    root?: boolean;
    emulator?: boolean;
    hooks?: boolean;
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
        description: '⚠️ BASIC - Minimal features. Consider Custom for better protection.',
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
        description: '� MODERATE - Decent protection but missing fine-tuned control.',
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
        description: '🔒 MAXIMUM - Expert-level control. Best value for serious apps.',
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

        // Code Protection - Basic
        classEncryption: {
            enabled: true,
            filters: [
                { pattern: 'com.myapp.**', type: 'include' }, // User replaces with their package
            ],
        },
        stringEncryption: {
            enabled: true,
            filters: [
                { pattern: 'com.myapp.**', type: 'include' },
            ],
        },

        // RASP - Minimal
        integrityControl: {
            enabled: true,
        },
        environmentChecks: {
            enabled: true,
            debug: true,
            root: false,
            emulator: false,
            hooks: false,
        },
    },

    standard: {
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Code Protection - Full
        classEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' }, // Protect everything
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

        // Resource Protection
        resourceEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },

        // RASP - Standard
        integrityControl: {
            enabled: true,
        },
        environmentChecks: {
            enabled: true,
            debug: true,
            root: true,
            emulator: true,
            hooks: false,
        },
    },

    enhanced: {
        verbose: false,
        optimize: true,
        signMode: 'debug',

        // Code Protection - Maximum
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
        stripLogging: {
            enabled: true,
            filters: [
                { pattern: 'android.util.Log', type: 'include' },
            ],
        },

        // Resource Protection - Full
        resourceEncryption: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },
        assets: {
            enabled: true,
            filters: [
                { pattern: '**', type: 'include' },
            ],
        },

        // RASP - Maximum
        integrityControl: {
            enabled: true,
        },
        environmentChecks: {
            enabled: true,
            debug: true,
            root: true,
            emulator: true,
            hooks: true,
        },

        // Security Assessment
        securityAssessment: {
            signingCertificateCompromised: 'error',
            signingCertificateWeakKey: 'error',
            dependencyCheck: 'warning',
        },
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
            { key: 'stripLogging', label: 'Strip Logging', type: 'filter', default: false, description: 'Remove Log calls' },
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
        description: 'Detect hostile environments at runtime',
        options: [
            { key: 'integrityControl', label: 'Integrity Control', type: 'rasp', default: true, description: 'Detect tampering' },
            { key: 'environmentChecks.debug', label: 'Debug Detection', type: 'boolean', default: true, description: 'Detect debuggers' },
            { key: 'environmentChecks.root', label: 'Root Detection', type: 'boolean', default: true, description: 'Detect rooted devices' },
            { key: 'environmentChecks.emulator', label: 'Emulator Detection', type: 'boolean', default: true, description: 'Detect emulators' },
            { key: 'environmentChecks.hooks', label: 'Hook Detection', type: 'boolean', default: false, description: 'Detect Frida/Xposed' },
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
    if (config.stripLogging?.enabled) {
        xml += addFilterTag('stripLogging', config.stripLogging.filters);
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

    // RASP
    if (config.integrityControl?.enabled) {
        const callback = config.integrityControl.callback ? ` callback="${config.integrityControl.callback}"` : '';
        xml += `  <integrityControl${callback}/>\n`;
    }
    if (config.environmentChecks?.enabled) {
        const callback = config.environmentChecks.callback ? ` callback="${config.environmentChecks.callback}"` : '';
        xml += `  <environmentChecks${callback}>\n`;
        if (config.environmentChecks.debug) xml += '    <debug/>\n';
        if (config.environmentChecks.root) xml += '    <root/>\n';
        if (config.environmentChecks.emulator) xml += '    <emulator/>\n';
        if (config.environmentChecks.hooks) xml += '    <hooks/>\n';
        xml += '  </environmentChecks>\n';
    }

    // Security Assessment
    if (config.securityAssessment) {
        xml += '  <securityAssessment>\n';
        if (config.securityAssessment.signingCertificateCompromised) {
            xml += `    <signingCertificateCompromised>${config.securityAssessment.signingCertificateCompromised}</signingCertificateCompromised>\n`;
        }
        if (config.securityAssessment.signingCertificateWeakKey) {
            xml += `    <signingCertificateWeakKey>${config.securityAssessment.signingCertificateWeakKey}</signingCertificateWeakKey>\n`;
        }
        if (config.securityAssessment.dependencyCheck) {
            xml += `    <dependencyCheck>${config.securityAssessment.dependencyCheck}</dependencyCheck>\n`;
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
