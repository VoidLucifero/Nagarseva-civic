import { NextResponse } from 'next/server'
import { loginOrRegisterUser } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone } = body

    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400 },
      )
    }

    const user = await loginOrRegisterUser(name || 'Citizen', phone)

    // Create response with user payload and auth cookie
    const response = NextResponse.json({ success: true, user })
    response.cookies.set('civic_user', JSON.stringify(user), {
      httpOnly: false, // accessible to client JS for state sync
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to authenticate user.' },
      { status: 500 },
    )
  }
}
