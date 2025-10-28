'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function FirebaseBlockerDetector() {
    const [isBlocked, setIsBlocked] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        // Check localStorage for dismissal
        const wasDismissed = localStorage.getItem('firebase-blocker-dismissed')
        if (wasDismissed) {
            setDismissed(true)
            return
        }

        // Listen for fetch errors that might indicate blocking
        const originalFetch = window.fetch
        window.fetch = function(...args) {
            return originalFetch.apply(this, args).catch((error) => {
                if (error.message?.includes('blocked') || 
                    error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
                    setIsBlocked(true)
                }
                throw error
            })
        }

        // Also check for Firestore connection errors
        const checkFirestoreConnection = async () => {
            try {
                // Try to make a simple request to Firestore
                const response = await fetch('https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8', {
                    method: 'HEAD',
                    mode: 'no-cors'
                })
            } catch (error: any) {
                if (error.message?.includes('blocked') || 
                    error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
                    setIsBlocked(true)
                }
            }
        }

        const timer = setTimeout(checkFirestoreConnection, 2000)

        return () => {
            clearTimeout(timer)
            window.fetch = originalFetch
        }
    }, [])

    const handleDismiss = () => {
        setDismissed(true)
        localStorage.setItem('firebase-blocker-dismissed', 'true')
    }

    if (!isBlocked || dismissed) return null

    return (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom">
            <div className="terminal-border bg-yellow-950/95 backdrop-blur-lg p-4 rounded-lg shadow-xl">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-yellow-400 font-mono mb-1">
                            [FIRESTORE_BLOCKED]
                        </h3>
                        <p className="text-xs text-yellow-200 font-mono mb-2">
                            Browser extension blocking Firebase connection. Please disable ad/content blockers for this site.
                        </p>
                        <p className="text-xs text-yellow-200/80 font-mono">
                            Common culprits: uBlock Origin, Privacy Badger, AdBlock Plus
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors flex-shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
