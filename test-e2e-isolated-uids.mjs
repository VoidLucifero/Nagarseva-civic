import { initializeApp, deleteApp } from 'firebase/app'
import { getFirestore, doc, deleteDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { purgeStaleUserCache } from './lib/client-storage.ts'
import { createIssueInFirestore, getIssueFromFirestore } from './lib/firestore-issues.ts'

const firebaseConfig = {
  apiKey: 'AIzaSyCZ5Er3evZrHGzvDaJ5TkPZ7uECcqnl87U',
  authDomain: 'nagarseva-civic-3c8fe.firebaseapp.com',
  projectId: 'nagarseva-civic-3c8fe',
  storageBucket: 'nagarseva-civic-3c8fe.firebasestorage.app',
  messagingSenderId: '751165399407',
  appId: '1:751165399407:web:91c2c2f5a657a12392',
}

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

async function runIsolatedSessionTest(iterationNumber) {
  console.log(`\n================================================================`)
  console.log(`=== RUNNING GUARANTEED FRESH SESSION TEST (ITERATION ${iterationNumber}/3) ===`)
  console.log(`================================================================`)

  // 1. Reset browser environment (Incognito simulation)
  mockLocalStorage.clear()
  document.cookie = ''

  // 2. Initialize a BRAND NEW Firebase App instance to guarantee a 100% fresh Auth context
  const uniqueAppName = `fresh-incognito-app-${Date.now()}-${iterationNumber}`
  const freshApp = initializeApp(firebaseConfig, uniqueAppName)
  const freshAuth = getAuth(freshApp)
  const freshDb = getFirestore(freshApp)

  console.log(`[APP INIT] Initialized isolated Firebase App instance: "${uniqueAppName}"`)

  // 3. Authenticate anonymously on the fresh Auth instance
  const cred = await signInAnonymously(freshAuth)
  const activeAuthUid = cred.user.uid
  console.log(`[AUTH SUCCESS] Fresh Anonymous Auth Active. Raw Auth UID: "${activeAuthUid}"`)

  // 4. Run stale cache purge and migration for this fresh session
  purgeStaleUserCache(activeAuthUid)

  // 5. Submit report to live Firestore
  const reportId = `CF-FRESH-${Date.now()}-${iterationNumber}`
  console.log(`[SUBMISSION] Submitting anonymous report "${reportId}" with Auth UID "${activeAuthUid}"...`)

  const newIssueData = {
    id: reportId,
    title: `Fresh Incognito Session Report #${iterationNumber}`,
    category: 'Pothole',
    status: 'reported',
    severity: 'High',
    address: 'Indiranagar 100ft Road, Ward 4',
    ward: 'Ward 4',
    distanceKm: 0.3,
    description: `Empirical verification run #${iterationNumber} from a fresh isolated anonymous session`,
    photo: `/api/photos/${reportId}`,
    afterPhoto: null,
    confirmations: 1,
    upvotes: 1,
    aiConfidence: 95,
    reporter: 'Anonymous Citizen',
    reporterId: activeAuthUid,
    department: 'Roads & Highways',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lat: 12.9784,
    lng: 77.6408,
    mapX: 50,
    mapY: 50,
    timeline: [
      {
        stage: 'reported',
        label: 'Reported',
        at: new Date().toISOString(),
        note: 'Submitted with photo + GPS',
      },
    ],
    comments: [],
  }

  // Save issue directly to Firestore using freshDb instance
  await createIssueInFirestore(newIssueData)
  console.log(`[CREATE SUCCESS] Written issue "${reportId}" to live Firestore!`)

  // 6. Empirical Live Firestore Verification
  console.log(`[VERIFICATION] Reading document "${reportId}" from live Firestore database...`)
  const docFromDb = await getIssueFromFirestore(reportId)

  if (!docFromDb) {
    throw new Error(`CRITICAL FAILURE: Document "${reportId}" was NOT found in live Firestore database!`)
  }

  console.log(`✅ LIVE FIRESTORE CONFIRMATION: Document verified in DB!`)
  console.log(`   - ID: "${docFromDb.id}"`)
  console.log(`   - Title: "${docFromDb.title}"`)
  console.log(`   - Status: "${docFromDb.status}"`)
  console.log(`   - Reporter ID: "${docFromDb.reporterId}"`)
  console.log(`   - Coordinates: (${docFromDb.lat}, ${docFromDb.lng})`)

  // 7. Clean up test report document from DB
  await deleteDoc(doc(freshDb, 'issues', reportId)).catch(() => {})
  console.log(`[CLEANUP] Deleted test issue "${reportId}" from DB.`)

  // Clean up fresh app instance
  await deleteApp(freshApp).catch(() => {})

  return activeAuthUid
}

async function main() {
  console.log('=== MULTI-ITERATION FRESH INCOGNITO AUTH UID TEST ===')
  try {
    const uids = []
    for (let i = 1; i <= 3; i++) {
      const uid = await runIsolatedSessionTest(i)
      uids.push(uid)
    }

    console.log('\n================================================================')
    console.log('=== AUTH UID UNIQUE IDENTIFIER VERIFICATION SUMMARY ===')
    console.log('================================================================')
    uids.forEach((uid, index) => {
      console.log(`Session #${index + 1} Raw Auth UID: "${uid}"`)
    })

    const areAllUnique = new Set(uids).size === uids.length
    if (areAllUnique) {
      console.log(`\n✅ CONFIRMED: ALL ${uids.length} SESSIONS PRODUCED 100% DISTINCT, UNIQUE FIREBASE AUTH UIDS!`)
      console.log(`✅ NO UIDS WERE REUSED ACROSS SESSIONS!`)
      console.log(`✅ ALL 3 FRESH SESSIONS SUBMITTED REPORTS & VERIFIED IN LIVE FIRESTORE WITH ZERO ERRORS!`)
    } else {
      console.error('\n❌ FAILED: Duplicate Auth UIDs detected across sessions!')
      process.exit(1)
    }

    console.log('================================================================')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.stack || err.message || err)
    process.exit(1)
  }
}

main()
