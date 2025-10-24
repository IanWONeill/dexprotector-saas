'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Shield, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9.99,
    pricePerCredit: 0.99,
    stripePriceId: 'price_starter_10_credits', // Replace with actual Stripe Price ID
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 50,
    price: 39.99,
    pricePerCredit: 0.80,
    stripePriceId: 'price_professional_50_credits', // Replace with actual Stripe Price ID
    popular: true,
    savings: '20%',
  },
  {
    id: 'business',
    name: 'Business',
    credits: 100,
    price: 69.99,
    pricePerCredit: 0.70,
    stripePriceId: 'price_business_100_credits', // Replace with actual Stripe Price ID
    popular: false,
    savings: '30%',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 500,
    price: 299.99,
    pricePerCredit: 0.60,
    stripePriceId: 'price_enterprise_500_credits', // Replace with actual Stripe Price ID
    popular: false,
    savings: '40%',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  const handlePurchase = async (packageId: string, stripePriceId: string) => {
    if (!userId) {
      router.push('/auth/login')
      return
    }

    setLoading(packageId)

    try {
      // TODO: Implement Stripe Checkout
      // For now, show a message
      toast.success('Stripe checkout will be implemented here')

      // Example Stripe checkout flow:
      // const response = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId: stripePriceId, userId }),
      // })
      // const { sessionId } = await response.json()
      // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      // await stripe!.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {userId && (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            )}
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900">DexProtector</span>
            </div>
          </div>
          {!userId && (
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pay only for what you use. No subscriptions, no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                pkg.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {pkg.savings && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    Save {pkg.savings}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  ${pkg.price}
                </div>
                <p className="text-gray-600">{pkg.credits} credits</p>
                <p className="text-sm text-gray-500 mt-2">
                  ${pkg.pricePerCredit.toFixed(2)} per credit
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <PricingFeature text={`${pkg.credits} APK protections`} />
                <PricingFeature text="All protection features" />
                <PricingFeature text="No expiration" />
                <PricingFeature text="Email support" />
                {pkg.credits >= 100 && <PricingFeature text="Priority processing" />}
                {pkg.credits >= 500 && <PricingFeature text="Dedicated support" />}
              </ul>

              <button
                onClick={() => handlePurchase(pkg.id, pkg.stripePriceId)}
                disabled={loading === pkg.id}
                className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  pkg.popular
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {loading === pkg.id ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            What's Included
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Feature
              title="Full DexProtector Suite"
              description="Access to all protection features including string encryption, class encryption, and RASP"
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
              title="Email Support"
              description="Get help from our support team via email"
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="What is a credit?"
              answer="One credit allows you to protect one Android APK or AAB file (up to 120MB) with DexProtector."
            />
            <FAQItem
              question="Do credits expire?"
              answer="No, credits never expire. You can use them whenever you need."
            />
            <FAQItem
              question="Can I get a refund?"
              answer="Yes, we offer a 30-day money-back guarantee if you're not satisfied with the service."
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
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Need a custom plan?</p>
          <a
            href="mailto:support@dexprotector-saas.com"
            className="text-primary hover:text-primary/80 font-semibold text-lg"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  )
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center space-x-2">
      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span className="text-gray-700">{text}</span>
    </li>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Check className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  )
}
