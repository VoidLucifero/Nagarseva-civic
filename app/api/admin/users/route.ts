import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/db'

import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('civic_user')
    let isOfficial = false

    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value)
        if (parsed.role === 'official' || parsed.phone === '9999999999') {
          isOfficial = true
        }
      } catch {}
    }

    if (!isOfficial) {
      return NextResponse.json(
        { error: 'Unauthorized. Municipal Officer access required.' },
        { status: 403 },
      )
    }

    const users = await getAllUsers()
    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registered citizens.' },
      { status: 500 },
    )
  }
}
