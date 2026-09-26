import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore as getAdminDb } from 'firebase-admin/firestore'

export function getAdminFirestore() {
  if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson)
        initializeApp({
          credential: cert(serviceAccount),
          projectId: 'nagarseva-civic-3c8fe',
        })
      } catch (e) {
        initializeApp({ projectId: 'nagarseva-civic-3c8fe' })
      }
    } else {
      initializeApp({ projectId: 'nagarseva-civic-3c8fe' })
    }
  }
  return getAdminDb()
}

/**
 * Server-Side Privileged Function to Set/Elevate Officer Role in Firestore.
 * Bypasses client security rules because it executes via Firebase Admin SDK on the server.
 */
export async function serverSetOfficerRole(userRecord: {
  id: string
  name: string
  phone: string
  initials: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  points: number
  reports: number
  resolved: number
  role: 'citizen' | 'official'
}) {
  try {
    const adminDb = getAdminFirestore()
    await adminDb.collection('users').doc(userRecord.id).set(userRecord, { merge: true })
    return true
  } catch (err: any) {
    console.warn('Admin SDK write warning, falling back to server DB helper:', err?.message || err)
    return false
  }
}
