'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Zap, Lock, Cloud, Terminal, Shield } from 'lucide-react'
import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

export default function Home() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/dashboard')
            } else {
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary cyber-glow"></div>
                    <div className="font-mono text-primary text-sm">initializing...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1419] relative overflow-hidden no-scroll-x">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]"></div>

            {/* Header */}
            <PublicHeader />

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-10 sm:py-16 md:py-20 text-center relative z-10 safe-bottom">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1 bg-primary/10 border border-primary/30 rounded-full">
                        <span className="text-primary font-mono text-xs sm:text-sm">v1.0.0 // enterprise-grade protection</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
                        <span className="text-foreground">Fortify Your</span>
                        <br />
                        <span className="gradient-text text-glow font-mono">Android Apps</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto font-mono px-4">
                        <span className="text-primary">{'>'}</span> Military-grade obfuscation & protection
                        <br className="hidden sm:block" />
                        <span className="sm:hidden"> • </span>
                        <span className="text-primary">{'>'}</span> Deploy secure APKs in minutes
                    </p>
                    <div className="flex items-center justify-center flex-col sm:flex-row gap-3 sm:gap-4 px-4">
                        <Link
                            href="/auth/signup"
                            className="w-full sm:w-auto bg-primary text-background px-6 sm:px-8 py-3 sm:py-4 rounded hover:bg-primary/90 transition-all font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 cyber-glow-intense font-mono touch-manipulation min-h-[48px]"
                        >
                            <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>$ sign up</span>
                        </Link>
                        <Link
                            href="/pricing"
                            className="w-full sm:w-auto bg-transparent text-primary px-6 sm:px-8 py-3 sm:py-4 rounded hover:bg-primary/10 transition-all font-semibold text-base sm:text-lg border-2 border-primary font-mono touch-manipulation"
                        >
                            <span className="text-primary/60">$</span> pricing --info
                        </Link>
                    </div>

                    {/* Terminal preview */}
                    <div className="mt-8 sm:mt-12 md:mt-16 max-w-3xl mx-auto px-2">
                        <div className="terminal-border rounded-lg overflow-hidden bg-card/80 backdrop-blur">
                            <div className="bg-muted/50 px-3 sm:px-4 py-2 flex items-center space-x-2 border-b border-border">
                                <div className="flex space-x-1.5 sm:space-x-2">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-muted-foreground text-xs sm:text-sm font-mono truncate">4tify@terminal ~ ./protect</span>
                            </div>
                            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-left overflow-x-auto">
                                <div className="text-primary mb-2 whitespace-nowrap">$ 4tify protect app.apk --config advanced</div>
                                <div className="text-muted-foreground text-xs sm:text-sm">Initializing protection pipeline...</div>
                                <div className="text-green-400 text-xs sm:text-sm">✓ String encryption applied</div>
                                <div className="text-green-400 text-xs sm:text-sm">✓ Class obfuscation complete</div>
                                <div className="text-green-400 text-xs sm:text-sm">✓ RASP features enabled</div>
                                <div className="text-green-400 text-xs sm:text-sm">✓ Anti-debug protection active</div>
                                <div className="text-primary mt-2 whitespace-nowrap text-xs sm:text-sm">Protected APK ready: app-protected.apk</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-10 sm:py-16 md:py-20 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <FeatureCard
                        icon={<Shield className="h-8 w-8" />}
                        title="[OBFUSCATION]"
                        description="Military-grade string & class encryption with multi-layer protection"
                    />
                    <FeatureCard
                        icon={<Zap className="h-8 w-8" />}
                        title="[SPEED]"
                        description="Cloud-native processing: 60s average APK hardening time"
                    />
                    <FeatureCard
                        icon={<Lock className="h-8 w-8" />}
                        title="[RASP]"
                        description="Runtime: anti-debug • anti-tamper • anti-emulator • root detection"
                    />
                    <FeatureCard
                        icon={<Cloud className="h-8 w-8" />}
                        title="[SERVERLESS]"
                        description="Zero-install architecture. Terminal access from anywhere."
                    />
                </div>
            </section>

            {/* How It Works */}
            <section className="container mx-auto px-4 py-10 sm:py-16 md:py-20 relative z-10">
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-6 sm:p-8 md:p-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 gradient-text font-mono">// EXECUTION FLOW</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
                        <Step
                            number="01"
                            title="UPLOAD"
                            description="scp your.apk 4tify://secure"
                            command="(max 120MB)"
                        />
                        <Step
                            number="02"
                            title="CONFIGURE"
                            description="./config --preset advanced"
                            command="or custom params"
                        />
                        <Step
                            number="03"
                            title="DEPLOY"
                            description="curl -O protected.apk"
                            command="< 2min avg"
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-10 sm:py-16 md:py-20 text-center relative z-10 safe-bottom">
                <div className="max-w-3xl mx-auto terminal-border rounded-lg p-6 sm:p-8 md:p-12 bg-card/50 backdrop-blur cyber-glow">
                    <div className="font-mono text-primary text-xs sm:text-sm mb-3 sm:mb-4">[SYSTEM READY]</div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 gradient-text font-mono">Initialize Protection?</h2>
                    <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-muted-foreground font-mono px-2">
                        <span className="text-primary">{'>'}</span> 5 free credits on signup
                        <br />
                        <span className="text-primary">{'>'}</span> No payment required
                    </p>
                    <Link
                        href="/auth/signup"
                        className="bg-primary text-background px-6 sm:px-8 py-3 sm:py-4 rounded hover:bg-primary/90 transition-all font-semibold text-base sm:text-lg inline-flex items-center space-x-2 cyber-glow-intense font-mono touch-manipulation w-full sm:w-auto justify-center min-h-[48px]"
                    >
                        <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>$ sign up</span>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-6 sm:py-8 text-center text-muted-foreground border-t border-border relative z-10 safe-bottom">
                <p className="font-mono text-xs sm:text-sm">
                    <span className="text-primary">©</span> 2025 4tify <span className="text-primary/60 hidden sm:inline">// fortify_your_apps()</span>
                </p>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="terminal-border bg-card/30 backdrop-blur p-4 sm:p-6 rounded hover:bg-card/50 transition-all group touch-manipulation">
            <div className="text-primary mb-3 sm:mb-4 group-hover:cyber-glow transition-all">{icon}</div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary font-mono">{title}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm font-mono leading-relaxed">{description}</p>
        </div>
    )
}

function Step({ number, title, description, command }: { number: string; title: string; description: string; command: string }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary text-primary rounded flex items-center justify-center text-base sm:text-lg font-bold mx-auto mb-3 sm:mb-4 font-mono cyber-glow">
                {number}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground font-mono">[{title}]</h3>
            <p className="text-primary text-xs sm:text-sm font-mono mb-1">{description}</p>
            <p className="text-muted-foreground text-xs font-mono">{command}</p>
        </div>
    )
}
