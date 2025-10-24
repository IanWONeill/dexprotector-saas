'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'
import { ProtectionConfig, DEFAULT_CONFIG, PRESET_CONFIGS } from '@/types'
import { generateDexProtectorXML, validateConfig } from '@/lib/configGenerator'
import { Shield, Upload, ArrowLeft, Settings as SettingsIcon, Loader, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export default function ProtectPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [credits, setCredits] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [config, setConfig] = useState<ProtectionConfig>(DEFAULT_CONFIG)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<'basic' | 'standard' | 'maximum'>('basic')

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

  const handlePresetChange = (preset: 'basic' | 'standard' | 'maximum') => {
    setSelectedPreset(preset)
    setConfig(PRESET_CONFIGS[preset].config)
  }

  const handleProtect = async () => {
    if (!file || !userId) return

    // Check credits
    if (credits < 1) {
      toast.error('Insufficient credits. Please purchase more credits.')
      router.push('/pricing')
      return
    }

    // Validate config
    const validation = validateConfig(config)
    if (!validation.valid) {
      toast.error(validation.errors[0])
      return
    }

    setUploading(true)

    try {
      // Create job document
      const jobRef = await addDoc(collection(db, 'jobs'), {
        userId,
        status: 'pending',
        inputFile: '',
        config,
        createdAt: serverTimestamp(),
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
          console.error('Upload error:', error)
          toast.error('Upload failed. Please try again.')
          setUploading(false)
        },
        async () => {
          // Upload complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          const inputFilePath = `users/${userId}/inputs/${jobRef.id}/${file.name}`

          // Update job with file path
          await updateDoc(doc(db, 'jobs', jobRef.id), {
            inputFile: inputFilePath,
            configXml: generateDexProtectorXML(config),
          })

          // Deduct credits
          await updateDoc(doc(db, 'users', userId), {
            credits: increment(-1),
          })

          setUploading(false)
          setProcessing(true)

          toast.success('APK uploaded! Processing will start shortly.')

          // Redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      )
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to start protection process')
      setUploading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-gray-900">Protect APK</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="font-semibold text-gray-900">{credits} Credits</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* File Upload */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Upload Your APK</h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-blue-50'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            {file ? (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
                <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="mt-4 text-primary hover:text-primary/80 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop your APK here' : 'Drag & drop your APK here'}
                </p>
                <p className="text-sm text-gray-600">or click to browse (max 120MB)</p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Choose Protection Level</h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {Object.entries(PRESET_CONFIGS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key as any)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedPreset === key
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-1">{preset.name}</h3>
                <p className="text-sm text-gray-600">{preset.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-primary hover:text-primary/80 font-medium"
          >
            <SettingsIcon className="h-5 w-5" />
            <span>Advanced Configuration</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
              <ConfigSection title="Code Protection">
                <Checkbox
                  label="String Encryption"
                  checked={config.stringEncryption}
                  onChange={(checked) => setConfig({ ...config, stringEncryption: checked })}
                />
                <Checkbox
                  label="Class Encryption"
                  checked={config.classEncryption}
                  onChange={(checked) => setConfig({ ...config, classEncryption: checked })}
                />
                <Checkbox
                  label="Hide Access"
                  checked={config.hideAccess}
                  onChange={(checked) => setConfig({ ...config, hideAccess: checked })}
                />
              </ConfigSection>

              <ConfigSection title="RASP Features">
                <SelectField
                  label="Anti-Debug"
                  value={config.antiDebug}
                  onChange={(value) => setConfig({ ...config, antiDebug: value as any })}
                  options={[
                    { value: 'off', label: 'Off' },
                    { value: 'report', label: 'Report' },
                    { value: 'exit', label: 'Exit' },
                  ]}
                />
                <SelectField
                  label="Anti-Emulator"
                  value={config.antiEmulator}
                  onChange={(value) => setConfig({ ...config, antiEmulator: value as any })}
                  options={[
                    { value: 'off', label: 'Off' },
                    { value: 'report', label: 'Report' },
                    { value: 'exit', label: 'Exit' },
                  ]}
                />
              </ConfigSection>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cost</h3>
              <p className="text-sm text-gray-600">1 credit will be deducted</p>
            </div>
            <div className="text-3xl font-bold text-primary">1 Credit</div>
          </div>

          <button
            onClick={handleProtect}
            disabled={!file || uploading || processing || credits < 1}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading || processing ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>{uploading ? 'Uploading...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Protect APK</span>
              </>
            )}
          </button>

          {credits < 1 && (
            <p className="mt-4 text-center text-sm text-red-600">
              Insufficient credits.{' '}
              <Link href="/pricing" className="font-semibold underline">
                Purchase more credits
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
