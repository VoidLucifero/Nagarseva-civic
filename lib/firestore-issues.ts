import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, ensureAnonymousAuth } from '@/lib/firebase'
import { MOCK_ISSUES } from '@/lib/mock-data'
import type { Issue } from '@/lib/types'

const ISSUES_COLLECTION = 'issues'

let seedPromise: Promise<void> | null = null

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
      // If permission denied or final attempt, fail fast
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

function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const snap = await getDocs(collection(db, ISSUES_COLLECTION))
        if (!snap.empty) return
        const batch = writeBatch(db)
        for (const issue of MOCK_ISSUES) {
          batch.set(doc(db, ISSUES_COLLECTION, issue.id), issue)
        }
        await batch.commit()
      } catch (err) {
        console.warn('ensureSeeded warning:', err)
      }
    })()
  }
  return seedPromise
}

export async function getIssuesFromFirestore(): Promise<Issue[]> {
  await ensureSeeded()
  const q = query(collection(db, ISSUES_COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Issue)
}

export async function getIssueFromFirestore(id: string): Promise<Issue | null> {
  await ensureSeeded()
  const ref = doc(db, ISSUES_COLLECTION, id)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as Issue) : null
}

export async function getIssuesByReporterFromFirestore(reporterId: string): Promise<Issue[]> {
  await ensureSeeded()
  const q = query(collection(db, ISSUES_COLLECTION), where('reporterId', '==', reporterId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Issue)
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
    const ref = doc(db, ISSUES_COLLECTION, id)
    await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() })
  })
}

export async function upvoteIssueInFirestore(id: string): Promise<void> {
  await ensureAnonymousAuth()
  await withRetry(async () => {
    const ref = doc(db, ISSUES_COLLECTION, id)
    await updateDoc(ref, { upvotes: increment(1), confirmations: increment(1) })
  })
}
