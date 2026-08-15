import { NextResponse } from 'next/server'
import { updateIssue, getUserById } from '@/lib/db'
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp-sender'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await updateIssue(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Retrieve reporter's phone number if available
    let reporterPhone = '9876543210'
    if (updated.reporterId) {
      const reporter = await getUserById(updated.reporterId)
      if (reporter?.phone) {
        reporterPhone = reporter.phone
      }
    }

    // Send real-time WhatsApp status notification
    const { whatsappUrl } = await sendDirectWhatsAppMessage({
      phone: reporterPhone,
      issueId: updated.id,
      category: updated.category,
      address: updated.address,
      status: updated.status,
    })

    return NextResponse.json({ success: true, issue: updated, whatsappUrl })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update issue' },
      { status: 500 },
    )
  }
}
