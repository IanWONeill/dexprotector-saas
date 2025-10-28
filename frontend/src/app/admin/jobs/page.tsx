'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import {
    collection,
    query,
    getDocs,
    doc,
    getDoc,
    orderBy,
    where,
    deleteDoc
} from 'firebase/firestore'
import { ref, listAll, getMetadata, deleteObject } from 'firebase/storage'
import {
    Search,
    FileText,
    Download,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'

interface Job {
    id: string
    userId: string
    userEmail?: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    inputFile: string
    outputFile?: string
    configTier?: string
    creditsUsed?: number
    error?: string
    createdAt: Date
    startedAt?: Date
    completedAt?: Date
    failedAt?: Date
    processingTime?: number
}

interface FileInfo {
    path: string
    size: number
    created: Date
    deleteAt: Date
}

export default function AdminJobs() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [loadingData, setLoadingData] = useState(true)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [fileInfo, setFileInfo] = useState<FileInfo[]>([])

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
            return
        }

        if (user) {
            loadJobs()
        }
    }, [user, loading, router])

    const loadJobs = async () => {
        setLoadingData(true)
        try {
            const jobsSnapshot = await getDocs(
                query(collection(db, 'jobs'), orderBy('createdAt', 'desc'))
            )

            const jobsData: Job[] = await Promise.all(
                jobsSnapshot.docs.map(async (jobDoc) => {
                    const data = jobDoc.data()

                    // Fetch user email
                    let userEmail = 'Unknown'
                    try {
                        const userDoc = await getDoc(doc(db, 'users', data.userId))
                        if (userDoc.exists()) {
                            userEmail = userDoc.data().email || 'Unknown'
                        }
                    } catch (error) {
                        console.error('Error fetching user:', error)
                    }

                    return {
                        id: jobDoc.id,
                        ...data,
                        userEmail,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        startedAt: data.startedAt?.toDate(),
                        completedAt: data.completedAt?.toDate(),
                        failedAt: data.failedAt?.toDate(),
                    } as Job
                })
            )

            setJobs(jobsData)
        } catch (error) {
            console.error('Error loading jobs:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const loadFileInfo = async (job: Job) => {
        setFileInfo([])
        try {
            const userId = job.userId
            const jobId = job.id

            const files: FileInfo[] = []

            // Check input file
            if (job.inputFile) {
                try {
                    const inputRef = ref(storage, job.inputFile)
                    const inputMeta = await getMetadata(inputRef)
                    const created = new Date(inputMeta.timeCreated)
                    const deleteAt = new Date(created.getTime() + 24 * 60 * 60 * 1000) // 24 hours

                    files.push({
                        path: job.inputFile,
                        size: inputMeta.size,
                        created,
                        deleteAt,
                    })
                } catch (error) {
                    console.error('Error loading input file metadata:', error)
                }
            }

            // Check output file
            if (job.outputFile) {
                try {
                    const outputRef = ref(storage, job.outputFile)
                    const outputMeta = await getMetadata(outputRef)
                    const created = new Date(outputMeta.timeCreated)
                    const deleteAt = new Date(created.getTime() + 24 * 60 * 60 * 1000) // 24 hours

                    files.push({
                        path: job.outputFile,
                        size: outputMeta.size,
                        created,
                        deleteAt,
                    })
                } catch (error) {
                    console.error('Error loading output file metadata:', error)
                }
            }

            setFileInfo(files)
        } catch (error) {
            console.error('Error loading file info:', error)
        }
    }

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job and its files?')) return

        try {
            const job = jobs.find(j => j.id === jobId)
            if (!job) return

            // Delete files from storage
            if (job.inputFile) {
                try {
                    await deleteObject(ref(storage, job.inputFile))
                } catch (error) {
                    console.error('Error deleting input file:', error)
                }
            }
            if (job.outputFile) {
                try {
                    await deleteObject(ref(storage, job.outputFile))
                } catch (error) {
                    console.error('Error deleting output file:', error)
                }
            }

            // Delete job document
            await deleteDoc(doc(db, 'jobs', jobId))

            // Reload jobs
            await loadJobs()
            alert('Job deleted successfully')
        } catch (error) {
            console.error('Error deleting job:', error)
            alert('Failed to delete job')
        }
    }

    const handleClearAllJobs = async () => {
        const confirmed = confirm(
            `⚠️ WARNING: This will delete ALL ${jobs.length} jobs and their associated files!\n\nThis action cannot be undone. Are you absolutely sure?`
        )
        if (!confirmed) return

        const doubleConfirm = confirm(
            `🔴 FINAL CONFIRMATION\n\nYou are about to DELETE ${jobs.length} jobs.\n\nType "yes" in the next prompt to proceed.`
        )
        if (!doubleConfirm) return

        const finalConfirm = prompt('Type "DELETE ALL" to confirm (case-sensitive):')
        if (finalConfirm !== 'DELETE ALL') {
            alert('Cancelled. Text did not match.')
            return
        }

        try {
            setLoadingData(true)
            let successCount = 0
            let errorCount = 0

            // Delete all jobs sequentially
            for (const job of jobs) {
                try {
                    // Delete files from storage
                    if (job.inputFile) {
                        try {
                            await deleteObject(ref(storage, job.inputFile))
                        } catch (error) {
                            console.error(`Error deleting input file for job ${job.id}:`, error)
                        }
                    }
                    if (job.outputFile) {
                        try {
                            await deleteObject(ref(storage, job.outputFile))
                        } catch (error) {
                            console.error(`Error deleting output file for job ${job.id}:`, error)
                        }
                    }

                    // Delete job document
                    await deleteDoc(doc(db, 'jobs', job.id))
                    successCount++
                } catch (error) {
                    console.error(`Error deleting job ${job.id}:`, error)
                    errorCount++
                }
            }

            // Reload jobs
            await loadJobs()
            alert(`✅ Cleared ${successCount} jobs successfully.\n${errorCount > 0 ? `⚠️ ${errorCount} jobs failed to delete.` : ''}`)
        } catch (error) {
            console.error('Error clearing all jobs:', error)
            alert('Failed to clear all jobs')
        } finally {
            setLoadingData(false)
        }
    }

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || job.status === statusFilter

        return matchesSearch && matchesStatus
    })

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

        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="text-primary cyber-glow font-mono text-xl animate-pulse">loading_jobs...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] text-foreground">
            {/* Header */}
            <AdminHeader
                pageTitle="JOBS_MANAGEMENT"
                subtitle="monitor and manage protection jobs"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-bottom">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="search_jobs --id --email"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card text-foreground border border-border rounded-lg placeholder-muted-foreground focus:border-primary focus:outline-none font-mono text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:border-primary focus:outline-none font-mono text-sm touch-manipulation"
                        >
                            <option value="all">all_status</option>
                            <option value="pending">pending</option>
                            <option value="processing">processing</option>
                            <option value="completed">completed</option>
                            <option value="failed">failed</option>
                        </select>
                        <button
                            onClick={handleClearAllJobs}
                            disabled={jobs.length === 0 || loadingData}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg font-mono text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation whitespace-nowrap"
                        >
                            🗑️ clear_all
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="text-2xl font-bold text-foreground font-mono">{jobs.length}</div>
                        <div className="text-sm text-muted-foreground font-mono">total_jobs</div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="text-2xl font-bold text-green-400 font-mono">
                            {jobs.filter(j => j.status === 'completed').length}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">completed</div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="text-2xl font-bold text-blue-400 font-mono">
                            {jobs.filter(j => j.status === 'processing').length}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">processing</div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="text-2xl font-bold text-red-400 font-mono">
                            {jobs.filter(j => j.status === 'failed').length}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">failed</div>
                    </div>
                </div>

                {/* Jobs Table */}
                <div className="bg-card/50 terminal-border rounded-lg overflow-hidden backdrop-blur">
                    <table className="w-full">
                        <thead className="bg-card">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">job_id</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">user</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">tier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredJobs.map((job) => (
                                <tr key={job.id} className="hover:bg-card/30">
                                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                                        {job.id.substring(0, 12)}...
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground font-mono">
                                        {job.userEmail}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {job.configTier && (
                                            <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium uppercase font-mono">
                                                {job.configTier}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-primary font-medium font-mono">
                                        {job.creditsUsed || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                        {job.createdAt.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                        {job.processingTime ? `${job.processingTime}s` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedJob(job)
                                                    loadFileInfo(job)
                                                }}
                                                className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded transition-all text-xs font-mono cyber-glow"
                                            >
                                                view
                                            </button>
                                            <button
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-all text-xs font-mono"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Job Details Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card terminal-border rounded-lg max-w-4xl w-full p-6 my-8 backdrop-blur">
                        <h3 className="text-2xl font-bold gradient-text mb-6 font-mono">[JOB_DETAILS]</h3>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 font-mono">job_id:</div>
                                <div className="text-foreground font-mono text-sm">{selectedJob.id}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 font-mono">user:</div>
                                <div className="text-foreground font-mono">{selectedJob.userEmail}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 font-mono">status:</div>
                                <StatusBadge status={selectedJob.status} />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 font-mono">config_tier:</div>
                                <div className="text-foreground font-mono">{selectedJob.configTier || 'not_specified'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 font-mono">credits_used:</div>
                                <div className="text-primary font-bold font-mono">{selectedJob.creditsUsed || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 font-mono">processing_time:</div>
                                <div className="text-foreground font-mono">{selectedJob.processingTime ? `${selectedJob.processingTime}s` : 'N/A'}</div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="mb-6">
                            <div className="text-sm text-muted-foreground mb-2 font-mono">[TIMELINE]</div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm font-mono">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">created:</span>
                                    <span className="text-foreground">{selectedJob.createdAt.toLocaleString()}</span>
                                </div>
                                {selectedJob.startedAt && (
                                    <div className="flex items-center space-x-2 text-sm font-mono">
                                        <AlertCircle className="w-4 h-4 text-blue-400" />
                                        <span className="text-muted-foreground">started:</span>
                                        <span className="text-foreground">{selectedJob.startedAt.toLocaleString()}</span>
                                    </div>
                                )}
                                {selectedJob.completedAt && (
                                    <div className="flex items-center space-x-2 text-sm font-mono">
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        <span className="text-muted-foreground">completed:</span>
                                        <span className="text-foreground">{selectedJob.completedAt.toLocaleString()}</span>
                                    </div>
                                )}
                                {selectedJob.failedAt && (
                                    <div className="flex items-center space-x-2 text-sm font-mono">
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        <span className="text-muted-foreground">failed:</span>
                                        <span className="text-foreground">{selectedJob.failedAt.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Message */}
                        {selectedJob.error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <div className="text-sm text-red-400 font-medium mb-1 font-mono">[ERROR]</div>
                                <div className="text-sm text-red-300 font-mono">{selectedJob.error}</div>
                            </div>
                        )}

                        {/* Files */}
                        <div className="mb-6">
                            <div className="text-sm text-muted-foreground mb-2 font-mono">[FILES]</div>
                            {fileInfo.length > 0 ? (
                                <div className="space-y-2">
                                    {fileInfo.map((file, idx) => (
                                        <div key={idx} className="p-3 bg-card/50 rounded-lg border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    <span className="text-sm text-foreground font-mono">
                                                        {file.path.split('/').pop()}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-muted-foreground font-mono">{formatBytes(file.size)}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                                <div>
                                                    <span className="text-muted-foreground">created:</span>
                                                    <span className="text-foreground ml-2">{file.created.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">delete_in:</span>
                                                    <span className="text-yellow-400 ml-2">{getTimeRemaining(file.deleteAt)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-muted-foreground/70 font-mono">
                                                path: {file.path}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground font-mono">loading_file_information...</div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedJob(null)}
                            className="w-full px-4 py-2 terminal-border bg-card/50 hover:bg-card text-foreground rounded-lg transition-all font-mono"
                        >
                            close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig = {
        pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50', icon: Clock },
        processing: { color: 'bg-blue-500/20 text-blue-400 border-blue-400/50', icon: AlertCircle },
        completed: { color: 'bg-green-500/20 text-green-400 border-green-400/50', icon: CheckCircle },
        failed: { color: 'bg-red-500/20 text-red-400 border-red-400/50', icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border font-mono ${config.color}`}>
            <Icon className="w-3 h-3" />
            <span>{status.toUpperCase()}</span>
        </span>
    )
}
