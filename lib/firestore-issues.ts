import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, ensureAnonymousAuth } from '@/lib/firebase'
import type { Issue } from '@/lib/types'

const ISSUES_COLLECTION = 'issues'

/**
 * Retry helper for transient network blips / timeouts.
 * Retries up to 3 times with exponential backoff before throwing.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500,
): Promise<T> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (err: any) {
      attempt++
      if (err?.code === 'permission-denied' || attempt >= maxRetries) {
        throw err
      }
      console.warn(
        `Firestore operation attempt ${attempt} failed, retrying in ${delayMs * Math.pow(2, attempt - 1)}ms...`,
        err?.message || err,
      )
      await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt - 1)))
    }
  }
  throw new Error('Firestore operation failed after retries.')
}

export async function getIssuesFromFirestore(): Promise<Issue[]> {
  try {
    const q = query(collection(db, ISSUES_COLLECTION), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Issue)
  } catch (err) {
    console.warn('getIssuesFromFirestore error:', err)
    return []
  }
}

export async function getIssueFromFirestore(id: string): Promise<Issue | null> {
  try {
    const ref = doc(db, ISSUES_COLLECTION, id)
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as Issue) : null
  } catch (err) {
    return null
  }
}

export async function getIssuesByReporterFromFirestore(reporterId: string): Promise<Issue[]> {
  try {
    const q = query(collection(db, ISSUES_COLLECTION), where('reporterId', '==', reporterId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Issue)
  } catch (err) {
    return []
  }
}

export async function createIssueInFirestore(issue: Issue): Promise<void> {
  await ensureAnonymousAuth()
  await withRetry(async () => {
    await setDoc(doc(db, ISSUES_COLLECTION, issue.id), issue)
  })
}

export async function updateIssueInFirestore(id: string, updates: Partial<Issue>): Promise<void> {
  await ensureAnonymousAuth()
  await withRetry(async () => {
    await updateDoc(doc(db, ISSUES_COLLECTION, id), updates)
  })
}
