import { NextResponse } from 'next/server'
import { loginOrRegisterUser } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, code } = body

    const cleanPhone = (phone || '').trim().replace(/\D/g, '')
    const inputCode = (code || '').trim()

    const expectedCode = (process.env.OFFICER_ACCESS_CODE || '200723').trim()

    if (!cleanPhone || cleanPhone.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number.' },
        { status: 400 },
      )
    }

    // Verify phone matches seeded officer account
    if (cleanPhone !== '9999999999') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Phone number is not registered to a Municipal Officer.' },
        { status: 401 },
      )
    }

    // Verify access code server-side ONLY (never passed or checked on client)
    if (!inputCode || inputCode !== expectedCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid officer access code. Access denied.' },
        { status: 401 },
      )
    }

    const user = await loginOrRegisterUser('Municipal Officer', cleanPhone, 'official')

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
