'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to console
        console.error('Dashboard error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#0f1419] flex items-center justify-center px-4">
            <div className="max-w-md w-full terminal-border bg-card/30 backdrop-blur rounded-lg p-8 text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2 font-mono">
                    [ERROR]
                </h2>
                <p className="text-muted-foreground font-mono text-sm mb-6">
                    {error.message || 'Failed to load dashboard'}
                </p>
                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="w-full bg-primary text-background px-6 py-3 rounded hover:bg-primary/90 transition-all font-semibold font-mono"
                    >
                        ./retry
                    </button>
                    <Link
                        href="/"
                        className="block w-full terminal-border bg-card px-6 py-3 rounded hover:bg-card/50 transition-all font-semibold font-mono"
                    >
                        {'<'} back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
