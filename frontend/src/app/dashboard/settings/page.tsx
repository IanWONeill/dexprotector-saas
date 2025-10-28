'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, User, Mail, Calendar, Trash2, LogOut, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import DashboardHeader from '@/components/DashboardHeader'
import { logger } from '@/lib/logger'

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [displayName, setDisplayName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                router.push('/auth/login')
                return
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                if (userDoc.exists()) {
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        credits: userDoc.data().credits || 0,
                        createdAt: userDoc.data().createdAt?.toDate(),
                    }
                    setUser(userData)
                    setDisplayName(firebaseUser.displayName || '')
                }
            } catch (error) {
                logger.error('Error loading user:', error)
                toast.error('Failed to load user data')
            } finally {
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [router])

    const handleUpdateProfile = async () => {
        if (!auth.currentUser) return

        setSaving(true)
        try {
            await updateProfile(auth.currentUser, {
                displayName: displayName || null,
            })

            toast.success('Profile updated successfully')
            setUser({ ...user, displayName })
        } catch (error: any) {
            logger.error('Error updating profile:', error)
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

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
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary cyber-glow"></div>
                    <div className="font-mono text-primary text-sm">loading_settings...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] relative overflow-hidden">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]"></div>

            {/* Header */}
            <div className="relative z-10">
                <DashboardHeader 
                    credits={user?.credits}
                    onSignOut={handleSignOut}
                    showAuthButtons={false}
                />
                
                {/* Back Button */}
                <div className="container mx-auto px-4 py-4 border-b border-border/50">
                    <Link 
                        href="/dashboard" 
                        className="inline-flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm touch-manipulation"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>back to dashboard</span>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl relative z-10 safe-bottom">
                {/* Page Title */}
                <div className="mb-8">
                    <div className="font-mono text-primary text-sm mb-2">
                        <span className="text-primary/60">$</span> nano ~/.4tify/config
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2 font-mono">
                        [ACCOUNT_SETTINGS]
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        <span className="text-primary">{'>'}</span> configure your account preferences
                    </p>
                </div>

                {/* Profile Section */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-primary mb-6 font-mono">[PROFILE]</h2>

                    <div className="space-y-6">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 font-mono">
                                <User className="h-4 w-4 inline mr-2" />
                                display_name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your display name"
                                className="w-full px-4 py-3 bg-background border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent text-foreground font-mono"
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 font-mono">
                                <Mail className="h-4 w-4 inline mr-2" />
                                email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded text-muted-foreground font-mono cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-muted-foreground font-mono">
                                <span className="text-primary/60">//</span> email cannot be changed
                            </p>
                        </div>

                        {/* Account Created */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 font-mono">
                                <Calendar className="h-4 w-4 inline mr-2" />
                                account_created
                            </label>
                            <input
                                type="text"
                                value={user?.createdAt ? formatDistanceToNow(user.createdAt, { addSuffix: true }) : 'Unknown'}
                                disabled
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded text-muted-foreground font-mono cursor-not-allowed"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="w-full bg-primary text-background py-3 rounded font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cyber-glow font-mono"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background"></div>
                                    <span>saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    <span>./save --profile</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Usage Stats */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-primary mb-6 font-mono">[USAGE_STATS]</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="terminal-border bg-background/50 p-4 rounded">
                            <div className="text-muted-foreground text-sm mb-1 font-mono">credits_remaining</div>
                            <div className="text-3xl font-bold gradient-text font-mono">{user?.credits || 0}</div>
                        </div>

                        <div className="terminal-border bg-background/50 p-4 rounded">
                            <div className="text-muted-foreground text-sm mb-1 font-mono">account_status</div>
                            <div className="text-lg font-semibold text-primary font-mono">[ACTIVE]</div>
                        </div>
                    </div>

                    <Link
                        href="/pricing"
                        className="mt-6 block text-center bg-card/50 border border-primary/30 text-primary py-3 rounded font-semibold hover:bg-card transition-all font-mono"
                    >
                        <span className="text-primary/60">$</span> purchase --credits
                    </Link>
                </div>

                {/* Danger Zone */}
                <div className="terminal-border bg-red-950/20 backdrop-blur rounded-lg p-6 border-red-900/50">
                    <h2 className="text-xl font-semibold text-red-400 mb-6 font-mono">[DANGER_ZONE]</h2>

                    <div className="space-y-4">
                        {/* Sign Out */}
                        <button
                            onClick={handleSignOut}
                            className="w-full bg-card/50 border border-border text-muted-foreground py-3 rounded font-semibold hover:bg-card hover:text-foreground transition-all flex items-center justify-center space-x-2 font-mono"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>./logout --force</span>
                        </button>

                        {/* Delete Account (placeholder) */}
                        <button
                            onClick={() => toast.error('Account deletion coming soon. Contact support for now.')}
                            className="w-full bg-red-950/30 border border-red-900/50 text-red-400 py-3 rounded font-semibold hover:bg-red-950/50 transition-all flex items-center justify-center space-x-2 font-mono"
                        >
                            <Trash2 className="h-5 w-5" />
                            <span>./delete --account</span>
                        </button>
                        <p className="text-xs text-muted-foreground text-center font-mono">
                            <span className="text-red-500/60">//</span> warning: this action cannot be undone
                        </p>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-center">
                    <p className="text-muted-foreground text-sm font-mono">
                        <span className="text-primary">{'>'}</span> need help? contact{' '}
                        <a href="mailto:support@4tify.app" className="text-primary hover:text-primary/80 underline">
                            support@4tify.app
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
