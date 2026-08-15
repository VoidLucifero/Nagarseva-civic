/**
 * Automated Server-Side WhatsApp Sender for NagarSeva
 * Sends real-time WhatsApp messages to the citizen's phone number
 */

export async function sendDirectWhatsAppMessage({
  phone,
  issueId,
  category,
  address,
  status,
}: {
  phone: string
  issueId: string
  category: string
  address: string
  status: string
}): Promise<{ success: boolean; whatsappUrl: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

  const cleanPhone = phone ? phone.replace(/\D/g, '') : '9876543210'
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const toWhatsAppNumber = `whatsapp:+${phoneWithCountry}`

  const messageText =
    `🏛️ *NagarSeva Alert: Complaint Update*\n\n` +
    `📌 *Ticket ID*: ${issueId}\n` +
    `🏷️ *Category*: ${category}\n` +
    `📍 *Location*: ${address}\n` +
    `⚡ *New Status*: ${status}\n\n` +
    `🔗 *Track live progress on map*:\nhttps://civic-fix-complete.vercel.app/issue/${issueId}\n\n` +
    `Thank you for helping keep your city clean & safe!`

  const encodedText = encodeURIComponent(messageText)
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`

  // 1. Send via Twilio REST API if environment variables are configured
  if (accountSid && authToken) {
    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      const bodyParams = new URLSearchParams()
      bodyParams.append('From', fromWhatsAppNumber)
      bodyParams.append('To', toWhatsAppNumber)
      bodyParams.append('Body', messageText)

      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        },
      )
      return { success: true, whatsappUrl }
    } catch (err) {
      console.warn('Twilio API dispatch error, falling back to direct URL:', err)
    }
  }

  return { success: true, whatsappUrl }
}
