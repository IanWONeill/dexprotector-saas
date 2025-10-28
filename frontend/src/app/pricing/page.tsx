'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { getStripe } from '@/lib/stripe'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { Check, CreditCard } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardHeader from '@/components/DashboardHeader'
import { logger } from '@/lib/logger'

const CREDIT_PACKAGES = [
    {
        id: 'starter',
        name: 'Starter',
        credits: 10,
        price: 9.99,
        pricePerCredit: 0.99,
        stripePriceId: 'price_1SLx6hKdyWMKWoqkYKjSCZzA',
        popular: false,
    },
    {
        id: 'professional',
        name: 'Professional',
        credits: 50,
        price: 39.99,
        pricePerCredit: 0.80,
        stripePriceId: 'price_1SLx7uKdyWMKWoqkzQeVpNpG',
        popular: true,
        savings: '20%',
    },
    {
        id: 'business',
        name: 'Business',
        credits: 100,
        price: 69.99,
        pricePerCredit: 0.70,
        stripePriceId: 'price_1SLx8dKdyWMKWoqkapfgJqRN',
        popular: false,
        savings: '30%',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        credits: 500,
        price: 299.99,
        pricePerCredit: 0.60,
        stripePriceId: 'price_1SLx9iKdyWMKWoqkmURWWEB8',
        popular: false,
        savings: '40%',
    },
]

