'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Shield, FileUp, Settings, BarChart3, Users, Database, DollarSign, CreditCard } from 'lucide-react';

interface MobileNavProps {
    isAdmin?: boolean;
}

export default function MobileNav({ isAdmin }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={toggleMenu}
                className="lg:hidden p-2 text-primary hover:text-primary/80 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <X className="w-6 h-6 cyber-glow" />
                ) : (
                    <Menu className="w-6 h-6 cyber-glow" />
                )}
            </button>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Menu Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-[280px] bg-gradient-to-b from-[#1a1f2e] via-[#0f1419] to-[#0a0d12] border-r-2 border-primary z-50 transform transition-transform duration-300 lg:hidden shadow-[0_0_50px_rgba(0,255,157,0.3)] ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full p-6 safe-top safe-bottom backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-primary/40">
                        <Link href="/dashboard" onClick={closeMenu} className="gradient-text text-2xl font-bold font-mono cyber-glow-intense">
                            4tify
                        </Link>
                        <button
                            onClick={closeMenu}
                            className="p-2 text-foreground hover:text-primary transition-colors touch-target"
                            aria-label="Close menu"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 space-y-3 overflow-y-auto">
                        <Link
                            href="/dashboard"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-primary hover:bg-primary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-primary/10 to-transparent border border-primary/30"
                        >
                            <Shield className="w-5 h-5 text-primary cyber-glow" />
                            <span className="font-semibold">[DASHBOARD]</span>
                        </Link>

                        <Link
                            href="/dashboard/protect"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-primary hover:bg-primary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-primary/10 to-transparent border border-primary/30"
                        >
                            <FileUp className="w-5 h-5 text-primary cyber-glow" />
                            <span className="font-semibold">[PROTECT]</span>
                        </Link>

                        <Link
                            href="/dashboard/settings"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-primary hover:bg-primary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-primary/10 to-transparent border border-primary/30"
                        >
                            <Settings className="w-5 h-5 text-primary cyber-glow" />
                            <span className="font-semibold">[SETTINGS]</span>
                        </Link>

                        <Link
                            href="/pricing"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-primary hover:bg-primary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-primary/10 to-transparent border border-primary/30"
                        >
                            <CreditCard className="w-5 h-5 text-primary cyber-glow" />
                            <span className="font-semibold">[PRICING]</span>
                        </Link>

                        {isAdmin && (
                            <>
                                <div className="pt-4 mt-4 border-t-2 border-secondary/40">
                                    <p className="px-4 py-2 text-sm font-mono text-secondary font-bold cyber-glow">[ADMIN_PANEL]</p>
                                </div>

                                <Link
                                    href="/admin"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-secondary hover:bg-secondary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/30"
                                >
                                    <Shield className="w-5 h-5 text-secondary" />
                                    <span className="font-semibold">[DASHBOARD]</span>
                                </Link>

                                <Link
                                    href="/admin/jobs"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-secondary hover:bg-secondary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/30"
                                >
                                    <BarChart3 className="w-5 h-5 text-secondary" />
                                    <span className="font-semibold">[JOBS]</span>
                                </Link>

                                <Link
                                    href="/admin/users"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-secondary hover:bg-secondary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/30"
                                >
                                    <Users className="w-5 h-5 text-secondary" />
                                    <span className="font-semibold">[USERS]</span>
                                </Link>

                                <Link
                                    href="/admin/storage"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-secondary hover:bg-secondary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/30"
                                >
                                    <Database className="w-5 h-5 text-secondary" />
                                    <span className="font-semibold">[STORAGE]</span>
                                </Link>

                                <Link
                                    href="/admin/transactions"
                                    onClick={closeMenu}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-mono text-foreground hover:text-secondary hover:bg-secondary/20 rounded-lg transition-all touch-manipulation bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/30"
                                >
                                    <DollarSign className="w-5 h-5 text-secondary" />
                                    <span className="font-semibold">[TRANSACTIONS]</span>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="pt-4 border-t-2 border-primary/40">
                        <p className="text-xs font-mono text-primary font-semibold text-center">
                            v1.0.0 | PWA Ready
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
