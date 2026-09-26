import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'

const targetDocIds = [
  '89ioU6OcQ3PyykFBUelYtMw1aEA3',
  'GRlKWEQPwggO5dmwmGlCc6rNS3H3',
  'fb4Cfw8GyJYP8ScFWKbkbVBEArB2',
  'user-1786758305938',
  'hbklCQC7W3fCWko7to2LKA0h7103',
]

export async function POST() {
  const results: Record<string, string> = {}
  try {
    const adminDb = getAdminFirestore()
    for (const id of targetDocIds) {
      try {
        await adminDb.collection('users').doc(id).delete()
        results[id] = 'DELETED'
      } catch (err: any) {
        results[id] = `ERROR: ${err.message || err}`
      }
    }
    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 })
  }
}
