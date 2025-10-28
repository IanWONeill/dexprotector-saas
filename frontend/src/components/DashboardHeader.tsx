'use client';

import { Shield, CreditCard, LogOut } from 'lucide-react';
import Link from 'next/link';
import MobileNav from './MobileNav';

interface DashboardHeaderProps {
    credits?: number;
    isAdmin?: boolean;
    onSignOut?: () => void;
    showAuthButtons?: boolean;
}

export default function DashboardHeader({ 
    credits, 
    isAdmin, 
    onSignOut,
    showAuthButtons = true 
}: DashboardHeaderProps) {
    return (
        <header className="border-b border-border bg-[#0f1419]/95 backdrop-blur-sm sticky top-0 z-30 safe-top">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Left: Logo + Mobile Nav */}
                    <div className="flex items-center space-x-3">
                        <MobileNav isAdmin={isAdmin} />
                        <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary cyber-glow" />
                        <Link href="/dashboard" prefetch={false} className="text-xl sm:text-2xl font-bold gradient-text font-mono hover:opacity-80 transition-opacity">
                            4tify
                        </Link>
                        <span className="text-muted-foreground text-sm font-mono hidden lg:inline">
                            <span className="text-primary/60">//</span> terminal
                        </span>
                    </div>

                    {/* Right: Credits + Admin + Logout */}
                    {showAuthButtons && (
                        <div className="flex items-center space-x-2 sm:space-x-6">
                            {/* Credits Badge */}
                            {credits !== undefined && (
                                <div className="flex items-center space-x-1 sm:space-x-2 terminal-border bg-card/50 px-2 sm:px-4 py-2 rounded">
                                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    <span className="font-mono text-sm sm:text-base text-primary font-semibold">{credits}</span>
                                    <span className="text-muted-foreground text-xs sm:text-sm font-mono hidden sm:inline">credits</span>
                                </div>
                            )}

                            {/* Admin Button (Desktop Only) */}
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="hidden md:flex items-center space-x-2 terminal-border bg-card/50 px-4 py-2 rounded hover:bg-primary/10 transition-all font-mono text-primary hover:text-primary/80 touch-manipulation"
                                >
                                    <Shield className="h-5 w-5" />
                                    <span>admin</span>
                                </Link>
                            )}

                            {/* Logout Button */}
                            {onSignOut && (
                                <button
                                    onClick={onSignOut}
                                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors font-mono touch-manipulation min-w-[44px] min-h-[44px] justify-center"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="hidden lg:inline">logout</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
