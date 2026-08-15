import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createIssue, getAllIssues } from '@/lib/db'
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp-sender'

export async function GET() {
  const issues = await getAllIssues()
  return NextResponse.json({ issues })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let userPhone = body.phone || '9876543210'

    // Check logged in user cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('civic_user')
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value)
        if (parsed.name && !body.reporter) {
          body.reporter = parsed.name
          body.reporterId = parsed.id
        }
        if (parsed.phone) {
          userPhone = parsed.phone
        }
      } catch {}
    }

    const issue = await createIssue(body)

    // Trigger automated WhatsApp notification
    const { whatsappUrl } = await sendDirectWhatsAppMessage({
      phone: userPhone,
      issueId: issue.id,
      category: issue.category,
      address: issue.address,
      status: 'Reported ➔ Routed to Department',
    })

    return NextResponse.json({ success: true, issue, id: issue.id, whatsappUrl })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create report.' },
      { status: 500 },
    )
  }
}
