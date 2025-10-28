'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'
import { User, Job } from '@/types'
import { Upload, Settings, CreditCard, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import DashboardHeader from '@/components/DashboardHeader'
import { logger, setAdminStatus } from '@/lib/logger'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for payment success
        const urlParams = new URLSearchParams(window.location.search)
        const paymentStatus = urlParams.get('payment')

        if (paymentStatus === 'success') {
            toast.success('🎉 Payment successful! Credits added to your account.')
            // Clean up URL
            window.history.replaceState({}, '', '/dashboard')
        } else if (paymentStatus === 'cancelled') {
            toast.error('Payment was cancelled')
            window.history.replaceState({}, '', '/dashboard')
        }
    }, [])

    useEffect(() => {
        logger.log('Dashboard: Setting up auth listener')
        let unsubscribeJobs: (() => void) | null = null

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            logger.log('Dashboard: Auth state changed:', firebaseUser?.uid || 'no user')

            if (!firebaseUser) {
                logger.log('Dashboard: No user, redirecting to login')
                router.push('/auth/login')
                return
            }

            try {
                logger.log('Dashboard: Loading user data')
                // Load user data
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                if (userDoc.exists()) {
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        credits: userDoc.data().credits || 0,
                        isAdmin: userDoc.data().isAdmin || false,
                        createdAt: userDoc.data().createdAt?.toDate(),
                        updatedAt: userDoc.data().updatedAt?.toDate(),
                    }
                    logger.log('Dashboard: User data loaded, credits:', userData.credits, 'isAdmin:', userData.isAdmin)
                    setUser(userData)
                    // Set admin status for logger
                    setAdminStatus(userData.isAdmin || false)
                } else {
                    logger.error('Dashboard: User document not found')
                }

                // Clean up previous jobs listener if exists
                if (unsubscribeJobs) {
                    logger.log('Dashboard: Cleaning up old jobs listener')
                    unsubscribeJobs()
                }

                logger.log('Dashboard: Setting up jobs listener')
                // Subscribe to jobs
                const jobsQuery = query(
                    collection(db, 'jobs'),
                    where('userId', '==', firebaseUser.uid),
                    orderBy('createdAt', 'desc')
                )

                unsubscribeJobs = onSnapshot(
                    jobsQuery,
                    (snapshot) => {
                        logger.log('Dashboard: Jobs snapshot received:', snapshot.docs.length, 'jobs')
                        const jobsData = snapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate(),
                            startedAt: doc.data().startedAt?.toDate(),
                            completedAt: doc.data().completedAt?.toDate(),
                            failedAt: doc.data().failedAt?.toDate(),
                        })) as Job[]
                        setJobs(jobsData)
                        setLoading(false)
                    },
                    (error) => {
                        logger.error('Dashboard: Error loading jobs:', error)
                        toast.error('Failed to load jobs')
                        setLoading(false)
                    }
                )
            } catch (error) {
                logger.error('Dashboard: Error in setup:', error)
                setLoading(false)
            }
        })

        return () => {
            logger.log('Dashboard: Cleaning up listeners')
            unsubscribeAuth()
            if (unsubscribeJobs) {
                unsubscribeJobs()
            }
        }
    }, [])

    const handleSignOut = async () => {
        try {
            await signOut(auth)
            toast.success('Signed out successfully')
            router.push('/')
        } catch (error) {
            toast.error('Failed to sign out')
        }
    }

    const handleDownload = async (job: Job) => {
        if (!job.outputFile) return

        try {
            // Get download URL from Firebase Storage
            const storageRef = ref(storage, job.outputFile)
            const downloadURL = await getDownloadURL(storageRef)

            // Create a temporary link and trigger download
            const link = document.createElement('a')
            link.href = downloadURL
            link.download = 'protected.apk'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Download started!')
        } catch (error) {
            logger.error('Download error:', error)
            toast.error('Failed to download file')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="text-primary cyber-glow font-mono text-xl animate-pulse">loading_dashboard...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419]">
            {/* Header */}
            <DashboardHeader 
                credits={user?.credits}
                isAdmin={user?.isAdmin}
                onSignOut={handleSignOut}
            />

            <div className="container mx-auto px-4 py-6 sm:py-8 safe-bottom">
                {/* Welcome Section */}
                <div className="mb-6 sm:mb-8">
                    <div className="font-mono text-primary text-xs sm:text-sm mb-2">
                        <span className="text-primary/60">$</span> whoami
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2 font-mono break-words">
                        {user?.displayName || user?.email?.split('@')[0] || 'user'}@4tify
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                        <span className="text-primary">{'>'}</span> session active // ready to fortify
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <Link
                        href="/dashboard/protect"
                        className="terminal-border bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded hover:from-primary/30 hover:to-primary/10 transition-all group cyber-glow touch-manipulation min-h-[120px] flex flex-col"
                    >
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-primary font-mono">[PROTECT]</h3>
                        <p className="text-muted-foreground font-mono text-xs sm:text-sm">./upload && ./fortify --apk</p>
                    </Link>

                    <Link
                        href="/pricing"
                        className="terminal-border bg-card/30 p-6 rounded hover:bg-card/50 transition-all group touch-manipulation min-h-[120px] flex flex-col"
                    >
                        <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-secondary mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-secondary font-mono">[CREDITS]</h3>
                        <p className="text-muted-foreground font-mono text-xs sm:text-sm">curl -X POST /buy/credits</p>
                    </Link>

                    <Link
                        href="/dashboard/settings"
                        className="terminal-border bg-card/30 p-6 rounded hover:bg-card/50 transition-all group touch-manipulation min-h-[120px] flex flex-col sm:col-span-2 md:col-span-1"
                    >
                        <Settings className="h-8 w-8 sm:h-10 sm:w-10 text-foreground mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground font-mono">[SETTINGS]</h3>
                        <p className="text-muted-foreground font-mono text-xs sm:text-sm">nano ~/.4tify/config</p>
                    </Link>
                </div>

                {/* Recent Jobs */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-border bg-card/50">
                        <h2 className="text-lg sm:text-xl font-semibold text-primary font-mono">[EXECUTION_LOG]</h2>
                    </div>

                    {jobs.length === 0 ? (
                        <div className="px-4 sm:px-6 py-12 text-center">
                            <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 font-mono">$ ls -la jobs/</h3>
                            <p className="text-muted-foreground mb-4 font-mono text-xs sm:text-sm">no jobs found // initialize first execution</p>
                            <Link
                                href="/dashboard/protect"
                                className="inline-flex items-center space-x-2 bg-primary text-background px-4 sm:px-6 py-3 rounded hover:bg-primary/90 transition-all cyber-glow font-mono text-sm sm:text-base touch-manipulation min-h-[44px]"
                            >
                                <Upload className="h-5 w-5" />
                                <span>./protect --new</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {jobs.map((job) => (
                                <div key={job.id} className="px-4 sm:px-6 py-4 hover:bg-card/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center space-x-4">
                                            <JobStatusIcon status={job.status} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground font-mono text-xs sm:text-sm truncate">
                                                    {job.inputFile.split('/').pop()}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 sm:space-x-4 self-end sm:self-auto">
                                            <StatusBadge status={job.status} />
                                            {job.status === 'completed' && job.outputFile && (
                                                <button
                                                    onClick={() => handleDownload(job)}
                                                    className="text-primary hover:text-primary/80 font-medium font-mono text-xs sm:text-sm transition-colors touch-manipulation whitespace-nowrap"
                                                >
                                                    download()
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {job.error && (
                                        <div className="mt-2 text-xs sm:text-sm text-red-400 bg-red-950/30 px-3 py-2 rounded border border-red-900/50 font-mono break-words">
                                            <span className="text-red-500">ERROR:</span> {job.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function JobStatusIcon({ status }: { status: Job['status'] }) {
    switch (status) {
        case 'pending':
            return <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
        case 'processing':
            return <Loader className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 animate-spin flex-shrink-0" />
        case 'completed':
            return <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
        case 'failed':
            return <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
    }
}

function StatusBadge({ status }: { status: Job['status'] }) {
    const styles = {
        pending: 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
        processing: 'bg-blue-950/50 text-blue-400 border-blue-900/50',
        completed: 'bg-green-950/50 text-green-400 border-green-900/50',
        failed: 'bg-red-950/50 text-red-400 border-red-900/50',
    }

    return (
        <span className={`px-3 py-1 rounded text-xs font-medium font-mono border ${styles[status]}`}>
            [{status.toUpperCase()}]
        </span>
    )
}