export default function PricingPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [userCredits, setUserCredits] = useState<number>(0)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid)
                // Fetch user credits and admin status
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid))
                    if (userDoc.exists()) {
                        setUserCredits(userDoc.data().credits || 0)
                    }

                    // Check if user is admin
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid))
                    setIsAdmin(adminDoc.exists())
                } catch (error) {
                    logger.error('Error fetching user data:', error)
                }
            }
            setAuthChecked(true)
        })

        return () => unsubscribe()
    }, [])

    const handlePurchase = async (packageId: string, stripePriceId: string) => {
        if (!userId) {
            router.push('/auth/login')
            return
        }

        if (isProcessing) return // Prevent multiple clicks

        setLoading(packageId)
        setIsProcessing(true)

        try {
            // Get Firebase Functions instance
            const functions = getFunctions()
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession')

            // Create checkout session
            const result = await createCheckoutSession({
                priceId: stripePriceId,
                origin: window.location.origin,
            })

            const { sessionId, url } = result.data as { sessionId: string; url: string }

            // Redirect to Stripe Checkout
            if (url) {
                window.location.href = url
            } else {
                const stripe = await getStripe()
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId })
                    if (error) {
                        logger.error('Stripe redirect error:', error)
                        toast.error(error.message || 'Failed to redirect to checkout')
                        setIsProcessing(false)
                    }
                }
            }
        } catch (error: any) {
            logger.error('Purchase error:', error)
            toast.error(error.message || 'Failed to start checkout')
            setIsProcessing(false)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f1419] relative overflow-hidden no-scroll-x">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]"></div>

            {/* Header */}
            <DashboardHeader
                credits={userCredits}
                isAdmin={isAdmin}
                showAuthButtons={userId ? true : false}
            />

            <div className="container mx-auto px-4 py-6 sm:py-10 md:py-12 relative z-10 safe-top safe-bottom">
                {/* Heading */}
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1 bg-primary/10 border border-primary/30 rounded-full">
                        <span className="text-primary font-mono text-xs sm:text-sm">CREDIT_PACKAGES // pay_per_use</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-3 sm:mb-4 font-mono px-2">
                        [TRANSPARENT_PRICING]
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-mono px-4">
                        <span className="text-primary">{'>'}</span> no_subscriptions() && no_hidden_fees()
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-8 sm:mb-10 md:mb-12">
                    {CREDIT_PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`terminal-border bg-card/30 backdrop-blur rounded-lg p-5 sm:p-6 md:p-8 relative hover:bg-card/50 transition-all ${pkg.popular ? 'cyber-glow ring-2 ring-primary' : ''
                                }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-primary text-background px-4 py-1 rounded-full text-sm font-semibold font-mono cyber-glow">
                                        [POPULAR]
                                    </span>
                                </div>
                            )}

                            {pkg.savings && (
                                <div className="absolute top-4 right-4">
                                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-semibold font-mono border border-green-500/30">
                                        -{pkg.savings}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-primary mb-2 font-mono">[{pkg.name.toUpperCase()}]</h3>
                                <div className="text-4xl font-bold gradient-text mb-1 font-mono">
                                    ${pkg.price}
                                </div>
                                <p className="text-muted-foreground font-mono">{pkg.credits} credits</p>
                                <p className="text-sm text-muted-foreground mt-2 font-mono">
                                    <span className="text-primary/60">$</span>{pkg.pricePerCredit.toFixed(2)} / credit
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                <PricingFeature text={`${pkg.credits} credits total`} />
                                <PricingFeature text={pkg.savings ? `Save ${pkg.savings} vs Starter` : 'Best for trying 4tify'} />
                                <PricingFeature text="Credits never expire" />
                            </ul>

                            <button
                                onClick={() => handlePurchase(pkg.id, pkg.stripePriceId)}
                                disabled={isProcessing}
                                className={`w-full py-3 rounded font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono ${pkg.popular
                                    ? 'bg-primary text-background hover:bg-primary/90 cyber-glow'
                                    : 'bg-card/50 text-primary hover:bg-card border border-primary/30'
                                    }`}
                            >
                                {loading === pkg.id ? 'processing...' : './purchase'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="max-w-4xl mx-auto terminal-border bg-card/30 backdrop-blur rounded-lg p-8 mb-12">
                    <h2 className="text-3xl font-bold gradient-text text-center mb-8 font-mono">
            // INCLUDES
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Feature
                            title="Full Protection Suite"
                            description="Access to Basic, Standard, Enhanced & Custom protection tiers"
                        />
                        <Feature
                            title="Cloud Processing"
                            description="Fast, scalable processing powered by Google Cloud infrastructure"
                        />
                        <Feature
                            title="No Expiration"
                            description="Credits never expire. Use them whenever you need"
                        />
                        <Feature
                            title="Secure Storage"
                            description="Your APKs are encrypted and automatically deleted after 30 days"
                        />
                        <Feature
                            title="Job History"
                            description="Track all your protection jobs with detailed logs"
                        />
                        <Feature
                            title="Telegram Support"
                            description="Get help from our support team via Telegram"
                        />
                    </div>
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold gradient-text text-center mb-8 font-mono">
                        [FAQ]
                    </h2>

                    <div className="space-y-4">
                        <FAQItem
                            question="What is a credit?"
                            answer="One credit allows you to protect one Android APK or AAB file (up to 120MB) with enterprise-grade protection."
                        />
                        <FAQItem
                            question="Do credits expire?"
                            answer="No, credits never expire. You can use them whenever you need."
                        />
                        <FAQItem
                            question="Can I get a refund?"
                            answer="Refunds are only available if there's an issue on our end. No refunds for completed protections."
                        />
                        <FAQItem
                            question="What payment methods do you accept?"
                            answer="We accept all major credit cards, debit cards, and digital wallets through Stripe."
                        />
                        <FAQItem
                            question="Do you offer volume discounts?"
                            answer="Yes! The more credits you purchase, the lower the per-credit price. Contact us for custom enterprise pricing."
                        />
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center terminal-border bg-card/30 backdrop-blur rounded-lg p-8 max-w-2xl mx-auto cyber-glow">
                    <div className="font-mono text-primary text-sm mb-4">[CUSTOM_SOLUTIONS]</div>
                    <p className="text-muted-foreground mb-4 font-mono">Need enterprise pricing?</p>
                    <a
                        href="https://t.me/ianwoneill"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 font-semibold text-lg font-mono"
                    >
                        <span className="text-primary/60">$</span> contact --telegram
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border relative z-10 mt-12">
                <p className="font-mono text-sm">
                    <span className="text-primary">©</span> 2025 4tify <span className="text-primary/60">// fortify_your_apps()</span>
                </p>
            </footer>
        </div>
    )
}

function PricingFeature({ text }: { text: string }) {
    return (
        <li className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground font-mono text-sm">{text}</span>
        </li>
    )
}

function Feature({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center border border-primary/30">
                    <Check className="h-5 w-5 text-primary" />
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-primary mb-1 font-mono">{title}</h3>
                <p className="text-muted-foreground text-sm font-mono leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="terminal-border bg-card/30 backdrop-blur rounded-lg hover:bg-card/50 transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between"
            >
                <span className="font-semibold text-foreground font-mono">{question}</span>
                <span className="text-primary font-mono">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
                <div className="px-6 pb-4">
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    )
}
