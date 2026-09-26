import { initializeApp } from 'firebase/app'
import { getFirestore, doc, deleteDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

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

const targetDocIds = [
  '89ioU6OcQ3PyykFBUelYtMw1aEA3',
  'GRlKWEQPwggO5dmwmGlCc6rNS3H3',
  'fb4Cfw8GyJYP8ScFWKbkbVBEArB2',
  'user-1786758305938',
  'hbklCQC7W3fCWko7to2LKA0h7103',
]

async function cleanupAsOfficial() {
  console.log('=== CLEANING UP TEST USER DOCS AS OFFICIAL ===\n')

  const cred = await signInAnonymously(auth)
  const uid = cred.user.uid
  console.log(`Authenticated with Firebase Auth session. Auth UID: "${uid}"`)

  const loginRes = await fetch('https://civic-fix-complete.vercel.app/api/auth/officer-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', code: '200723', authUid: uid }),
  })
  const loginData = await loginRes.json()
  console.log('Officer Login API Response:', loginData)

  for (const id of targetDocIds) {
    try {
      await deleteDoc(doc(db, 'users', id))
      console.log(`✅ Successfully deleted document: "${id}"`)
    } catch (err) {
      console.error(`❌ Delete rejected for document "${id}":`, err.message || err)
    }
  }

  process.exit(0)
}

cleanupAsOfficial().catch(console.error)
