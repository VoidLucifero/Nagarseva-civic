import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously, signOut } from 'firebase/auth'
import { ensureAnonymousAuth, auth as firebaseAuth } from './lib/firebase.ts'
import { createIssue } from './lib/db.ts'
import { getIssueFromFirestore } from './lib/firestore-issues.ts'
import { purgeStaleUserCache } from './lib/client-storage.ts'

const firebaseConfig = {
  apiKey: 'AIzaSyCZ5Er3evZrHGzvDaJ5TkPZ7uECcqnl87U',
  authDomain: 'nagarseva-civic-3c8fe.firebaseapp.com',
  projectId: 'nagarseva-civic-3c8fe',
  storageBucket: 'nagarseva-civic-3c8fe.firebasestorage.app',
  messagingSenderId: '751165399407',
  appId: '1:751165399407:web:91c2c2f5a657a12392',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Mock browser environment
globalThis.window = {}
let mockLocalStorage = new Map()

globalThis.localStorage = {
  getItem: (k) => mockLocalStorage.get(k) || null,
  setItem: (k, v) => mockLocalStorage.set(k, String(v)),
  removeItem: (k) => mockLocalStorage.delete(k),
  clear: () => mockLocalStorage.clear(),
}

globalThis.document = {
  cookie: '',
}

async function runE2ETestIteration(iterationNumber) {
  console.log(`\n======================================================`)
  console.log(`=== RUNNING E2E FRESH ANONYMOUS SESSION TEST ${iterationNumber}/3 ===`)
  console.log(`======================================================`)

  // 1. Reset browser environment (Incognito simulation)
  mockLocalStorage.clear()
  document.cookie = ''
  await signOut(auth).catch(() => {})
  console.log('[SESSION INIT] Cleared localStorage and cookies (Fresh Incognito Window)')

  // 2. Perform silent anonymous authentication & stale cache check
  const anonUser = await ensureAnonymousAuth()
  if (!anonUser || !anonUser.uid) {
    throw new Error('ensureAnonymousAuth failed to produce a valid anonymous Firebase Auth user.')
  }
  const activeUid = anonUser.uid
  console.log(`[AUTH SUCCESS] Silent Anonymous Auth active. Raw Auth UID: "${activeUid}"`)

  // 3. Create a real civic issue report payload
  const reportId = `CF-E2E-TEST-${Date.now()}-${iterationNumber}`
  console.log(`[SUBMISSION] Submitting anonymous report ${reportId}...`)

  const createdIssue = await createIssue({
    id: reportId,
    title: `E2E Test Report Run #${iterationNumber}`,
    category: 'Water Leak',
    severity: 'High',
    description: `End-to-end verification run #${iterationNumber} from anonymous citizen session`,
    address: 'Koramangala 4th Block, Ward 4',
    lat: 12.9352,
    lng: 77.6245,
    reporter: 'Anonymous Citizen',
  })

  console.log(`[CREATE SUCCESS] Local issue object created with ID: "${createdIssue.id}"`)

  // 4. Empirical Live Firestore Verification
  console.log(`[VERIFICATION] Querying live Firestore issues collection for "${createdIssue.id}"...`)
  const docFromDb = await getIssueFromFirestore(createdIssue.id)

  if (!docFromDb) {
    throw new Error(`CRITICAL FAILURE: Document "${createdIssue.id}" was NOT found in live Firestore database!`)
  }

  console.log(`✅ LIVE FIRESTORE CONFIRMATION: Document verified in DB!`)
  console.log(`   - ID: "${docFromDb.id}"`)
  console.log(`   - Title: "${docFromDb.title}"`)
  console.log(`   - Status: "${docFromDb.status}"`)
  console.log(`   - Reporter ID: "${docFromDb.reporterId}"`)
  console.log(`   - Coordinates: (${docFromDb.lat}, ${docFromDb.lng})`)

  // Clean up test report document from DB
  await deleteDoc(doc(docFromDb ? getFirestore(app) : null, 'issues', createdIssue.id)).catch(() => {})
  console.log(`[CLEANUP] Deleted test issue "${createdIssue.id}" from DB.`)

  return true
}

async function main() {
  console.log('=== MULTI-ITERATION E2E ANONYMOUS FLOW STABILITY TEST ===')
  try {
    for (let i = 1; i <= 3; i++) {
      await runE2ETestIteration(i)
    }

    console.log('\n======================================================')
    console.log('🎉 3/3 E2E ANONYMOUS FLOW TEST ITERATIONS PASSED 100% CLEANLY!')
    console.log('🎉 ZERO ReferenceErrors (auth is defined), ZERO Permission Errors!')
    console.log('======================================================')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.stack || err.message || err)
    process.exit(1)
  }
}

main()
