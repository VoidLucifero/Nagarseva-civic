import { NextResponse } from 'next/server'
import { createIssue } from '@/lib/db'
import { savePhoto } from '@/lib/photos'

/**
 * WhatsApp Webhook API Route for NagarSeva
 * Connects Twilio / Meta WhatsApp Business Cloud API to NagarSeva DB
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fromNumber = (formData.get('From') as string) || 'whatsapp:+919000000000'
    const bodyText = (formData.get('Body') as string) || ''
    const mediaUrl = (formData.get('MediaUrl0') as string) || ''
    const latitude = formData.get('Latitude') as string
    const longitude = formData.get('Longitude') as string

    // 1. Process Geolocation or Address
    let address = 'Reported via WhatsApp'
    const latNum = latitude ? parseFloat(latitude) : 28.6139
    const lngNum = longitude ? parseFloat(longitude) : 77.209

    if (latitude && longitude) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        )
        const geoData = await geoRes.json()
        if (geoData?.display_name) {
          address = geoData.display_name.split(',').slice(0, 3).join(', ')
        }
      } catch {}
    }

    // 2. Determine Category from text or default
    let category = 'Pothole'
    const textLower = bodyText.toLowerCase()
    if (textLower.includes('water') || textLower.includes('leak')) category = 'Water Leak'
    else if (textLower.includes('light') || textLower.includes('lamp') || textLower.includes('street'))
      category = 'Streetlight'
    else if (textLower.includes('trash') || textLower.includes('garbage') || textLower.includes('waste'))
      category = 'Trash & Litter'

    // 3. Create Issue Ticket in NagarSeva DB
    const newIssue = createIssue({
      category: category as any,
      description: bodyText || `Civic issue reported via WhatsApp by ${fromNumber}`,
      address,
      lat: latNum,
      lng: lngNum,
      photo: mediaUrl || '/issues/pothole.png',
      reporter: `WhatsApp Citizen (${fromNumber.slice(-4)})`,
    })

    // If a custom image URL was uploaded in WhatsApp message, save to photos manager
    if (mediaUrl) {
      savePhoto(newIssue.id, mediaUrl, category)
    }

    // 4. Construct TwiML XML Reply for WhatsApp
    const replyText =
      `🏛️ *NagarSeva — Complaint Registered!*\n\n` +
      `📌 *Ticket ID*: ${newIssue.id}\n` +
      `📍 *Location*: ${address}\n` +
      `🏷️ *Category*: ${category}\n` +
      `⚡ *Status*: Submitted ➔ Routed to Department\n\n` +
      `🔗 *Track live on map*:\nhttps://civic-fix-complete.vercel.app/issue/${newIssue.id}\n\n` +
      `Thank you for helping keep your city clean & safe!`

    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${replyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`

    return new NextResponse(xmlResponse, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process WhatsApp webhook.' },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'NagarSeva WhatsApp Webhook Endpoint is ready.',
    webhookUrl: 'https://civic-fix-complete.vercel.app/api/whatsapp/webhook',
  })
}
