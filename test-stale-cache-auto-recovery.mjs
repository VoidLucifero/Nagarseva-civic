import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { purgeStaleUserCache } from './lib/client-storage.ts'
import { createIssue } from './lib/db.ts'

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
const db = getFirestore(app)

// Simulate browser environment
globalThis.window = {}
const localStorageStore = new Map()

globalThis.localStorage = {
  getItem: (key) => localStorageStore.get(key) || null,
  setItem: (key, val) => localStorageStore.set(key, String(val)),
  removeItem: (key) => localStorageStore.delete(key),
  clear: () => localStorageStore.clear(),
}

globalThis.document = {
  cookie: '',
}

async function testStaleCacheAutoRecovery() {
  console.log('=== STALE CACHE AUTO-RECOVERY & PERMISSION TEST ===\n')

  // 1. Simulate stale pre-unification user ID in localStorage and cookie
  const staleId = 'user-1786758305938'
  const staleUser = {
    id: staleId,
    name: 'Sanjay',
    phone: '7337480492',
    role: 'citizen',
    tier: 'Bronze',
    points: 150,
    reports: 3,
  }

  localStorage.setItem('nagar_seva_registered_users', JSON.stringify([staleUser]))
  document.cookie = `civic_user=${encodeURIComponent(JSON.stringify(staleUser))}`

  console.log(`[SETUP] Simulated stale localStorage key "nagar_seva_registered_users": ID = "${staleId}"`)
  console.log(`[SETUP] Simulated stale cookie "civic_user": ID = "${staleId}"`)

  // 2. Authenticate Firebase Auth session
  const cred = await signInAnonymously(auth)
  const activeAuthUid = cred.user.uid
  console.log(`\n[STEP 1] Active Firebase Auth UID: "${activeAuthUid}"`)

  // 3. Trigger auto-purge & migration
  console.log('\n[STEP 2] Executing purgeStaleUserCache(activeAuthUid)...')
  purgeStaleUserCache(activeAuthUid)

  const updatedRawStorage = localStorage.getItem('nagar_seva_registered_users')
  const updatedStorage = updatedRawStorage ? JSON.parse(updatedRawStorage) : []
  console.log(`[RESULT] Updated localStorage "nagar_seva_registered_users":`, JSON.stringify(updatedStorage))
  console.log(`[RESULT] Updated document.cookie "civic_user":`, document.cookie)

  const staleIdRemaining = updatedStorage.some((u) => u.id === staleId)
  if (!staleIdRemaining) {
    console.log(`✅ CONFIRMED: Stale pre-unification ID "${staleId}" was successfully purged!`)
  } else {
    console.error(`❌ FAILED: Stale ID "${staleId}" still exists in localStorage!`)
  }

  // 4. Test report creation with auto-recovered identity
  console.log('\n[STEP 3] Testing report submission with auto-recovered identity...')
  try {
    const issue = await createIssue({
      title: 'Stale Cache Auto Recovery Test Report',
      category: 'Pothole',
      description: 'Verifying report creation auto-recovers without permission errors',
      address: 'Indiranagar, Ward 4',
      reporter: 'Sanjay',
      reporterId: activeAuthUid,
      lat: 12.9716,
      lng: 77.5946,
    })

    console.log(`✅ REPORT CREATION SUCCEEDED! Created issue ID: "${issue.id}"`)
    console.log(`✅ No permission-denied errors occurred!`)
  } catch (err) {
    console.error(`❌ REPORT CREATION FAILED:`, err.message || err)
    process.exit(1)
  }

  console.log('\n====================================================')
  console.log('STALE CACHE AUTO-RECOVERY VERIFICATION COMPLETE')
  console.log('====================================================')
  process.exit(0)
}

testStaleCacheAutoRecovery().catch(console.error)
