'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
    collection,
    query,
    getDocs,
    doc,
    updateDoc,
    increment,
    orderBy,
    where,
    Timestamp
} from 'firebase/firestore'
import {
    Search,
    Plus,
    Minus,
    Mail,
    Calendar,
    CreditCard,
    Activity,
    Download
} from 'lucide-react'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'

interface User {
    uid: string
    email: string | null
    displayName: string | null
    credits: number
    isAdmin?: boolean
    createdAt: Date
    updatedAt: Date
}

interface UserStats {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    totalCreditsSpent: number
    lastActivity?: Date
}

export default function AdminUsers() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [userStats, setUserStats] = useState<Map<string, UserStats>>(new Map())
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingData, setLoadingData] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [creditAmount, setCreditAmount] = useState(0)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
            return
        }

        if (user) {
            loadUsers()
        }
    }, [user, loading, router])

    const loadUsers = async () => {
        setLoadingData(true)
        try {
            // Load all users
            const usersSnapshot = await getDocs(
                query(collection(db, 'users'), orderBy('createdAt', 'desc'))
            )
            const usersData: User[] = usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            } as User))
            setUsers(usersData)

            // Load stats for each user
            const statsMap = new Map<string, UserStats>()
            for (const user of usersData) {
                const jobsSnapshot = await getDocs(
                    query(collection(db, 'jobs'), where('userId', '==', user.uid))
                )
                const jobs = jobsSnapshot.docs.map(doc => doc.data())

                const completedJobs = jobs.filter(j => j.status === 'completed').length
                const failedJobs = jobs.filter(j => j.status === 'failed').length
                const totalCreditsSpent = jobs.reduce((sum, j) => sum + (j.creditsUsed || 0), 0)

                const lastJob = jobs
                    .map(j => j.createdAt?.toDate())
                    .filter(d => d)
                    .sort((a, b) => b.getTime() - a.getTime())[0]

                statsMap.set(user.uid, {
                    totalJobs: jobs.length,
                    completedJobs,
                    failedJobs,
                    totalCreditsSpent,
                    lastActivity: lastJob,
                })
            }
            setUserStats(statsMap)
        } catch (error) {
            console.error('Error loading users:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const handleAddCredits = async (userId: string, amount: number) => {
        if (amount === 0) return

        try {
            await updateDoc(doc(db, 'users', userId), {
                credits: increment(amount),
                updatedAt: Timestamp.now(),
            })

            // Refresh users
            await loadUsers()
            setSelectedUser(null)
            setCreditAmount(0)
            alert(`Successfully ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} credits`)
        } catch (error) {
            console.error('Error updating credits:', error)
            alert('Failed to update credits')
        }
    }

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const exportToCSV = () => {
        const csvContent = [
            ['Email', 'Display Name', 'Credits', 'Total Jobs', 'Completed', 'Failed', 'Credits Spent', 'Last Activity', 'Created At'].join(','),
            ...filteredUsers.map(user => {
                const stats = userStats.get(user.uid)
                return [
                    user.email || '',
                    user.displayName || '',
                    user.credits,
                    stats?.totalJobs || 0,
                    stats?.completedJobs || 0,
                    stats?.failedJobs || 0,
                    stats?.totalCreditsSpent || 0,
                    stats?.lastActivity?.toLocaleString() || 'Never',
                    user.createdAt.toLocaleString(),
                ].join(',')
            })
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="text-primary text-xl animate-pulse font-mono cyber-glow">loading_users...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] text-foreground">
            {/* Header */}
            <AdminHeader
                pageTitle="USER_MANAGEMENT"
                subtitle="manage users and permissions"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-bottom">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="search_users --email --name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card/30 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none font-mono backdrop-blur text-sm"
                        />
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 terminal-border bg-primary/20 hover:bg-primary/30 text-primary rounded-lg flex items-center justify-center space-x-2 transition-all font-mono cyber-glow touch-manipulation"
                    >
                        <Download className="w-4 h-4" />
                        <span>export --csv</span>
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4">
                        <div className="text-2xl font-bold text-foreground font-mono">{users.length}</div>
                        <div className="text-sm text-muted-foreground font-mono">total_users</div>
                    </div>
                    <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary font-mono cyber-glow">
                            {users.reduce((sum, u) => sum + u.credits, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">total_credits</div>
                    </div>
                    <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-400 font-mono">
                            {Array.from(userStats.values()).reduce((sum, s) => sum + s.totalJobs, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">total_jobs</div>
                    </div>
                    <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-400 font-mono">
                            {Array.from(userStats.values()).reduce((sum, s) => sum + s.totalCreditsSpent, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">credits_spent</div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-card/30 border border-border rounded-lg overflow-hidden backdrop-blur">
                    <table className="w-full">
                        <thead className="bg-card/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">user</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">jobs</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">success_rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">last_active</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map((user) => {
                                const stats = userStats.get(user.uid)
                                const successRate = stats && stats.totalJobs > 0
                                    ? (stats.completedJobs / stats.totalJobs) * 100
                                    : 0

                                return (
                                    <tr key={user.uid} className="hover:bg-card/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center cyber-glow">
                                                    <span className="text-white font-bold font-mono">
                                                        {user.email?.[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-foreground flex items-center space-x-2 font-mono">
                                                        <span>{user.email}</span>
                                                        {user.isAdmin && (
                                                            <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium font-mono">
                                                                ADMIN
                                                            </span>
                                                        )}
                                                    </div>
                                                    {user.displayName && (
                                                        <div className="text-xs text-muted-foreground font-mono">{user.displayName}</div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground/70 font-mono">
                                                        joined: {user.createdAt.toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-lg font-bold text-primary font-mono cyber-glow">{user.credits}</div>
                                            <div className="text-xs text-muted-foreground/70 font-mono">
                                                spent: {stats?.totalCreditsSpent || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-foreground font-mono">{stats?.totalJobs || 0} total</div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                <span className="text-green-400">{stats?.completedJobs || 0}</span> /
                                                <span className="text-red-400 ml-1">{stats?.failedJobs || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-foreground font-mono">
                                                {successRate.toFixed(0)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {stats?.lastActivity
                                                ? stats.lastActivity.toLocaleString()
                                                : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setCreditAmount(0)
                                                }}
                                                className="px-3 py-1 terminal-border bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded transition-all font-mono cyber-glow"
                                            >
                                                manage
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credit Management Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="terminal-border bg-card/95 backdrop-blur rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold font-mono gradient-text mb-4">[CREDIT_MANAGER]</h3>
                        <div className="mb-4">
                            <div className="text-sm text-muted-foreground font-mono mb-1">user:</div>
                            <div className="text-foreground font-medium font-mono">{selectedUser.email}</div>
                            <div className="text-sm text-muted-foreground font-mono mt-2">
                                current_balance: <span className="text-primary font-bold cyber-glow">{selectedUser.credits}</span> credits
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-muted-foreground font-mono mb-2">
                                credits_amount
                            </label>
                            <input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2 bg-card/50 border border-border rounded-lg text-foreground focus:border-primary focus:outline-none font-mono backdrop-blur"
                                placeholder="enter_amount (negative to remove)"
                            />
                            <div className="text-xs text-muted-foreground/70 font-mono mt-1">
                                new_balance: <span className="text-primary cyber-glow">{selectedUser.credits + creditAmount}</span>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleAddCredits(selectedUser.uid, creditAmount)}
                                disabled={creditAmount === 0}
                                className="flex-1 px-4 py-2 terminal-border bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono cyber-glow"
                            >
                                update_credits
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedUser(null)
                                    setCreditAmount(0)
                                }}
                                className="flex-1 px-4 py-2 terminal-border bg-card/50 hover:bg-card text-muted-foreground rounded-lg transition-all font-mono"
                            >
                                cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
