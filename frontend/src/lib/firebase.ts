import { initializeApp, getApps } from 'firebase/app'
import { Auth, getAuth } from 'firebase/auth'
import { Firestore, getFirestore } from 'firebase/firestore'
import { FirebaseStorage, getStorage } from 'firebase/storage'
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Helper to initialize Firebase only on client side
function initFirebase() {
    if (typeof window === 'undefined') {
        return null
    }

    if (getApps().length === 0) {
        return initializeApp(firebaseConfig)
    }

    return getApps()[0]
}

// Initialize Firebase app
const app = initFirebase()

// Initialize Analytics (only in browser and when supported)
let analytics: Analytics | null = null
if (typeof window !== 'undefined' && app) {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app)
        }
    })
}

// Initialize services
// These are typed as non-null but will be null during SSR
// Since all our components use 'use client', they'll only run on client where these are defined
export const auth = (app ? getAuth(app) : null) as Auth
export const db = (app ? getFirestore(app) : null) as Firestore
export const storage = (app ? getStorage(app) : null) as FirebaseStorage

// Export analytics (may be null if not supported or during SSR)
export { analytics }

export default app


