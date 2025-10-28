import { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

interface UserData {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
    credits: number
    isAdmin?: boolean
    createdAt: Date
    updatedAt: Date
}

export function useAuth() {
    const [user, setUser] = useState<FirebaseUser | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                    if (userDoc.exists()) {
                        setUserData({
                            uid: firebaseUser.uid,
                            ...userDoc.data(),
                            createdAt: userDoc.data().createdAt?.toDate() || new Date(),
                            updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
                        } as UserData)
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error)
                }
            } else {
                setUserData(null)
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return { user, userData, loading }
}
