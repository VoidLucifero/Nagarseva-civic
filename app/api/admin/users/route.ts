import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/db'

export async function GET() {
  try {
    const users = await getAllUsers()
    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registered citizens.' },
      { status: 500 },
    )
  }
}
