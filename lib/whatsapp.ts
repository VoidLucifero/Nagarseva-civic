/**
 * WhatsApp Messaging & Deep Link Utility for NagarSeva
 */

export function generateWhatsAppShareLink(issue: {
  id: string
  category: string
  address: string
  status?: string
  phone?: string
}): string {
  const text =
    `🏛️ *NagarSeva — Complaint Update Alert*\n\n` +
    `📌 *Ticket ID*: ${issue.id}\n` +
    `🏷️ *Category*: ${issue.category}\n` +
    `📍 *Location*: ${issue.address}\n` +
    `⚡ *Status*: ${issue.status || 'Submitted ➔ Assigned to Department'}\n\n` +
    `🔗 *Track live progress on map*:\nhttps://civic-fix-complete.vercel.app/issue/${issue.id}\n\n` +
    `Thank you for helping keep your city clean & safe!`

  const encodedText = encodeURIComponent(text)

  if (issue.phone) {
    const cleanPhone = issue.phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    return `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`
}
