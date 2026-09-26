import { chromium } from 'playwright'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCZ5Er3evZrHGzvDaJ5TkPZ7uECcqnl87U',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'nagarseva-civic-3c8fe.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nagarseva-civic-3c8fe',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nagarseva-civic-3c8fe.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '751165399407',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:751165399407:web:91c2c2f5a657a12392',
}

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const firestore = getFirestore(firebaseApp)

async function run() {
  console.log('--- STARTING PLAYWRIGHT END-TO-END BROWSER TEST ---')
  const browser = await chromium.launch({ headless: true })

  // Create two separate fresh browser contexts to verify 2 fresh sessions
  for (let runIndex = 1; runIndex <= 2; runIndex++) {
    console.log(`\n=== RUN #${runIndex}: Fresh Browser Context ===`)
    const context = await browser.newContext()
    const page = await context.newPage()

    let submittedPayload = null
    let apiResponseStatus = null
    let apiResponseBody = null
    let criticalConsoleErrors = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore non-fatal asset 404s (e.g. favicon, missing sample images)
        if (!text.includes('favicon') && !text.includes('404')) {
          criticalConsoleErrors.push(text)
          console.error(`[Browser Console Error] ${text}`)
        } else {
          console.log(`[Browser Ignored Minor Error] ${text}`)
        }
      }
    })

    page.on('request', req => {
      if (req.url().includes('/api/reports') && req.method() === 'POST') {
        try {
          submittedPayload = JSON.parse(req.postData())
          console.log('[Network] Captured POST /api/reports payload:')
          console.log(JSON.stringify(submittedPayload, null, 2))
        } catch {}
      }
    })

    page.on('response', async res => {
      if (res.url().includes('/api/reports') && res.request().method() === 'POST') {
        apiResponseStatus = res.status()
        try {
          apiResponseBody = await res.json()
          console.log(`[Network] POST /api/reports response status ${apiResponseStatus}:`)
          console.log(JSON.stringify(apiResponseBody, null, 2))
        } catch {}
      }
    })

    console.log('[Playwright] Navigating to http://localhost:3000/report ...')
    await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle' })

    console.log('[Playwright] Clicking "Try sample photo" ...')
    await page.click('button:has-text("Try sample photo")')

    console.log('[Playwright] Waiting for details step to load ...')
    await page.waitForSelector('textarea#description', { timeout: 10000 })

    console.log('[Playwright] Typing description ...')
    await page.fill('textarea#description', `Playwright end-to-end automated verification run #${runIndex}`)

    // Check if duplicate detection prompt appeared
    const diffButton = page.locator('button:has-text("No, it\'s different")')
    if (await diffButton.isVisible()) {
      console.log('[Playwright] Duplicate prompt detected — clicking "No, it\'s different" ...')
      await diffButton.click()
    }

    console.log('[Playwright] Clicking "Submit report" ...')
    await page.click('button:has-text("Submit report")')

    console.log('[Playwright] Waiting for success page ...')
    await page.waitForSelector('text=Report Submitted & Verified!', { timeout: 15000 })
    console.log('✓ Success screen displayed in browser!')

    if (criticalConsoleErrors.length > 0) {
      console.error('❌ Critical console errors were recorded:', criticalConsoleErrors)
      process.exit(1)
    }

    if (apiResponseStatus !== 200 || !apiResponseBody?.success) {
      console.error('❌ /api/reports failed with status:', apiResponseStatus, apiResponseBody)
      process.exit(1)
    }

    const createdIssueId = apiResponseBody.id
    console.log(`[Verification] Created Issue ID: ${createdIssueId}`)
    console.log(`[Verification] Reporter ID sent from browser payload: ${submittedPayload?.reporterId}`)

    if (!submittedPayload?.reporterId || submittedPayload.reporterId === 'u-maya' || submittedPayload.reporterId === 'Citizen' || submittedPayload.reporterId === 'anonymous-citizen') {
      console.error('❌ FAIL: reporterId in payload is missing or fallback value:', submittedPayload?.reporterId)
      process.exit(1)
    }

    console.log('[Firestore] Fetching document from live Firestore issues collection ...')
    const docRef = doc(firestore, 'issues', createdIssueId)
    const snap = await getDoc(docRef)

    if (!snap.exists()) {
      console.error(`❌ FAIL: Issue document ${createdIssueId} does not exist in live Firestore!`)
      process.exit(1)
    }

    const docData = snap.data()
    console.log('[Firestore] Live Document Data retrieved:')
    console.log(JSON.stringify({
      id: docData.id,
      reporter: docData.reporter,
      reporterId: docData.reporterId,
      category: docData.category,
      createdAt: docData.createdAt,
    }, null, 2))

    if (docData.reporterId !== submittedPayload.reporterId) {
      console.error(`❌ FAIL: Firestore reporterId (${docData.reporterId}) does not match browser payload reporterId (${submittedPayload.reporterId})`)
      process.exit(1)
    }

    if (docData.reporterId === 'u-maya' || docData.reporterId === 'Citizen' || docData.reporterId === 'anonymous-citizen') {
      console.error(`❌ FAIL: Firestore reporterId is fallback value: ${docData.reporterId}`)
      process.exit(1)
    }

    console.log(`✓ RUN #${runIndex} PASSED CLEANLY! Real Auth UID persisted in Firestore: ${docData.reporterId}`)

    await context.close()
  }

  await browser.close()
  console.log('\n==================================================')
  console.log('🎉 ALL PLAYWRIGHT END-TO-END VERIFICATION RUNS PASSED!')
  console.log('==================================================')
}

run().catch(err => {
  console.error('❌ Test failed with error:', err)
  process.exit(1)
})
