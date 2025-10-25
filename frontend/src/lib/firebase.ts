import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { Auth, getAuth } from 'firebase/auth'
import { Firestore, getFirestore } from 'firebase/firestore'
import { FirebaseStorage, getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
function getApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side')
  }
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
}

// Lazy getters that initialize on first access
let _auth: Auth | null = null
let _db: Firestore | null = null
let _storage: FirebaseStorage | null = null

export function getAuthInstance(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp())
  }
  return _auth
}

export function getDbInstance(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp())
  }
  return _db
}

export function getStorageInstance(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getApp())
  }
  return _storage
}

// Export for backward compatibility
export const auth = new Proxy({} as Auth, {
  get: (target, prop) => {
    const instance = getAuthInstance()
    return (instance as any)[prop]
  }
})

export const db = new Proxy({} as Firestore, {
  get: (target, prop) => {
    const instance = getDbInstance()
    return (instance as any)[prop]
  }
})

export const storage = new Proxy({} as FirebaseStorage, {
  get: (target, prop) => {
    const instance = getStorageInstance()
    return (instance as any)[prop]
  }
})

export default getApp
