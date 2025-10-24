'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User, Job } from '@/types'
import { Shield, Upload, Settings, CreditCard, LogOut, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/auth/login')
        return
      }

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (userDoc.exists()) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          credits: userDoc.data().credits || 0,
          createdAt: userDoc.data().createdAt?.toDate(),
          updatedAt: userDoc.data().updatedAt?.toDate(),
        })
      }

      // Subscribe to jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc')
      )

      const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
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
      })

      return () => unsubscribeJobs()
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  if (loading) {
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
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900">DexProtector</span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-semibold text-gray-900">{user?.credits || 0} Credits</span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
          </h1>
          <p className="text-gray-600">Protect your Android applications with DexProtector</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/protect"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <Upload className="h-10 w-10 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Protect APK</h3>
            <p className="text-blue-100">Upload and protect your Android app</p>
          </Link>

          <Link
            href="/pricing"
            className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow hover:shadow-lg transition-shadow"
          >
            <CreditCard className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Buy Credits</h3>
            <p className="text-gray-600">Purchase more processing credits</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow hover:shadow-lg transition-shadow"
          >
            <Settings className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">Manage your account settings</p>
          </Link>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-600 mb-4">Upload your first APK to get started</p>
              <Link
                href="/dashboard/protect"
                className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Protect APK</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <JobStatusIcon status={job.status} />
                      <div>
                        <div className="font-medium text-gray-900">
                          {job.inputFile.split('/').pop()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <StatusBadge status={job.status} />
                      {job.status === 'completed' && job.outputFile && (
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Download
                        </Link>
                      )}
                    </div>
                  </div>

                  {job.error && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                      {job.error}
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
      return <Clock className="h-8 w-8 text-yellow-500" />
    case 'processing':
      return <Loader className="h-8 w-8 text-blue-500 animate-spin" />
    case 'completed':
      return <CheckCircle className="h-8 w-8 text-green-500" />
    case 'failed':
      return <XCircle className="h-8 w-8 text-red-500" />
  }
}

function StatusBadge({ status }: { status: Job['status'] }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
