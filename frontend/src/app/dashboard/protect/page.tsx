'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, addDoc, collection, updateDoc, increment, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'
import { DexProtectorConfig, ConfigTier } from '@/types'
import { TIER_CREDITS, generateXML } from '@/lib/dexprotectorConfig'
import { Upload, ArrowLeft, Loader, Shield } from 'lucide-react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import ConfigSelector from '@/components/ConfigSelector'
import DashboardHeader from '@/components/DashboardHeader'
import { logger } from '@/lib/logger'

export default function ProtectPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [credits, setCredits] = useState(0)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedConfig, setSelectedConfig] = useState<{ tier: ConfigTier; config: DexProtectorConfig; keystoreFile?: File } | null>(null)
    const [showConfigSelector, setShowConfigSelector] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/auth/login')
                return
            }

            setUserId(user.uid)

            // Load credits
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
                setCredits(userDoc.data().credits || 0)
            }
        })

        return () => unsubscribe()
    }, [router])

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const apkFile = acceptedFiles[0]

            // Validate file type
            if (!apkFile.name.endsWith('.apk') && !apkFile.name.endsWith('.aab')) {
                toast.error('Please upload an APK or AAB file')
                return
            }

            // Validate file size (120MB)
            if (apkFile.size > 120 * 1024 * 1024) {
                toast.error('File size must be less than 120MB')
                return
            }

            setFile(apkFile)
            toast.success(`Selected: ${apkFile.name}`)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.android.package-archive': ['.apk'],
            'application/octet-stream': ['.aab'],
        },
        maxFiles: 1,
        maxSize: 120 * 1024 * 1024,
    })

    const handleConfigSelect = (tier: ConfigTier, config: DexProtectorConfig, creditsUsed: number, keystoreFile?: File) => {
        setSelectedConfig({ tier, config, keystoreFile })
        setShowConfigSelector(false)
        toast.success(`${tier.charAt(0).toUpperCase() + tier.slice(1)} configuration selected`)
    }

    const handleProtect = async () => {
        if (!file || !userId || !selectedConfig) {
            toast.error('Please upload a file and select a configuration')
            return
        }

        const creditsRequired = TIER_CREDITS[selectedConfig.tier]

        // Check credits
        if (credits < creditsRequired) {
            toast.error(`Insufficient credits. Need ${creditsRequired}, have ${credits}`)
            router.push('/pricing')
            return
        }

        setUploading(true)

        try {
            // Create job document
            const jobRef = await addDoc(collection(db, 'jobs'), {
                userId,
                status: 'pending',
                inputFile: '',
                configTier: selectedConfig.tier,
                creditsUsed: creditsRequired,
                createdAt: Timestamp.now(),
            })

            // Upload file to Cloud Storage
            const storageRef = ref(storage, `users/${userId}/inputs/${jobRef.id}/${file.name}`)
            const uploadTask = uploadBytesResumable(storageRef, file)

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    setUploadProgress(progress)
                },
                (error) => {
                    logger.error('Upload error:', error)
                    toast.error('Upload failed. Please try again.')
                    setUploading(false)
                },
                async () => {
                    const inputFilePath = `users/${userId}/inputs/${jobRef.id}/${file.name}`

                    // Generate XML config
                    const configXml = generateXML(selectedConfig.config)

                    // Update job with file path and config
                    await updateDoc(doc(db, 'jobs', jobRef.id), {
                        inputFile: inputFilePath,
                        configXml,
                    })

                    // Deduct credits
                    await updateDoc(doc(db, 'users', userId), {
                        credits: increment(-creditsRequired),
                    })

                    // Add transaction
                    await addDoc(collection(db, 'transactions'), {
                        userId,
                        type: 'deduction',
                        credits: -creditsRequired,
                        description: `APK protection (${selectedConfig.tier})`,
                        jobId: jobRef.id,
                        createdAt: Timestamp.now(),
                    })

                    setUploading(false)
                    toast.success('APK uploaded! Processing will start shortly.')

                    // Redirect to dashboard
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 2000)
                }
            )
        } catch (error) {
            logger.error('Error:', error)
            toast.error('Failed to start protection process')
            setUploading(false)
        }
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] text-white no-scroll-x">
            {/* Header */}
            <DashboardHeader
                credits={credits}
                showAuthButtons={false}
            />

            {/* Back Button + Page Info */}
            <div className="container mx-auto px-4 py-3 sm:py-4 border-b border-border/50">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors font-mono text-xs sm:text-sm touch-manipulation p-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>back to dashboard</span>
                </Link>
            </div>

            <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-4xl safe-bottom">
                {/* Page Title */}
                <div className="mb-6 sm:mb-8">
                    <div className="font-mono text-primary text-xs sm:text-sm mb-2">
                        <span className="text-primary/60">$</span> ./fortify --init
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2 font-mono">
                        [PROTECT_APK]
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                        <span className="text-primary">{'>'}</span> upload && configure && deploy
                    </p>
                </div>

                {/* File Upload */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 font-mono">
                        [01] <span className="text-foreground">UPLOAD_APK</span>
                    </h2>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 md:p-12 text-center cursor-pointer transition-all font-mono touch-manipulation ${isDragActive
                            ? 'border-primary bg-primary/10 cyber-glow'
                            : 'border-border hover:border-primary hover:bg-card/50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-3 sm:mb-4 cyber-glow" />
                        {file ? (
                            <div>
                                <p className="text-base sm:text-lg font-medium text-foreground mb-2 font-mono break-all px-2">{file.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                                    <span className="text-primary">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFile(null)
                                    }}
                                    className="mt-3 sm:mt-4 text-primary hover:text-primary/80 font-medium font-mono text-sm sm:text-base touch-manipulation px-4 py-2"
                                >
                                    <span className="text-primary/60">$</span> rm --file
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-base sm:text-lg font-medium text-foreground mb-2 font-mono px-2">
                                    {isDragActive ? '<< DROP_FILE_HERE >>' : '>> DRAG_DROP_APK'}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground font-mono px-2">
                                    or click to browse <span className="text-primary/60">//</span> max 120MB
                                </p>
                            </div>
                        )}
                    </div>

                    {uploading && (
                        <div className="mt-3 sm:mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs sm:text-sm font-medium text-primary font-mono">uploading...</span>
                                <span className="text-xs sm:text-sm font-medium text-primary font-mono">{uploadProgress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-background rounded-full h-2 terminal-border">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300 cyber-glow"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Configuration Selection */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 font-mono">
                        [02] <span className="text-foreground">PROTECTION_LEVEL</span>
                    </h2>

                    {selectedConfig ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 terminal-border bg-card p-3 sm:p-4 rounded-lg">
                            <div>
                                <p className="text-sm sm:text-base text-foreground font-medium capitalize font-mono">[{selectedConfig.tier.toUpperCase()}]</p>
                                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                                    {TIER_CREDITS[selectedConfig.tier]} credit{TIER_CREDITS[selectedConfig.tier] > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowConfigSelector(true)}
                                className="text-primary hover:text-primary/80 font-medium font-mono text-sm sm:text-base touch-manipulation self-end sm:self-auto px-3 py-2"
                            >
                                ./config --change
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfigSelector(true)}
                            className="w-full bg-primary text-background py-2.5 sm:py-3 rounded font-semibold hover:bg-primary/90 transition-all cyber-glow font-mono text-sm sm:text-base touch-manipulation min-h-[44px]"
                        >
                            ./select --config
                        </button>
                    )}
                </div>

                {/* Submit */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-primary font-mono">[COST]</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                                <span className="text-primary/60">//</span> {selectedConfig ? TIER_CREDITS[selectedConfig.tier] : '?'} credit{selectedConfig && TIER_CREDITS[selectedConfig.tier] > 1 ? 's' : ''} will be deducted
                            </p>
                        </div>
                        {selectedConfig && (
                            <div className="text-2xl sm:text-3xl font-bold gradient-text font-mono">{TIER_CREDITS[selectedConfig.tier]}</div>
                        )}
                    </div>

                    <button
                        onClick={handleProtect}
                        disabled={!file || !selectedConfig || uploading}
                        className="w-full bg-primary text-background py-3 sm:py-4 rounded font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cyber-glow font-mono text-sm sm:text-base touch-manipulation min-h-[48px]"
                    >
                        {uploading ? (
                            <>
                                <Loader className="h-5 w-5 animate-spin" />
                                <span>uploading...</span>
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5" />
                                <span>./protect --execute</span>
                            </>
                        )}
                    </button>

                    {selectedConfig && credits < TIER_CREDITS[selectedConfig.tier] && (
                        <p className="mt-4 text-center text-sm text-red-400 font-mono">
                            <span className="text-red-500">ERROR:</span> insufficient credits {' '}
                            <Link href="/pricing" className="font-semibold underline text-primary">
                                ./purchase --credits
                            </Link>
                        </p>
                    )}
                </div>
            </div>

            {/* Config Selector Modal */}
            {showConfigSelector && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                            <h2 className="text-2xl font-bold gradient-text font-mono">[SELECT_CONFIGURATION]</h2>
                            <button
                                onClick={() => setShowConfigSelector(false)}
                                className="text-muted-foreground hover:text-primary transition-colors text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <ConfigSelector userCredits={credits} onSelect={handleConfigSelect} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
