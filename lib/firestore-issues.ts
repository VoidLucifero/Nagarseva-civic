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
import { db } from '@/lib/firebase'
import { MOCK_ISSUES } from '@/lib/mock-data'
import type { Issue } from '@/lib/types'

const ISSUES_COLLECTION = 'issues'

let seedPromise: Promise<void> | null = null

/**
 * One-time seed so the demo isn't empty on a fresh Firestore project.
 * Safe to call repeatedly — only writes if the collection is empty, and only
 * ever runs once per page load thanks to the module-level promise cache.
 */
function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const snap = await getDocs(collection(db, ISSUES_COLLECTION))
      if (!snap.empty) return
      const batch = writeBatch(db)
      for (const issue of MOCK_ISSUES) {
        batch.set(doc(db, ISSUES_COLLECTION, issue.id), issue)
      }
      await batch.commit()
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
  // Use the issue's own generated ID as the Firestore document ID, so lookups
  // by ID (getIssueFromFirestore) work for both seeded and newly created issues.
  await setDoc(doc(db, ISSUES_COLLECTION, issue.id), issue)
}

export async function updateIssueInFirestore(id: string, updates: Partial<Issue>): Promise<void> {
  const ref = doc(db, ISSUES_COLLECTION, id)
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() })
}

export async function upvoteIssueInFirestore(id: string): Promise<void> {
  const ref = doc(db, ISSUES_COLLECTION, id)
  await updateDoc(ref, { upvotes: increment(1), confirmations: increment(1) })
}
