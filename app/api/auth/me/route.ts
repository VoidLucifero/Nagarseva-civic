import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/db'

export async function GET() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('civic_user')

  if (!userCookie?.value) {
    return NextResponse.json({ user: null })
  }

  try {
    const parsed = JSON.parse(userCookie.value)
    const freshUser = (await getUserById(parsed.id)) || parsed
    return NextResponse.json({ user: freshUser })
  } catch {
    return NextResponse.json({ user: null })
  }
}
