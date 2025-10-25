'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Shield, Zap, Lock, Cloud, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gray-900">DexProtector SaaS</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Protect Your Android Apps
            <span className="text-primary"> in the Cloud</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Enterprise-grade app protection powered by Licel DexProtector.
            Secure your APKs with just a few clicks.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/auth/signup"
              className="bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg flex items-center space-x-2"
            >
              <span>Start Protecting</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="bg-white text-primary px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg border-2 border-primary"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Advanced Protection"
            description="String encryption, class encryption, and resource protection"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Lightning Fast"
            description="Process APKs in minutes with our optimized cloud infrastructure"
          />
          <FeatureCard
            icon={<Lock className="h-8 w-8" />}
            title="RASP Features"
            description="Runtime checks, anti-debug, anti-emulator, and more"
          />
          <FeatureCard
            icon={<Cloud className="h-8 w-8" />}
            title="Cloud-Based"
            description="No installation required. Works from any browser"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-white/50 rounded-3xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Step
            number="1"
            title="Upload Your APK"
            description="Drag and drop your Android application (up to 120MB)"
          />
          <Step
            number="2"
            title="Configure Protection"
            description="Choose your protection settings or use our presets"
          />
          <Step
            number="3"
            title="Download Protected App"
            description="Get your secured APK in minutes"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto bg-primary rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Apps?</h2>
          <p className="text-xl mb-8 opacity-90">
            Get started with 10 free credits. No credit card required.
          </p>
          <Link
            href="/auth/signup"
            className="bg-white text-primary px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg inline-flex items-center space-x-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2025 DexProtector SaaS. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
