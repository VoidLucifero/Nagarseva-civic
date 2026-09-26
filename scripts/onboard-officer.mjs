import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
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

async function onboardOfficer() {
  const args = process.argv.slice(2)
  const phone = args[0]?.trim().replace(/\D/g, '')
  const name = args[1]?.trim() || 'Municipal Officer'

  if (!phone || phone.length < 6) {
    console.error('Usage: node scripts/onboard-officer.mjs <phone_number> [officer_name]')
    console.error('Example: node scripts/onboard-officer.mjs 9876543210 "Officer Rajesh Sharma"')
    process.exit(1)
  }

  // Authenticate session so request.auth != null
  try {
    await signInAnonymously(auth)
  } catch (err) {
    console.warn('Auth warning:', err.message)
  }

  const userId = `user-officer-${phone}`
  const userRef = doc(db, 'users', userId)

  const officerRecord = {
    id: userId,
    name: name,
    phone: phone,
    initials: name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
    tier: 'Gold',
    points: 5000,
    reports: 0,
    resolved: 15,
    role: 'official',
    updatedAt: new Date().toISOString(),
  }

  console.log(`Onboarding Municipal Officer in Firestore...`)
  console.log(`Phone: ${phone}`)
  console.log(`Name:  ${name}`)
  console.log(`Role:  official`)

  try {
    await setDoc(userRef, officerRecord, { merge: true })
    console.log(`\n✅ Municipal Officer successfully authorized in Firestore!`)
    console.log(`Doc ID: users/${userId}`)
    console.log(`Phone number ${phone} can now sign in at /official-dashboard using the secret OFFICER_ACCESS_CODE.`)
  } catch (err) {
    console.error(`❌ Failed to onboard officer:`, err.message)
    process.exit(1)
  }

  process.exit(0)
}

onboardOfficer()
