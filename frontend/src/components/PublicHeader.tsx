'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';

interface PublicHeaderProps {
    showBackToDashboard?: boolean;
}

export default function PublicHeader({ showBackToDashboard = false }: PublicHeaderProps) {
    return (
        <header className="sticky top-0 z-50 bg-[#0f1419]/95 backdrop-blur-sm border-b border-primary/20 safe-top">
            <div className="container mx-auto px-4 py-3 sm:py-4">
                <nav className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 sm:space-x-3 touch-manipulation">
                        <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary cyber-glow" />
                        <span className="text-xl sm:text-2xl font-bold gradient-text font-mono">4tify</span>
                    </Link>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {showBackToDashboard ? (
                            <Link
                                href="/dashboard"
                                prefetch={false}
                                className="text-muted-foreground hover:text-primary font-medium transition-colors font-mono text-xs sm:text-sm md:text-base touch-manipulation px-2 py-2"
                            >
                                <span className="text-primary/60">$</span> dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="text-muted-foreground hover:text-primary font-medium transition-colors font-mono text-xs sm:text-sm md:text-base touch-manipulation px-2 py-2"
                                >
                                    <span className="text-primary/60">$</span> login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-primary text-background px-3 sm:px-4 md:px-6 py-2 rounded hover:bg-primary/90 transition-all font-medium font-mono cyber-glow text-xs sm:text-sm md:text-base touch-manipulation whitespace-nowrap min-h-[44px] flex items-center"
                                >
                                    $ sign up
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
