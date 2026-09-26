import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/db'

export async function GET() {
  try {
    const users = await getAllUsers()
    // Sort users by points descending
    const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0))
    return NextResponse.json({ success: true, users: sorted })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 },
    )
  }
}
