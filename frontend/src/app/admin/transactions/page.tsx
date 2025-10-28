'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
    collection,
    query,
    getDocs,
    orderBy,
    doc,
    getDoc
} from 'firebase/firestore'
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Download,
    Search
} from 'lucide-react'
import Link from 'next/link'
import AdminHeader from '@/components/AdminHeader'

interface Transaction {
    id: string
    userId: string
    userEmail?: string
    type: 'purchase' | 'deduction' | 'refund'
    amount: number
    credits: number
    description: string
    stripePaymentId?: string
    createdAt: Date
}

export default function AdminTransactions() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login')
            return
        }

        if (user) {
            loadTransactions()
        }
    }, [user, loading, router])

    const loadTransactions = async () => {
        setLoadingData(true)
        try {
            const transactionsSnapshot = await getDocs(
                query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))
            )

            const transactionsData: Transaction[] = await Promise.all(
                transactionsSnapshot.docs.map(async (txDoc) => {
                    const data = txDoc.data()

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
                        id: txDoc.id,
                        ...data,
                        userEmail,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    } as Transaction
                })
            )

            setTransactions(transactionsData)
        } catch (error) {
            console.error('Error loading transactions:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.stripePaymentId?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesType = typeFilter === 'all' || tx.type === typeFilter

        return matchesSearch && matchesType
    })

    const totalRevenue = transactions
        .filter(tx => tx.type === 'purchase')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0)

    const totalRefunds = transactions
        .filter(tx => tx.type === 'refund')
        .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)

    const totalCreditsDistributed = transactions
        .filter(tx => tx.type === 'purchase')
        .reduce((sum, tx) => sum + tx.credits, 0)

    const totalCreditsUsed = transactions
        .filter(tx => tx.type === 'deduction')
        .reduce((sum, tx) => sum + Math.abs(tx.credits), 0)

    const exportToCSV = () => {
        const csvContent = [
            ['Date', 'User', 'Type', 'Amount', 'Credits', 'Description', 'Stripe ID'].join(','),
            ...filteredTransactions.map(tx => [
                tx.createdAt.toLocaleString(),
                tx.userEmail || '',
                tx.type,
                (tx.amount / 100).toFixed(2),
                tx.credits,
                `"${tx.description}"`,
                tx.stripePaymentId || '',
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="text-primary cyber-glow font-mono text-xl animate-pulse">loading_transactions...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] text-foreground">
            {/* Header */}
            <AdminHeader 
                pageTitle="TRANSACTIONS"
                subtitle="financial tracking and analytics"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-bottom">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="search --id --email --stripe_id"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card text-foreground border border-border rounded-lg placeholder-muted-foreground focus:border-primary focus:outline-none font-mono text-sm"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:border-primary focus:outline-none font-mono text-sm touch-manipulation"
                    >
                        <option value="all">all_types</option>
                        <option value="purchase">purchase</option>
                        <option value="deduction">deduction</option>
                        <option value="refund">refund</option>
                    </select>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg flex items-center space-x-2 transition-all font-mono cyber-glow"
                    >
                        <Download className="w-4 h-4" />
                        <span>export_csv</span>
                    </button>
                </div>

                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            <div className="text-sm text-muted-foreground font-mono">total_revenue</div>
                        </div>
                        <div className="text-2xl font-bold text-green-400 font-mono">
                            ${(totalRevenue / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            {transactions.filter(tx => tx.type === 'purchase').length} purchases
                        </div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <div className="text-sm text-muted-foreground font-mono">net_revenue</div>
                        </div>
                        <div className="text-2xl font-bold text-primary font-mono">
                            ${((totalRevenue - totalRefunds) / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            after_refunds
                        </div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                            <div className="text-sm text-muted-foreground font-mono">credits_sold</div>
                        </div>
                        <div className="text-2xl font-bold text-purple-400 font-mono">
                            {totalCreditsDistributed.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            total_distributed
                        </div>
                    </div>
                    <div className="bg-card/50 terminal-border rounded-lg p-4 backdrop-blur">
                        <div className="flex items-center space-x-2 mb-2">
                            <CreditCard className="w-5 h-5 text-pink-400" />
                            <div className="text-sm text-muted-foreground font-mono">credits_used</div>
                        </div>
                        <div className="text-2xl font-bold text-pink-400 font-mono">
                            {totalCreditsUsed.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            total_consumed
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-card/50 terminal-border rounded-lg overflow-hidden backdrop-blur">
                    <table className="w-full">
                        <thead className="bg-card">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">user</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">stripe_id</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-card/30">
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                        {tx.createdAt.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground font-mono">
                                        {tx.userEmail}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <TypeBadge type={tx.type} />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono">
                                        {tx.amount !== undefined ? (
                                            <span className={`font-medium ${tx.type === 'purchase' ? 'text-green-400' :
                                                tx.type === 'refund' ? 'text-red-400' :
                                                    'text-muted-foreground'
                                                }`}>
                                                ${(tx.amount / 100).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/50">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono">
                                        <span className={`font-medium ${tx.credits > 0 ? 'text-green-400' :
                                            tx.credits < 0 ? 'text-red-400' :
                                                'text-muted-foreground'
                                            }`}>
                                            {tx.credits > 0 ? '+' : ''}{tx.credits}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                        {tx.description}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                        {tx.stripePaymentId ? (
                                            <a
                                                href={`https://dashboard.stripe.com/payments/${tx.stripePaymentId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary/80 cyber-glow"
                                            >
                                                {tx.stripePaymentId.substring(0, 12)}...
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function TypeBadge({ type }: { type: string }) {
    const typeConfig = {
        purchase: 'bg-green-500/20 text-green-400 border-green-400/50',
        deduction: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
        refund: 'bg-red-500/20 text-red-400 border-red-400/50',
    }

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium uppercase border font-mono ${typeConfig[type as keyof typeof typeConfig]}`}>
            {type}
        </span>
    )
}
