import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: '4tify - Secure Your Android Apps',
    description: 'Cloud-based Android app protection. Fortify your APKs with enterprise-grade security.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: '4tify',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: '/icon-192.svg',
        apple: '/icon-192.svg',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    minimumScale: 1,
    userScalable: true,
    themeColor: '#00ff9d',
    viewportFit: 'cover',
    interactiveWidget: 'resizes-content',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#00ff9d" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="4tify" />
                <link rel="apple-touch-icon" href="/icon-192.svg" />
                <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
            </head>
            <body className={inter.className}>
                <ServiceWorkerRegister />
                {children}
                <Toaster position="top-right" />
            </body>
        </html>
    )
}
