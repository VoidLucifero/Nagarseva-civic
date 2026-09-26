import { NextResponse } from 'next/server'
import { loginOrRegisterUser } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, authUid } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Please enter your full name.' },
        { status: 400 },
      )
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number (at least 6 digits).' },
        { status: 400 },
      )
    }

    const user = await loginOrRegisterUser(name, phone, undefined, authUid)

    const response = NextResponse.json({ success: true, user })
    response.cookies.set('civic_user', JSON.stringify(user), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to register account.' },
      { status: 500 },
    )
  }
}
