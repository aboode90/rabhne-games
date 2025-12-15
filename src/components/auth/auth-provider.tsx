'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (!firebaseUser) return
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || userData.displayName || 'مستخدم',
          photoURL: firebaseUser.photoURL || userData.photoURL,
          points: userData.points || 0,
          pointsToday: userData.pointsToday || 0,
          status: (userData.status as 'active' | 'suspended' | 'banned') || 'active',
          isAdmin: userData.isAdmin || false,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        })
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setFirebaseUser(null)
      toast.success('تم تسجيل الخروج بنجاح')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('حدث خطأ أثناء تسجيل الخروج')
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          // Get or create user document
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userRef)
          
          if (!userDoc.exists()) {
            // Create new user document
            const newUser = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'مستخدم',
              photoURL: firebaseUser.photoURL,
              points: 0,
              pointsToday: 0,
              status: 'active',
              isAdmin: false,
              createdAt: new Date(),
              lastLoginAt: new Date(),
            }
            await setDoc(userRef, newUser)
            setUser({
              uid: firebaseUser.uid,
              ...newUser,
              status: 'active' as const,
            })
          } else {
            // Update last login
            await updateDoc(userRef, { lastLoginAt: new Date() })
            await refreshUser()
          }
        } catch (error) {
          console.error('Error handling user auth:', error)
          toast.error('حدث خطأ أثناء تسجيل الدخول')
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [firebaseUser])

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signOut: handleSignOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}