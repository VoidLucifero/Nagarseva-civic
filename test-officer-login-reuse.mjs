import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getUserByPhone, loginOrRegisterUser } from './lib/db.ts'

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

async function testOfficerLoginReuse() {
  console.log('=== OFFICER LOGIN REUSE & UNIFIED ID VERIFICATION TEST ===\n')

  const cred = await signInAnonymously(auth)
  const authUid = cred.user.uid
  console.log(`Authenticated with Firebase Auth session. Auth UID: "${authUid}"`)

  // 1. Verify lookup of existing Officer Rajesh Sharma (phone: 9876543210)
  console.log('\n[TEST 1] Logging in existing Officer Rajesh Sharma (phone: 9876543210)...')
  const existingDoc = await getUserByPhone('9876543210', 'official')
  console.log(`Found existing document for phone 9876543210: ID = "${existingDoc?.id}", Name = "${existingDoc?.name}", Role = "${existingDoc?.role}"`)

  const loggedInOfficer = await loginOrRegisterUser('Officer Rajesh Sharma', '9876543210', 'official', authUid)
  console.log(`Returned user object ID: "${loggedInOfficer.id}"`)

  if (loggedInOfficer.id === 'user-officer-9876543210') {
    console.log('✅ CONFIRMED: App correctly found and reused the EXACT existing document ID "user-officer-9876543210"!')
  } else {
    console.error(`❌ Mismatch: Expected user-officer-9876543210 but got ${loggedInOfficer.id}`)
  }

  // 2. Verify registration of a brand new officer with a new phone number
  console.log('\n[TEST 2] Registering brand new Officer with new phone number (phone: 9111122222)...')
  const newOfficerAuthUid = `officer-auth-${Date.now()}`
  const newOfficer = await loginOrRegisterUser('Officer Priya Verma', '9111122222', 'official', newOfficerAuthUid)
  console.log(`New officer registered document ID: "${newOfficer.id}"`)

  if (newOfficer.id === newOfficerAuthUid) {
    console.log('✅ CONFIRMED: Brand new officer follows the unified-ID scheme using the Auth UID!')
  }

  // Clean up test new officer
  await setDoc(doc(db, 'users', newOfficerAuthUid), { name: 'Clean' }).catch(() => {})

  console.log('\n====================================================')
  console.log('FIRESTORE USERS REUSE VERIFICATION COMPLETE')
  console.log('====================================================')
  process.exit(0)
}

testOfficerLoginReuse()
