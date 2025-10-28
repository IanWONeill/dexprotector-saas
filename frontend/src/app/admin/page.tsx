"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    getDocs,
    orderBy,
    where,
    Timestamp,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import {
    Users,
    CreditCard,
    FileText,
    DollarSign,
    TrendingUp,
    Activity,
    Clock,
    Database,
    Settings as SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    credits: number;
    isAdmin?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface Job {
    id: string;
    userId: string;
    status: "pending" | "processing" | "completed" | "failed";
    configTier?: string;
    creditsUsed?: number;
    createdAt: Date;
    completedAt?: Date;
    processingTime?: number;
}

interface Transaction {
    id: string;
    userId: string;
    type: "purchase" | "deduction" | "refund";
    amount: number;
    credits: number;
    createdAt: Date;
}

interface Stats {
    totalUsers: number;
    totalJobs: number;
    totalRevenue: number;
    totalCreditsDistributed: number;
    totalCreditsUsed: number;
    avgProcessingTime: number;
    jobsLast24h: number;
    newUsersLast7d: number;
    successRate: number;
}

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
            return;
        }

        if (user) {
            checkAdminStatus(user);
        }
    }, [user, loading, router]);

    const checkAdminStatus = async (currentUser: FirebaseUser) => {
        try {
            const userDoc = await getDocs(
                query(collection(db, "users"), where("__name__", "==", currentUser.uid))
            );

            if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                if (userData.isAdmin === true) {
                    setIsAdmin(true);
                    loadDashboardData();
                } else {
                    router.push("/dashboard");
                }
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
            router.push("/dashboard");
        }
    };

    const loadDashboardData = async () => {
        setLoadingData(true);
        try {
            // Load all users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const users: User[] = usersSnapshot.docs.map(
                (doc) =>
                ({
                    uid: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                } as User)
            );

            // Load all jobs
            const jobsSnapshot = await getDocs(collection(db, "jobs"));
            const jobs: Job[] = jobsSnapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    completedAt: doc.data().completedAt?.toDate(),
                } as Job)
            );

            // Load all transactions
            const transactionsSnapshot = await getDocs(
                collection(db, "transactions")
            );
            const transactions: Transaction[] = transactionsSnapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                } as Transaction)
            );

            // Calculate statistics
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const completedJobs = jobs.filter((j) => j.status === "completed");
            const totalRevenue = transactions
                .filter((t) => t.type === "purchase")
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const totalCreditsDistributed = transactions
                .filter((t) => t.type === "purchase")
                .reduce((sum, t) => sum + t.credits, 0);

            const totalCreditsUsed = transactions
                .filter((t) => t.type === "deduction")
                .reduce((sum, t) => sum + Math.abs(t.credits), 0);

            const avgProcessingTime =
                completedJobs.length > 0
                    ? completedJobs.reduce((sum, j) => sum + (j.processingTime || 0), 0) /
                    completedJobs.length
                    : 0;

            const jobsLast24h = jobs.filter((j) => j.createdAt >= last24h).length;
            const newUsersLast7d = users.filter((u) => u.createdAt >= last7d).length;
            const successRate =
                jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0;

            setStats({
                totalUsers: users.length,
                totalJobs: jobs.length,
                totalRevenue,
                totalCreditsDistributed,
                totalCreditsUsed,
                avgProcessingTime,
                jobsLast24h,
                newUsersLast7d,
                successRate,
            });

            // Set recent data
            setRecentUsers(
                users
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, 5)
            );
            setRecentJobs(
                jobs
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, 10)
            );
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
                <div className="text-primary text-xl animate-pulse font-mono cyber-glow">
                    loading_admin_dashboard...
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0f1419] text-white">
            {/* Header */}
            <AdminHeader 
                pageTitle="ADMIN_DASHBOARD" 
                subtitle="system overview and management"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-bottom">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 sm:space-x-4 sm:gap-0 mb-8 border-b border-border overflow-x-auto pb-px">
                    <Link
                        href="/admin"
                        className="px-4 py-2 border-b-2 border-primary text-primary font-medium font-mono whitespace-nowrap touch-manipulation"
                    >
                        overview
                    </Link>
                    <Link
                        href="/admin/users"
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-mono whitespace-nowrap touch-manipulation"
                    >
                        users
                    </Link>
                    <Link
                        href="/admin/jobs"
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                        jobs
                    </Link>
                    <Link
                        href="/admin/storage"
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                        storage
                    </Link>
                    <Link
                        href="/admin/transactions"
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                        transactions
                    </Link>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={<Users className="w-6 h-6" />}
                                label="Total Users"
                                value={stats.totalUsers.toLocaleString()}
                                subtext={`${stats.newUsersLast7d} new this week`}
                                color="cyan"
                            />
                            <StatCard
                                icon={<FileText className="w-6 h-6" />}
                                label="Total Jobs"
                                value={stats.totalJobs.toLocaleString()}
                                subtext={`${stats.jobsLast24h} in last 24h`}
                                color="purple"
                            />
                            <StatCard
                                icon={<DollarSign className="w-6 h-6" />}
                                label="Total Revenue"
                                value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
                                subtext={`${stats.totalCreditsDistributed} credits sold`}
                                color="green"
                            />
                            <StatCard
                                icon={<TrendingUp className="w-6 h-6" />}
                                label="Success Rate"
                                value={`${stats.successRate.toFixed(1)}%`}
                                subtext={`Avg: ${stats.avgProcessingTime.toFixed(0)}s`}
                                color="pink"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={<CreditCard className="w-6 h-6" />}
                                label="Credits Distributed"
                                value={stats.totalCreditsDistributed.toLocaleString()}
                                subtext="Total purchased"
                                color="cyan"
                            />
                            <StatCard
                                icon={<Activity className="w-6 h-6" />}
                                label="Credits Used"
                                value={stats.totalCreditsUsed.toLocaleString()}
                                subtext="Total consumed"
                                color="purple"
                            />
                            <StatCard
                                icon={<Clock className="w-6 h-6" />}
                                label="Avg Processing"
                                value={`${stats.avgProcessingTime.toFixed(1)}s`}
                                subtext="Per job"
                                color="green"
                            />
                            <StatCard
                                icon={<Database className="w-6 h-6" />}
                                label="Active Today"
                                value={stats.jobsLast24h.toLocaleString()}
                                subtext="Jobs in 24h"
                                color="pink"
                            />
                        </div>
                    </>
                )}

                {/* Recent Users */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-mono gradient-text">[RECENT_USERS]</h2>
                        <Link
                            href="/admin/users"
                            className="text-primary hover:text-foreground text-sm font-mono transition-colors"
                        >
                            view_all →
                        </Link>
                    </div>
                    <div className="bg-card/30 border border-border rounded-lg overflow-hidden backdrop-blur">
                        <table className="w-full">
                            <thead className="bg-card/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        credits
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        admin
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentUsers.map((user) => (
                                    <tr key={user.uid} className="hover:bg-card/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-foreground font-mono">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="text-primary font-medium font-mono cyber-glow">
                                                {user.credits}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {user.createdAt.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {user.isAdmin && (
                                                <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium font-mono">
                                                    ADMIN
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>                {/* Recent Jobs */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-mono gradient-text">[RECENT_JOBS]</h2>
                        <Link
                            href="/admin/jobs"
                            className="text-primary hover:text-foreground text-sm font-mono transition-colors"
                        >
                            view_all →
                        </Link>
                    </div>
                    <div className="bg-card/30 border border-border rounded-lg overflow-hidden backdrop-blur">
                        <table className="w-full">
                            <thead className="bg-card/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        job_id
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        tier
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        credits
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase font-mono">
                                        time
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-card/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                                            {job.id.substring(0, 8)}...
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
                                        <td className="px-6 py-4 text-sm text-primary font-medium font-mono cyber-glow">
                                            {job.creditsUsed || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {job.createdAt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {job.processingTime ? `${job.processingTime}s` : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtext: string;
    color: "cyan" | "purple" | "green" | "pink";
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
    const colorClasses = {
        cyan: "text-primary bg-primary/10 cyber-glow",
        purple: "text-purple-400 bg-purple-400/10",
        green: "text-green-400 bg-green-400/10",
        pink: "text-pink-400 bg-pink-400/10",
    };

    return (
        <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-6">
            <div
                className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
            >
                {icon}
            </div>
            <div className="text-2xl font-bold text-foreground font-mono mb-1">{value}</div>
            <div className="text-sm text-muted-foreground font-mono mb-1">{label}</div>
            <div className="text-xs text-muted-foreground/70 font-mono">{subtext}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusColors = {
        pending: "bg-yellow-500/20 text-yellow-400",
        processing: "bg-blue-500/20 text-blue-400",
        completed: "bg-green-500/20 text-green-400",
        failed: "bg-red-500/20 text-red-400",
    };

    return (
        <span
            className={`px-2 py-1 rounded text-xs font-medium font-mono ${statusColors[status as keyof typeof statusColors]
                }`}
        >
            {status.toUpperCase()}
        </span>
    );
}
