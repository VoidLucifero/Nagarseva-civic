import { NextResponse } from 'next/server'
import { getUserByPhone, loginOrRegisterUser } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, code } = body

    const cleanPhone = (phone || '').trim().replace(/\D/g, '')
    const inputCode = (code || '').trim()

    const expectedCode = process.env.OFFICER_ACCESS_CODE ? process.env.OFFICER_ACCESS_CODE.trim() : ''

    if (!expectedCode) {
      return NextResponse.json(
        { success: false, error: 'Officer authentication is disabled: OFFICER_ACCESS_CODE environment variable is not set on the server.' },
        { status: 500 },
      )
    }

    if (!cleanPhone || cleanPhone.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number.' },
        { status: 400 },
      )
    }

    // 1. Verify access code server-side ONLY (never passed or checked on client)
    if (!inputCode || inputCode !== expectedCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid officer access code. Access denied.' },
        { status: 401 },
      )
    }

    // 2. Self-Service Officer Onboarding / Login:
    // If user exists, log them in & ensure role: 'official' is set.
    // If user does not exist, automatically register them with role: 'official'.
    const existingUser = await getUserByPhone(cleanPhone)
    const officialName = existingUser?.name || (cleanPhone === '9999999999' ? 'Municipal Officer' : 'Municipal Officer')

    const user = await loginOrRegisterUser(officialName, cleanPhone, 'official')

    const response = NextResponse.json({ success: true, user })
    response.cookies.set('civic_user', JSON.stringify(user), {
      httpOnly: false, // accessible to client JS for state sync
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Officer authentication failed.' },
      { status: 500 },
    )
  }
}
