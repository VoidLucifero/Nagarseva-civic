import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInAnonymously, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    'AIzaSyCZ5Er3evZrHGzvDaJ5TkPZ7uECcqnl87U',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    'nagarseva-civic-3c8fe.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'nagarseva-civic-3c8fe',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    'nagarseva-civic-3c8fe.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    '751165399407',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    '1:751165399407:web:91c2c2f5a657a12392',
}

export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
export const firestore = getFirestore(firebaseApp)
export const db = firestore

import { purgeStaleUserCache } from './client-storage'

/**
 * Ensures a silent anonymous Firebase Auth session for account-free reporting.
 * Visitors get authenticated behind the scenes so Firestore security rules pass,
 * while keeping the reporting UX 100% account-free.
 * (Vercel Auto-Deploy Webhook Verification)
 */
export async function ensureAnonymousAuth() {
  if (typeof window === 'undefined') return null
  let user = auth.currentUser

  if (!user) {
    try {
      const userCredential = await signInAnonymously(auth)
      user = userCredential.user
    } catch (err: any) {
      console.warn('Anonymous Firebase auth warning:', err?.message || err)
      return null
    }
  }

  if (user?.uid) {
    purgeStaleUserCache(user.uid)
  }

  return user
}
