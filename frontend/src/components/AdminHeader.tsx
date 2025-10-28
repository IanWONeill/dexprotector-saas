'use client';

import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MobileNav from './MobileNav';

interface AdminHeaderProps {
    pageTitle: string;
    subtitle?: string;
}

export default function AdminHeader({ pageTitle, subtitle }: AdminHeaderProps) {
    return (
        <>
            <header className="border-b border-border bg-[#0f1419]/95 backdrop-blur-sm sticky top-0 z-30 safe-top">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Logo + Mobile Nav */}
                        <div className="flex items-center space-x-3">
                            <MobileNav isAdmin={true} />
                            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary cyber-glow" />
                            <Link href="/admin" className="text-xl sm:text-2xl font-bold gradient-text font-mono hover:opacity-80 transition-opacity">
                                4tify
                            </Link>
                            <span className="text-muted-foreground text-sm font-mono hidden lg:inline">
                                <span className="text-primary/60">//</span> admin
                            </span>
                        </div>

                        {/* Right: Back to Dashboard */}
                        <Link
                            href="/dashboard"
                            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm touch-manipulation"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">dashboard</span>
                        </Link>
                    </div>
                </div>
            </header>
            
            {/* Page Title Bar */}
            <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    <div className="font-mono text-primary text-xs sm:text-sm mb-2">
                        <span className="text-primary/60">$</span> cd /admin/{pageTitle.toLowerCase().replace(/[^a-z]/g, '')}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2 font-mono">
                        [{pageTitle}]
                    </h1>
                    {subtitle && (
                        <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                            <span className="text-primary">{'>'}</span> {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
