'use client'

import { useState } from 'react'
import { ConfigTier, DexProtectorConfig, Filter } from '@/types'
import { TIER_CREDITS, TIER_DESCRIPTIONS, PRESET_CONFIGS, generateXML } from '@/lib/dexprotectorConfig'
import { isFeatureAvailable, getMaxFilters, isPatternAllowed, getPatternValidationMessage } from '@/lib/tierFeatures'
import { Check, Zap, Shield, Settings, ChevronRight, Plus, Trash2, HelpCircle } from 'lucide-react'

interface ConfigSelectorProps {
    userCredits: number
    onSelect: (tier: ConfigTier, config: DexProtectorConfig, creditsUsed: number, keystoreFile?: File) => void
}

export default function ConfigSelector({ userCredits, onSelect }: ConfigSelectorProps) {
    const [selectedTier, setSelectedTier] = useState<ConfigTier | null>(null)
    const [customConfig, setCustomConfig] = useState<DexProtectorConfig | null>(null)
    const [showCustomEditor, setShowCustomEditor] = useState(false)
    const [keystoreFile, setKeystoreFile] = useState<File | null>(null)

    const tiers: ConfigTier[] = ['basic', 'standard', 'enhanced', 'custom']

    const handleTierSelect = (tier: ConfigTier) => {
        setSelectedTier(tier)

        if (tier === 'custom') {
            setShowCustomEditor(true)
            setCustomConfig(PRESET_CONFIGS.enhanced) // Start with enhanced as template
        } else {
            // For presets, open editor with preset config so users can review/modify
            const config = PRESET_CONFIGS[tier]
            const creditsUsed = TIER_CREDITS[tier]

            if (creditsUsed > userCredits) {
                alert(`Insufficient credits! You need ${creditsUsed} credits but only have ${userCredits}.`)
                return
            }

            // Open editor with preset config
            setShowCustomEditor(true)
            setCustomConfig(config)
        }
    }

    const handleCustomSubmit = () => {
        if (!customConfig || !selectedTier) return

        const creditsUsed = TIER_CREDITS[selectedTier]

        if (creditsUsed > userCredits) {
            alert(`Insufficient credits! You need ${creditsUsed} credits but only have ${userCredits}.`)
            return
        }

        // If release mode, require keystore
        if (customConfig.signMode === 'release' && !keystoreFile) {
            alert('Please upload a keystore file for release signing.')
            return
        }

        // If Google or Amazon mode, require SHA-256 fingerprint
        if ((customConfig.signMode === 'google' || customConfig.signMode === 'amazon') && !customConfig.sha256CertificateFingerprint) {
            alert(`Please provide SHA-256 certificate fingerprint for ${customConfig.signMode === 'google' ? 'Google Play' : 'Amazon Appstore'} signing.`)
            return
        }

        onSelect(selectedTier, customConfig, creditsUsed, keystoreFile || undefined)
    }

    return (
        <div className="space-y-6 safe-bottom">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-mono gradient-text mb-2">[SELECT_PROTECTION_LEVEL]</h2>
                <p className="text-muted-foreground font-mono text-sm md:text-base">select preset or customize configuration</p>
                <div className="mt-3 inline-flex items-center space-x-2 terminal-border bg-card/50 px-4 py-2 rounded backdrop-blur">
                    <span className="text-muted-foreground font-mono text-sm">balance:</span>
                    <span className="text-primary font-bold font-mono text-glow">{userCredits}</span>
                    <span className="text-muted-foreground font-mono text-sm">credits</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier) => {
                    const tierInfo = TIER_DESCRIPTIONS[tier]
                    const credits = TIER_CREDITS[tier]
                    const canAfford = credits <= userCredits
                    const isPopular = tier === 'custom'

                    return (
                        <div
                            key={tier}
                            className={`relative border-2 rounded-lg p-4 md:p-6 transition-all duration-200 cursor-pointer font-mono touch-manipulation min-h-[44px] ${selectedTier === tier
                                ? 'border-primary bg-primary/10 scale-105'
                                : canAfford
                                    ? 'terminal-border bg-card/30 backdrop-blur hover:border-primary hover:scale-102'
                                    : 'border-border bg-card/10 opacity-50 cursor-not-allowed'
                                }`}
                            onClick={() => canAfford && handleTierSelect(tier)}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full font-mono">
                                    MOST_POPULAR
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <div className="text-2xl">
                                    {tier === 'basic' && <Shield className="text-blue-400 cyber-glow" />}
                                    {tier === 'standard' && <Shield className="text-green-400 cyber-glow" />}
                                    {tier === 'enhanced' && <Shield className="text-purple-400 cyber-glow" />}
                                    {tier === 'custom' && <Settings className="text-primary cyber-glow" />}
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-foreground">{credits}</div>
                                    <div className="text-xs text-muted-foreground">credits</div>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">{tierInfo.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{tierInfo.description}</p>

                            <ul className="space-y-2 mb-4">
                                {tierInfo.features.slice(0, 4).map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm">
                                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                                {tierInfo.features.length > 4 && (
                                    <li className="text-xs text-muted-foreground/70 ml-6 font-mono">
                                        +{tierInfo.features.length - 4} more_features
                                    </li>
                                )}
                            </ul>

                            {!canAfford && (
                                <div className="text-xs text-red-400 font-semibold font-mono">
                                    insufficient_credits
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {showCustomEditor && customConfig && selectedTier && (
                <CustomConfigEditor
                    tier={selectedTier}
                    config={customConfig}
                    onChange={setCustomConfig}
                    onSubmit={handleCustomSubmit}
                    onCancel={() => {
                        setShowCustomEditor(false)
                        setSelectedTier(null)
                        setCustomConfig(null)
                        setKeystoreFile(null)
                    }}
                    keystoreFile={keystoreFile}
                    onKeystoreUpload={setKeystoreFile}
                />
            )}
        </div>
    )
}

interface CustomConfigEditorProps {
    tier: ConfigTier
    config: DexProtectorConfig
    onChange: (config: DexProtectorConfig) => void
    onSubmit: () => void
    onCancel: () => void
    keystoreFile?: File | null
    onKeystoreUpload?: (file: File | null) => void
}

function CustomConfigEditor({ tier, config, onChange, onSubmit, onCancel, keystoreFile, onKeystoreUpload }: CustomConfigEditorProps) {
    const [activeSection, setActiveSection] = useState<'code' | 'resource' | 'rasp' | 'network' | 'security' | 'signing'>('code')
    const [showSidebar, setShowSidebar] = useState(false)
    
    // Preset tiers are read-only except for filter customization
    const isReadOnly = tier !== 'custom'

    const toggleOption = (key: string, value: any) => {
        const keys = key.split('.')
        let newConfig = { ...config }

        if (keys.length === 1) {
            newConfig = { ...newConfig, [keys[0]]: value }
        } else if (keys.length === 2) {
            const parent = keys[0] as keyof DexProtectorConfig
            const child = keys[1]
            newConfig = {
                ...newConfig,
                [parent]: {
                    ...(newConfig[parent] as any),
                    [child]: value,
                },
            }
        }

        onChange(newConfig)
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-0 overflow-y-auto safe-top safe-bottom">
            <div className="terminal-border bg-[#0f1419] md:bg-card/95 backdrop-blur rounded-none md:rounded-lg w-full min-h-screen md:min-h-0 md:max-w-6xl md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col my-0 md:my-4">
                <div className="p-4 md:p-6 border-b border-border">
                    <div className="flex items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl md:text-2xl font-bold font-mono gradient-text">
                                [{tier.toUpperCase()}_CONFIG]
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
                                {tier === 'custom' ? 'fine_tune --all-features' : `review and customize ${tier} preset`}
                            </p>
                        </div>
                        <div className="text-center sm:text-right">
                            <div className="text-2xl md:text-3xl font-bold text-primary font-mono cyber-glow">
                                {TIER_CREDITS[tier]} credit{TIER_CREDITS[tier] > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                                {tier === 'custom' ? 'max_flexibility' : `${tier}_tier`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Mobile Section Selector */}
                    <div className="lg:hidden absolute top-0 left-0 right-0 z-10 bg-card/95 border-b border-border p-2">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="w-full flex items-center justify-between p-3 rounded-lg terminal-border bg-card hover:bg-muted transition-all font-mono touch-manipulation"
                        >
                            <span className="text-primary font-medium">{activeSection.replace('_', ' ')}</span>
                            <ChevronRight className={`w-5 h-5 transition-transform ${showSidebar ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    {/* Sidebar Navigation */}
                    <div className={`
                        ${showSidebar ? 'absolute inset-0 z-20' : 'hidden'}
                        lg:relative lg:block
                        w-full lg:w-64 
                        border-r border-border 
                        p-4 space-y-2 
                        overflow-y-auto 
                        bg-card lg:bg-card/30
                    `}>
                        {[
                            { id: 'code', label: 'code_protection', icon: Shield },
                            { id: 'resource', label: 'resources', icon: Shield },
                            { id: 'rasp', label: 'rasp', icon: Zap },
                            { id: 'network', label: 'network_security', icon: Shield },
                            { id: 'security', label: 'security', icon: Shield },
                            { id: 'signing', label: 'signing', icon: Settings },
                        ].map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id as any)
                                    setShowSidebar(false)
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all font-mono touch-manipulation min-h-[44px] ${activeSection === section.id
                                    ? 'bg-primary/20 text-primary border border-primary cyber-glow'
                                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <section.icon className="w-5 h-5 mr-2" />
                                    <span className="font-medium">{section.label}</span>
                                </div>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    {/* Configuration Options */}
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-card/20 mt-16 lg:mt-0">
                        {activeSection === 'code' && (
                            <CodeProtectionSection config={config} toggleOption={toggleOption} isReadOnly={isReadOnly} tier={tier} />
                        )}
                        {activeSection === 'resource' && (
                            <ResourceProtectionSection config={config} toggleOption={toggleOption} isReadOnly={isReadOnly} tier={tier} />
                        )}
                        {activeSection === 'rasp' && (
                            <RaspProtectionSection config={config} toggleOption={toggleOption} isReadOnly={isReadOnly} tier={tier} />
                        )}
                        {activeSection === 'network' && (
                            <NetworkSecuritySection config={config} toggleOption={toggleOption} isReadOnly={isReadOnly} tier={tier} />
                        )}
                        {activeSection === 'security' && (
                            <SecurityAssessmentSection config={config} toggleOption={toggleOption} isReadOnly={isReadOnly} tier={tier} />
                        )}
                        {activeSection === 'signing' && (
                            <SigningConfigSection
                                config={config}
                                toggleOption={toggleOption}
                                keystoreFile={keystoreFile}
                                onKeystoreUpload={onKeystoreUpload}
                                isReadOnly={isReadOnly}
                                tier={tier}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 border-t border-border flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card/30 safe-bottom">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 terminal-border text-muted-foreground rounded-lg hover:bg-card transition-all font-mono touch-manipulation min-h-[44px]"
                    >
                        cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-6 md:px-8 py-3 terminal-border bg-primary/20 hover:bg-primary/30 text-primary font-bold rounded-lg hover:scale-105 transition-all font-mono cyber-glow touch-manipulation min-h-[44px]"
                    >
                        <span className="hidden sm:inline">./apply --config ({TIER_CREDITS[tier]}_credits)</span>
                        <span className="sm:hidden">apply ({TIER_CREDITS[tier]} credits)</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// Section Components
interface SectionProps {
    config: DexProtectorConfig
    toggleOption: (key: string, value: any) => void
    isReadOnly: boolean
    tier: ConfigTier  // Add tier to determine which features to show
}

function CodeProtectionSection({ config, toggleOption, isReadOnly, tier }: SectionProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-mono gradient-text">[CODE_PROTECTION]</h3>

            {/* Only show features available in the selected tier */}
            {isFeatureAvailable(tier, 'classEncryption') && (
                <>
                    <ToggleOption
                        label="Class Encryption"
                        description="Encrypt DEX files to prevent decompilation"
                        enabled={config.classEncryption?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('classEncryption', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.classEncryption}
                        tooltip="Encrypts DEX bytecode to prevent reverse engineering tools (dex2jar, jadx) from decompiling your app. The encrypted classes are decrypted at runtime. Use filters to specify which packages to encrypt (e.g., com.example.models.** to encrypt all model classes)."
                    />
                    {config.classEncryption?.enabled && (
                        <FilterManager
                            label="Class Encryption Filters"
                            description="Specify which classes to encrypt (e.g., com.example.models.**)"
                            filters={config.classEncryption.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('classEncryption', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}

            {isFeatureAvailable(tier, 'stringEncryption') && (
                <>
                    <ToggleOption
                        label="String Encryption"
                        description="Encrypt string literals in your code"
                        enabled={config.stringEncryption?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('stringEncryption', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.stringEncryption}
                        tooltip="Encrypts string constants (API keys, URLs, sensitive text) so they don't appear in plaintext in the APK. Strings are decrypted at runtime when accessed. Essential for hiding hardcoded secrets and configuration values from static analysis."
                    />
                    {config.stringEncryption?.enabled && (
                        <FilterManager
                            label="String Encryption Filters"
                            description="Specify which classes to apply string encryption (e.g., com.example.**)"
                            filters={config.stringEncryption.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('stringEncryption', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}

            {isFeatureAvailable(tier, 'hideAccess') && (
                <>
                    <ToggleOption
                        label="Hide Access"
                        description="Obfuscate method calls and field access"
                        enabled={config.hideAccess?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('hideAccess', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.hideAccess}
                        tooltip="Hides method invocations and field accesses by replacing them with reflection or native code calls. Makes it much harder for attackers to understand your app's control flow and data access patterns. More powerful than standard ProGuard obfuscation."
                    />
                    {config.hideAccess?.enabled && (
                        <FilterManager
                            label="Hide Access Filters"
                            description="Specify which classes to obfuscate method/field access"
                            filters={config.hideAccess.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('hideAccess', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}

            {isFeatureAvailable(tier, 'annotationEncryption') && (
                <>
                    <ToggleOption
                        label="Annotation Encryption"
                        description="Encrypt runtime-visible annotations"
                        enabled={config.annotationEncryption?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('annotationEncryption', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.annotationEncryption}
                        tooltip="Encrypts Kotlin/Java annotations that are visible at runtime (e.g., @Serializable, @Inject, @Route). Prevents attackers from analyzing your app's dependency injection, serialization logic, or routing structure. Essential for Kotlin apps using Koin/Dagger/Room."
                    />
                    {config.annotationEncryption?.enabled && (
                        <FilterManager
                            label="Annotation Encryption Filters"
                            description="Specify which annotations to encrypt"
                            filters={config.annotationEncryption.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('annotationEncryption', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}

            {isFeatureAvailable(tier, 'jniObfuscation') && (
                <ToggleOption
                    label="JNI Obfuscation"
                    description="Obfuscate native method names"
                    enabled={config.jniObfuscation || false}
                    onToggle={(val: boolean) => toggleOption('jniObfuscation', val)}
                    disabled={isReadOnly && !config.jniObfuscation}
                    tooltip="Renames JNI (Java Native Interface) method names to random strings, making it harder to find the bridge between Java/Kotlin code and C/C++ native libraries. Breaks tools that try to hook or analyze native method calls."
                />
            )}

            {isFeatureAvailable(tier, 'nativeLibraryEncryption') && (
                <>
                    <ToggleOption
                        label="Native Library Encryption"
                        description="Encrypt .so files"
                        enabled={config.nativeLibraryEncryption?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('nativeLibraryEncryption', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.nativeLibraryEncryption}
                        tooltip="Encrypts native libraries (.so files) to prevent analysis with tools like IDA Pro or Ghidra. The libraries are decrypted in memory at runtime. Critical for apps with sensitive C/C++ code, crypto implementations, or proprietary algorithms."
                    />
                    {config.nativeLibraryEncryption?.enabled && (
                        <FilterManager
                            label="Native Library Encryption Filters"
                            description="Specify which .so files to encrypt"
                            filters={config.nativeLibraryEncryption.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('nativeLibraryEncryption', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}

            {isFeatureAvailable(tier, 'stripLogging') && (
                <>
                    <ToggleOption
                        label="Strip Logging"
                        description="Remove logging statements from code"
                        enabled={config.stripLogging?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('stripLogging', { enabled: val, filters: [{ pattern: 'android.util.Log', type: 'include' }] })}
                        disabled={isReadOnly && !config.stripLogging}
                        tooltip="Removes logging calls (Log.d, Log.v, Log.i, System.out.println) from your production APK. Prevents sensitive debug information, variable names, and execution flow from leaking through logcat. Specify which logging frameworks to strip (e.g., android.util.Log, timber.log.Timber)."
                    />
                    {config.stripLogging?.enabled && (
                        <FilterManager
                            label="Strip Logging Filters"
                            description="Specify which logging statements to remove"
                            filters={config.stripLogging.filters || [{ pattern: 'android.util.Log', type: 'include' }]}
                            onChange={(filters) => toggleOption('stripLogging', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}
        </div>
    )
}

function ResourceProtectionSection({ config, toggleOption, isReadOnly, tier }: SectionProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-mono gradient-text">[RESOURCE_PROTECTION]</h3>

            {isFeatureAvailable(tier, 'resourceEncryption') && (
                <>
                    <ToggleOption
                        label="Resource Encryption"
                        description="Encrypt res/ folder (layouts, drawables, strings.xml)"
                        enabled={config.resourceEncryption?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('resourceEncryption', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.resourceEncryption}
                        tooltip="Encrypts Android resources in res/ folder (XML layouts, drawable images, strings.xml, colors.xml). Prevents extraction of UI designs, text content, and graphics from the APK. Decrypted at runtime by the app. Use filters to select specific resource types (e.g., layout/**, values/strings.xml)."
                    />
                    {config.resourceEncryption?.enabled && (
                        <FilterManager
                            label="Resource Encryption Filters"
                            description="Specify which resources to encrypt (e.g., layout/**, drawable/**)"
                            filters={config.resourceEncryption.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('resourceEncryption', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}

            {isFeatureAvailable(tier, 'assets') && (
                <>
                    <ToggleOption
                        label="Asset Encryption"
                        description="Encrypt assets/ folder files"
                        enabled={config.assets?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('assets', { enabled: val, filters: [{ pattern: '**', type: 'include' }] })}
                        disabled={isReadOnly && !config.assets}
                        tooltip="Encrypts files in the assets/ folder (JSON configs, databases, fonts, videos). Protects custom data files, configuration files, and bundled content from extraction. Use filters to specify file patterns (e.g., *.json, data/**/*.db, fonts/*.ttf)."
                    />
                    {config.assets?.enabled && (
                        <FilterManager
                            label="Asset Encryption Filters"
                            description="Specify which assets to encrypt (e.g., *.json, images/**)"
                            filters={config.assets.filters || [{ pattern: '**', type: 'include' }]}
                            onChange={(filters) => toggleOption('assets', { enabled: true, filters })}
                            tier={tier}
                        />
                    )}
                </>
            )}
        </div>
    )
}

function RaspProtectionSection({ config, toggleOption, isReadOnly, tier }: SectionProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-mono gradient-text">[RASP_PROTECTION]</h3>

            {isFeatureAvailable(tier, 'integrityControl') && (
                <ToggleOption
                    label="Integrity Control"
                    description="Detect tampering and re-signing"
                    enabled={config.integrityControl?.enabled || false}
                    onToggle={(val: boolean) => toggleOption('integrityControl', { enabled: val })}
                    disabled={isReadOnly && !config.integrityControl}
                    tooltip="Verifies that the APK hasn't been tampered with, repackaged, or re-signed with a different certificate. Detects modifications to DEX files, resources, or native libraries. Essential for preventing piracy, license bypasses, and malware injection."
                />
            )}

            {isFeatureAvailable(tier, 'environmentChecks') && (
                <>
                    <ToggleOption
                        label="Debug Detection"
                        description="Detect if a debugger is attached"
                        enabled={config.environmentChecks?.debug || false}
                        onToggle={(val: boolean) => toggleOption('environmentChecks.debug', val)}
                        disabled={isReadOnly && !config.environmentChecks}
                        tooltip="Detects if a debugger (JDWP, native GDB, LLDB) is attached to the app process. Prevents attackers from stepping through your code, inspecting variables, and finding vulnerabilities. The app can terminate or show a warning when a debugger is detected."
                    />

                    <ToggleOption
                        label="Root Detection"
                        description="Detect if the device is rooted"
                        enabled={config.environmentChecks?.root || false}
                        onToggle={(val: boolean) => toggleOption('environmentChecks.root', val)}
                        disabled={isReadOnly && !config.environmentChecks}
                        tooltip="Detects rooted/jailbroken devices (Magisk, SuperSU, KingRoot). Rooted devices can bypass Android security, modify app data, and access sensitive content. Critical for banking, payment, and DRM apps. Can block or warn users on rooted devices."
                    />

                    <ToggleOption
                        label="Emulator Detection"
                        description="Detect if running in an emulator"
                        enabled={config.environmentChecks?.emulator || false}
                        onToggle={(val: boolean) => toggleOption('environmentChecks.emulator', val)}
                        disabled={isReadOnly && !config.environmentChecks}
                        tooltip="Detects if the app is running in an Android emulator (Android Studio AVD, Genymotion, BlueStacks). Emulators are commonly used for automated analysis, API scraping, and bot attacks. Important for apps with sensitive transactions or content."
                    />

                    <ToggleOption
                        label="Hook Detection"
                        description="Detect Frida, Xposed, and other hooking frameworks"
                        enabled={config.environmentChecks?.hooks || false}
                        onToggle={(val: boolean) => toggleOption('environmentChecks.hooks', val)}
                        disabled={isReadOnly && !config.environmentChecks}
                        tooltip="Detects runtime hooking frameworks (Frida, Xposed/LSPosed, Substrate) that attackers use to modify app behavior, bypass security checks, and steal data. Essential for apps handling payments, authentication, or premium content."
                    />
                </>
            )}
        </div>
    )
}

function NetworkSecuritySection({ config, toggleOption, isReadOnly, tier }: SectionProps) {
    const [newDomain, setNewDomain] = useState('')
    const [newPin, setNewPin] = useState('')
    
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-mono gradient-text">[NETWORK_SECURITY]</h3>
            <p className="text-sm text-muted-foreground font-mono">SSL pinning & certificate transparency</p>

            {/* Public Key Pinning */}
            {isFeatureAvailable(tier, 'publicKeyPinning') && (
                <>
                    <ToggleOption
                        label="SSL Certificate Pinning"
                        description="Pin SSL certificates to prevent MITM attacks"
                        enabled={config.publicKeyPinning?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('publicKeyPinning', { enabled: val, domains: [] })}
                        disabled={isReadOnly && !config.publicKeyPinning}
                        tooltip="Prevents man-in-the-middle attacks by validating that the server's SSL certificate matches expected SHA-256 hashes. Essential for apps making sensitive API calls (banking, payments, authentication). Configure domains and their certificate pins below."
                    />
                    
                    {config.publicKeyPinning?.enabled && (
                        <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur space-y-4">
                            <div className="text-sm font-medium text-foreground font-mono">Certificate Pins</div>
                            
                            {/* Domain & Pin Manager */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        placeholder="api.example.com"
                                        className="flex-1 bg-background text-foreground border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value)}
                                        placeholder="sha256/AAAAAAAAAA..."
                                        className="flex-1 bg-background text-foreground border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            if (newDomain && newPin) {
                                                const domains = config.publicKeyPinning?.domains || []
                                                domains.push({
                                                    domain: newDomain,
                                                    includeSubdomains: false,
                                                    pins: [{ digest: 'sha256', hash: newPin }]
                                                })
                                                toggleOption('publicKeyPinning', { enabled: true, domains })
                                                setNewDomain('')
                                                setNewPin('')
                                            }
                                        }}
                                        className="terminal-border bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded transition-all cyber-glow"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="text-xs text-muted-foreground/70 font-mono">
                                    Get certificate pins: openssl s_client -connect example.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
                                </div>
                            </div>
                            
                            {/* Display existing domains */}
                            {config.publicKeyPinning?.domains && config.publicKeyPinning.domains.length > 0 && (
                                <div className="space-y-2">
                                    {config.publicKeyPinning.domains.map((domain, idx) => (
                                        <div key={idx} className="p-3 bg-card rounded border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-mono text-primary">{domain.domain}</span>
                                                <button
                                                    onClick={() => {
                                                        const domains = config.publicKeyPinning?.domains?.filter((_, i) => i !== idx) || []
                                                        toggleOption('publicKeyPinning', { enabled: true, domains })
                                                    }}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {domain.pins?.map((pin, pinIdx) => (
                                                <div key={pinIdx} className="text-xs text-muted-foreground font-mono truncate">
                                                    {pin.digest}/{pin.hash}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Certificate Transparency */}
            {isFeatureAvailable(tier, 'certificateTransparency') && (
                <>
                    <ToggleOption
                        label="Certificate Transparency"
                        description="Monitor certificate issuance for your domains"
                        enabled={config.certificateTransparency?.enabled || false}
                        onToggle={(val: boolean) => toggleOption('certificateTransparency', { enabled: val, domains: [] })}
                        disabled={isReadOnly && !config.certificateTransparency}
                        tooltip="Monitors CT logs to detect unauthorized SSL certificates issued for your domains. Helps prevent certificate mis-issuance and impersonation attacks. Configure which domains to monitor below."
                    />
                    
                    {config.certificateTransparency?.enabled && (
                        <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur space-y-4">
                            <div className="text-sm font-medium text-foreground font-mono">Monitored Domains</div>
                            
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="example.com"
                                    className="flex-1 bg-background text-foreground border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                                />
                                <button
                                    onClick={() => {
                                        if (newDomain) {
                                            const domains = config.certificateTransparency?.domains || []
                                            domains.push({ domain: newDomain, includeSubdomains: false })
                                            toggleOption('certificateTransparency', { enabled: true, domains })
                                            setNewDomain('')
                                        }
                                    }}
                                    className="terminal-border bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded transition-all cyber-glow font-mono"
                                >
                                    Add
                                </button>
                            </div>
                            
                            {config.certificateTransparency?.domains && config.certificateTransparency.domains.length > 0 && (
                                <div className="space-y-2">
                                    {config.certificateTransparency.domains.map((domain, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                                            <span className="text-sm font-mono text-foreground">{domain.domain}</span>
                                            <button
                                                onClick={() => {
                                                    const domains = config.certificateTransparency?.domains?.filter((_, i) => i !== idx) || []
                                                    toggleOption('certificateTransparency', { enabled: true, domains })
                                                }}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            
            {tier !== 'custom' && (
                <div className="text-xs text-yellow-400 font-mono bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                    ⚠️ Network Security features are only available in Custom tier. Upgrade for SSL pinning and certificate transparency monitoring.
                </div>
            )}
        </div>
    )
}

function SecurityAssessmentSection({ config, toggleOption, isReadOnly, tier }: SectionProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-mono gradient-text">[SECURITY_ASSESSMENT]</h3>
            <p className="text-sm text-muted-foreground font-mono">pre_build vulnerability checks</p>

            <SelectOption
                label="Compromised Certificate Check"
                description="Fail build if signing cert is compromised"
                value={config.securityAssessment?.signingCertificateCompromised || 'error'}
                options={['error', 'warning', 'off']}
                onChange={(val: string) => toggleOption('securityAssessment.signingCertificateCompromised', val)}
                tooltip="DexProtector checks if your signing certificate has been compromised or leaked. Options: error (fail build), warning (show warning), off (skip check)"
            />

            <SelectOption
                label="Weak Key Check"
                description="Fail build if signing key is weak (< 2048 bits)"
                value={config.securityAssessment?.signingCertificateWeakKey || 'error'}
                options={['error', 'warning', 'off']}
                onChange={(val: string) => toggleOption('securityAssessment.signingCertificateWeakKey', val)}
                tooltip="Checks if your signing key strength is below 2048 bits (RSA). Weak keys are vulnerable to brute force attacks. Options: error (fail build), warning (show warning), off (skip check)"
            />

            <SelectOption
                label="Dependency CVE Check"
                description="Check for known vulnerabilities in dependencies"
                value={config.securityAssessment?.dependencyCheck || 'warning'}
                options={['error', 'warning', 'off']}
                onChange={(val: string) => toggleOption('securityAssessment.dependencyCheck', val)}
                tooltip="Scans your dependencies for known Common Vulnerabilities and Exposures (CVEs). Options: error (fail build on CVEs), warning (show warnings), off (skip check)"
            />
        </div>
    )
}

function SigningConfigSection({ config, toggleOption, keystoreFile, onKeystoreUpload, isReadOnly }: SectionProps & { keystoreFile?: File | null; onKeystoreUpload?: (file: File | null) => void }) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && onKeystoreUpload) {
            // Validate file type
            if (!file.name.endsWith('.keystore') && !file.name.endsWith('.jks')) {
                alert('Please upload a valid keystore file (.keystore or .jks)')
                return
            }
            onKeystoreUpload(file)
        }
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-mono gradient-text">[SIGNING_CONFIG]</h3>

            <SelectOption
                label="sign_mode"
                description="APK/AAB signing method"
                value={config.signMode || 'debug'}
                options={['debug', 'release', 'google', 'amazon', 'none']}
                onChange={(val: string) => toggleOption('signMode', val)}
                tooltip="debug: Use local debug key | release: Use custom keystore (for direct distribution) | google: Google Play App Signing (requires SHA-256 fingerprint) | amazon: Amazon Appstore signing (requires SHA-256 fingerprint) | none: No signing (for system apps)"
            />

            {config.signMode === 'release' && (
                <div className="space-y-4">
                    <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur">
                        <div className="text-foreground font-medium font-mono mb-1">keystore_file</div>
                        <div className="text-sm text-muted-foreground font-mono mb-3">upload .keystore or .jks for release signing</div>

                        <label className="block">
                            <input
                                type="file"
                                accept=".keystore,.jks"
                                onChange={handleFileChange}
                                className="hidden"
                                id="keystore-upload"
                            />
                            <label
                                htmlFor="keystore-upload"
                                className="cursor-pointer inline-flex items-center px-4 py-2 terminal-border bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium transition-all font-mono cyber-glow"
                            >
                                {keystoreFile ? 'change_keystore' : 'upload_keystore'}
                            </label>
                        </label>

                        {keystoreFile && (
                            <div className="mt-3 p-3 bg-card rounded border border-primary/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-primary font-medium font-mono">{keystoreFile.name}</div>
                                        <div className="text-xs text-muted-foreground/70 font-mono">{(keystoreFile.size / 1024).toFixed(2)} KB</div>
                                    </div>
                                    <button
                                        onClick={() => onKeystoreUpload?.(null)}
                                        className="text-red-400 hover:text-red-300 text-sm font-mono"
                                    >
                                        remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keystore Credentials */}
                    <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur space-y-4">
                        <div className="text-foreground font-medium font-mono mb-3">keystore_credentials</div>

                        <div>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground font-mono mb-2">
                                storepass <span className="text-red-400">*</span>
                                <InfoTooltip text="The password to unlock the keystore file (.jks or .keystore). This is set when you create the keystore using keytool. Required for signing the APK." />
                            </label>
                            <input
                                type="password"
                                value={config.storepass || ''}
                                onChange={(e) => toggleOption('storepass', e.target.value)}
                                placeholder="keystore password"
                                className="w-full bg-card text-foreground border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none font-mono"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground font-mono mb-2">
                                alias <span className="text-red-400">*</span>
                                <InfoTooltip text="The alias name of the signing key inside the keystore. A keystore can contain multiple keys, each identified by an alias. Use 'keytool -list -keystore your-keystore.jks' to see available aliases." />
                            </label>
                            <input
                                type="text"
                                value={config.alias || ''}
                                onChange={(e) => toggleOption('alias', e.target.value)}
                                placeholder="key alias"
                                className="w-full bg-card text-foreground border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none font-mono"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground font-mono mb-2">
                                keypass <span className="text-red-400">*</span>
                                <InfoTooltip text="The password for the specific signing key (identified by the alias). This can be different from the storepass. Often the same as storepass for simplicity, but more secure when different." />
                            </label>
                            <input
                                type="password"
                                value={config.keypass || ''}
                                onChange={(e) => toggleOption('keypass', e.target.value)}
                                placeholder="key password"
                                className="w-full bg-card text-foreground border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none font-mono"
                            />
                        </div>

                        <div className="text-xs text-yellow-400 font-mono bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                            ⚠️ credentials are required for release signing
                        </div>
                    </div>
                </div>
            )}

            {(config.signMode === 'google' || config.signMode === 'amazon') && (
                <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur space-y-4">
                    <div className="text-foreground font-medium font-mono mb-3">
                        {config.signMode === 'google' ? 'google_play_signing' : 'amazon_appstore_signing'}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground font-mono mb-2">
                            SHA-256 Certificate Fingerprint <span className="text-red-400">*</span>
                            <InfoTooltip text="The SHA-256 fingerprint of your app's signing certificate. For Google Play: Find in Play Console > Release > Setup > App Integrity. For Amazon: Find in Amazon Developer Console. Format: XX:XX:XX:... (32 bytes separated by colons)." />
                        </label>
                        <input
                            type="text"
                            value={config.sha256CertificateFingerprint || ''}
                            onChange={(e) => toggleOption('sha256CertificateFingerprint', e.target.value)}
                            placeholder="XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
                            className="w-full bg-card text-foreground border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none font-mono text-sm"
                        />
                    </div>

                    <div className="text-xs text-blue-400 font-mono bg-blue-900/20 border border-blue-500/30 rounded p-3 space-y-2">
                        <div>ℹ️ <strong>How to get your SHA-256 fingerprint:</strong></div>
                        {config.signMode === 'google' && (
                            <>
                                <div>1. Go to Google Play Console → Your app → Setup → App integrity</div>
                                <div>2. Copy SHA-256 fingerprint from "Upload key certificate"</div>
                            </>
                        )}
                        {config.signMode === 'amazon' && (
                            <>
                                <div>1. Use keytool: <code className="bg-black/30 px-1 rounded">keytool -list -v -keystore your-key.keystore</code></div>
                                <div>2. Copy SHA-256 fingerprint from certificate</div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="text-xs text-muted-foreground/70 font-mono mt-2 p-3 bg-card/30 rounded border border-border">
                <strong>debug:</strong> Use local debug key<br />
                <strong>release:</strong> Use custom keystore (requires keystore upload)<br />
                <strong>google:</strong> Google Play App Signing (requires SHA-256 fingerprint)<br />
                <strong>amazon:</strong> Amazon Appstore signing (requires SHA-256 fingerprint)<br />
                <strong>none:</strong> Do not sign
            </div>
        </div>
    )
}

interface ToggleOptionProps {
    label: string
    description: string
    enabled: boolean
    onToggle: (value: boolean) => void
    disabled?: boolean
    tooltip?: string
}

function ToggleOption({ label, description, enabled, onToggle, disabled, tooltip }: ToggleOptionProps) {
    return (
        <div className={`flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border backdrop-blur ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div className="text-foreground font-medium font-mono">{label}</div>
                    {tooltip && <InfoTooltip text={tooltip} />}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-mono">{description}</div>
                {disabled && (
                    <div className="text-xs text-yellow-400 font-mono mt-1">
                        ⚠️ use custom tier to modify
                    </div>
                )}
            </div>
            <button
                onClick={() => !disabled && onToggle(!enabled)}
                disabled={disabled}
                className={`relative w-14 h-7 rounded-full transition-all ${
                    disabled ? 'cursor-not-allowed opacity-50' : ''
                } ${enabled ? 'bg-primary' : 'bg-border'}`}
            >
                <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    )
}

interface SelectOptionProps {
    label: string
    description: string
    value: string
    options: string[]
    onChange: (value: string) => void
    tooltip?: string
}

function SelectOption({ label, description, value, options, onChange, tooltip }: SelectOptionProps) {
    return (
        <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
                <div className="text-foreground font-medium font-mono">{label}</div>
                {tooltip && <InfoTooltip text={tooltip} />}
            </div>
            <div className="text-sm text-muted-foreground mb-3 font-mono">{description}</div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-card text-foreground border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none font-mono"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    )
}

// Filter Manager Component
interface FilterManagerProps {
    label: string
    description: string
    filters: Filter[]
    onChange: (filters: Filter[]) => void
    tier?: string
}

function FilterManager({ label, description, filters, onChange, tier = 'custom' }: FilterManagerProps) {
    const [newPattern, setNewPattern] = useState('')
    const [newType, setNewType] = useState<'include' | 'exclude'>('include')
    const [patternError, setPatternError] = useState('')

    const maxFilters = getMaxFilters(tier)
    const canAddMore = filters.length < maxFilters
    
    const validatePattern = (pattern: string): boolean => {
        if (!pattern.trim()) {
            setPatternError('Pattern cannot be empty')
            return false
        }
        
        if (!isPatternAllowed(tier, pattern.trim())) {
            setPatternError(getPatternValidationMessage(tier))
            return false
        }
        
        setPatternError('')
        return true
    }

    const addFilter = () => {
        if (validatePattern(newPattern)) {
            onChange([...filters, { pattern: newPattern.trim(), type: newType }])
            setNewPattern('')
            setPatternError('')
        }
    }

    const removeFilter = (index: number) => {
        onChange(filters.filter((_, i) => i !== index))
    }

    const updateFilter = (index: number, field: 'pattern' | 'type', value: string) => {
        const updated = [...filters]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    return (
        <div className="p-4 bg-card/50 rounded-lg border border-border backdrop-blur space-y-3">
            <div>
                <div className="flex items-center gap-2 text-foreground font-medium mb-1 font-mono">
                    {label}
                    <InfoTooltip text="Filters use glob patterns: ** matches any packages/folders, * matches any characters except dots. Examples: com.example.** (all subpackages), com.*.models (any middle package), !com.example.test.** (exclude test packages). Include filters select what to protect, exclude filters remove from selection." />
                </div>
                <div className="text-sm text-muted-foreground mb-3 font-mono">{description}</div>
            </div>

            {/* Existing Filters */}
            {filters.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filters.map((filter, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-card rounded border border-border">
                            <input
                                type="text"
                                value={filter.pattern}
                                onChange={(e) => updateFilter(idx, 'pattern', e.target.value)}
                                className="flex-1 bg-background text-foreground border border-border rounded px-3 py-1 text-sm font-mono focus:border-primary focus:outline-none"
                                placeholder="com.example.**"
                            />
                            <select
                                value={filter.type}
                                onChange={(e) => updateFilter(idx, 'type', e.target.value)}
                                className="bg-background text-foreground border border-border rounded px-2 py-1 text-sm font-mono focus:border-primary focus:outline-none"
                            >
                                <option value="include">include</option>
                                <option value="exclude">exclude</option>
                            </select>
                            <button
                                onClick={() => removeFilter(idx)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Filter */}
            <div className="space-y-2">
                {!canAddMore && (
                    <div className="text-xs text-yellow-400 font-mono bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                        ⚠️ {tier === 'basic' ? 'Basic tier' : tier === 'standard' ? 'Standard tier' : 'Enhanced tier'} limited to {maxFilters} filter{maxFilters !== 1 ? 's' : ''}. Upgrade to Custom tier for unlimited filters.
                    </div>
                )}
                
                {patternError && (
                    <div className="text-xs text-red-400 font-mono bg-red-900/20 border border-red-500/30 rounded p-2">
                        ❌ {patternError}
                    </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <input
                        type="text"
                        value={newPattern}
                        onChange={(e) => {
                            setNewPattern(e.target.value)
                            setPatternError('')
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && canAddMore && addFilter()}
                        onBlur={() => newPattern && validatePattern(newPattern)}
                        disabled={!canAddMore}
                        className="flex-1 bg-background text-foreground border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={tier === 'basic' ? 'only ** allowed' : "add_filter_pattern (e.g., com.example.**)"}
                    />
                    <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as 'include' | 'exclude')}
                        disabled={!canAddMore}
                        className="bg-background text-foreground border border-border rounded px-2 py-2 text-sm font-mono focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="include">include</option>
                        <option value="exclude">exclude</option>
                    </select>
                    <button
                        onClick={addFilter}
                        disabled={!canAddMore}
                        className="terminal-border bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded transition-all cyber-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/20"
                        title={!canAddMore ? `${tier} tier allows maximum ${maxFilters} filter${maxFilters !== 1 ? 's' : ''}` : 'Add filter'}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="text-xs text-muted-foreground/70 font-mono pt-2">
                <strong>Tier Limits:</strong> {tier === 'basic' ? '1 filter, only ** pattern' : tier === 'standard' ? '3 filters, simple patterns' : tier === 'enhanced' ? '5 filters, simple patterns' : 'Unlimited filters, all patterns'}<br />
                <strong>Patterns:</strong> Use ** for any package/class, * for any in current level<br />
                <strong>Examples:</strong> com.example.**, **.R, com.myapp.utils.*
            </div>
        </div>
    )
}

// Tooltip component for help text
function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false)

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onClick={() => setShow(!show)}
                className="text-primary/60 hover:text-primary transition-colors"
            >
                <HelpCircle className="w-4 h-4" />
            </button>
            {show && (
                <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-card border border-primary/30 rounded-lg shadow-lg text-xs text-muted-foreground font-mono">
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary/30"></div>
                    {text}
                </div>
            )}
        </div>
    )
}
