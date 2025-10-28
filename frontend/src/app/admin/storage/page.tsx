'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { storage } from '@/lib/firebase'
import { ref, listAll, getMetadata, deleteObject, StorageReference } from 'firebase/storage'
import { Folder, FileText, Trash2, Download, HardDrive } from 'lucide-react'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'

interface StorageFile {
    path: string
    name: string
    size: number
    created: Date
    deleteAt: Date
    userId: string
    type: 'input' | 'output'
}

export default function AdminStorage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [files, setFiles] = useState<StorageFile[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [totalSize, setTotalSize] = useState(0)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
            return
        }

        if (user) {
            loadAllFiles()
        }
    }, [user, loading, router])

    const loadAllFiles = async () => {
        setLoadingData(true)
        try {
            const usersRef = ref(storage, 'users/')
            const allFiles: StorageFile[] = []
            let total = 0

            // List all user directories
            const usersList = await listAll(usersRef)

            for (const userFolder of usersList.prefixes) {
                const userId = userFolder.name

                // List inputs
                try {
                    const inputsRef = ref(storage, `users/${userId}/inputs/`)
                    const inputsList = await listAll(inputsRef)

                    for (const item of inputsList.items) {
                        const metadata = await getMetadata(item)
                        const created = new Date(metadata.timeCreated)
                        const deleteAt = new Date(created.getTime() + 24 * 60 * 60 * 1000)

                        allFiles.push({
                            path: item.fullPath,
                            name: item.name,
                            size: metadata.size,
                            created,
                            deleteAt,
                            userId,
                            type: 'input',
                        })
                        total += metadata.size
                    }
                } catch (error) {
                    // Folder might not exist
                }

                // List outputs
                try {
                    const outputsRef = ref(storage, `users/${userId}/outputs/`)
                    const outputsFolders = await listAll(outputsRef)

                    for (const jobFolder of outputsFolders.prefixes) {
                        const jobFiles = await listAll(jobFolder)

                        for (const item of jobFiles.items) {
                            const metadata = await getMetadata(item)
                            const created = new Date(metadata.timeCreated)
                            const deleteAt = new Date(created.getTime() + 24 * 60 * 60 * 1000)

                            allFiles.push({
                                path: item.fullPath,
                                name: item.name,
                                size: metadata.size,
                                created,
                                deleteAt,
                                userId,
                                type: 'output',
                            })
                            total += metadata.size
                        }
                    }
                } catch (error) {
                    // Folder might not exist
                }
            }

            setFiles(allFiles.sort((a, b) => b.created.getTime() - a.created.getTime()))
            setTotalSize(total)
        } catch (error) {
            console.error('Error loading files:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const handleDeleteFile = async (filePath: string) => {
        if (!confirm(`Are you sure you want to delete ${filePath}?`)) return

        try {
            await deleteObject(ref(storage, filePath))
            await loadAllFiles()
            alert('File deleted successfully')
        } catch (error) {
            console.error('Error deleting file:', error)
            alert('Failed to delete file')
        }
    }

    const handleDeleteExpired = async () => {
        if (!confirm('Delete all expired files? This cannot be undone.')) return

        const now = new Date()
        const expiredFiles = files.filter(f => f.deleteAt < now)

        try {
            for (const file of expiredFiles) {
                await deleteObject(ref(storage, file.path))
            }
            await loadAllFiles()
            alert(`Deleted ${expiredFiles.length} expired files`)
        } catch (error) {
            console.error('Error deleting expired files:', error)
            alert('Failed to delete some files')
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getTimeRemaining = (deleteAt: Date) => {
        const now = new Date()
        const diff = deleteAt.getTime() - now.getTime()
        if (diff < 0) return 'Expired'

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 24) {
            const days = Math.floor(hours / 24)
            return `${days}d ${hours % 24}h`
        }
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    const expiredCount = files.filter(f => f.deleteAt < new Date()).length
    const inputFiles = files.filter(f => f.type === 'input')
    const outputFiles = files.filter(f => f.type === 'output')

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="text-primary cyber-glow font-mono text-xl animate-pulse">loading_storage...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] text-foreground">
            {/* Header */}
            <AdminHeader 
                pageTitle="STORAGE_MANAGEMENT"
                subtitle="monitor and cleanup storage"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-bottom">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <HardDrive className="w-5 h-5 text-primary" />
                            <div className="text-sm text-muted-foreground font-mono">total_storage</div>
                        </div>
                        <div className="text-2xl font-bold text-foreground font-mono">{formatBytes(totalSize)}</div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div className="text-sm text-muted-foreground font-mono">total_files</div>
                        </div>
                        <div className="text-2xl font-bold text-foreground font-mono">{files.length}</div>
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            {inputFiles.length} inputs / {outputFiles.length} outputs
                        </div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <Folder className="w-5 h-5 text-green-400" />
                            <div className="text-sm text-muted-foreground font-mono">avg_file_size</div>
                        </div>
                        <div className="text-2xl font-bold text-foreground font-mono">
                            {files.length > 0 ? formatBytes(totalSize / files.length) : '0 Bytes'}
                        </div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <Trash2 className="w-5 h-5 text-red-400" />
                            <div className="text-sm text-muted-foreground font-mono">expired_files</div>
                        </div>
                        <div className="text-2xl font-bold text-red-400 font-mono">{expiredCount}</div>
                        {expiredCount > 0 && (
                            <button
                                onClick={handleDeleteExpired}
                                className="mt-2 text-xs text-red-400 hover:text-red-300 font-mono cyber-glow"
                            >
                                cleanup →
                            </button>
                        )}
                    </div>
                </div>

                {/* Files Table */}
                <div className="bg-card/50 terminal-border rounded-lg overflow-hidden backdrop-blur">
                    <table className="w-full">
                        <thead className="bg-card">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">file</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">size</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">delete_in</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">user_id</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {files.map((file, idx) => {
                                const isExpired = file.deleteAt < new Date()

                                return (
                                    <tr key={idx} className={`hover:bg-card/30 ${isExpired ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                <div>
                                                    <div className="text-foreground font-medium font-mono">{file.name}</div>
                                                    <div className="text-xs text-muted-foreground/70 font-mono">{file.path}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border font-mono ${file.type === 'input'
                                                ? 'bg-blue-500/20 text-blue-400 border-blue-400/50'
                                                : 'bg-green-500/20 text-green-400 border-green-400/50'
                                                }`}>
                                                {file.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground font-mono">
                                            {formatBytes(file.size)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {file.created.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono">
                                            <span className={isExpired ? 'text-red-400' : 'text-yellow-400'}>
                                                {getTimeRemaining(file.deleteAt)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {file.userId.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => handleDeleteFile(file.path)}
                                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-all text-xs flex items-center space-x-1 font-mono"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
