import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPhoto } from '@/lib/photos'
import { getCategoryFallback } from '@/components/safe-image'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const photoRecord = getPhoto(id)

    if (photoRecord && photoRecord.data) {
      const dataStr = photoRecord.data

      // If it's a base64 Data URI
      if (dataStr.startsWith('data:image/')) {
        const matches = dataStr.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
          const contentType = matches[1]
          const buffer = Buffer.from(matches[2], 'base64')
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
      }

      // If it's a relative path e.g. /issues/pothole.png
      if (dataStr.startsWith('/')) {
        const publicFilePath = path.join(process.cwd(), 'public', dataStr)
        if (fs.existsSync(publicFilePath)) {
          const fileBuffer = fs.readFileSync(publicFilePath)
          const ext = path.extname(publicFilePath).toLowerCase()
          const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
          return new NextResponse(fileBuffer, {
            headers: { 'Content-Type': mime },
          })
        }
      }
    }

    // Fallback image if custom photo is missing or invalid
    const fallbackPath = getCategoryFallback(photoRecord?.category)
    const staticFilePath = path.join(process.cwd(), 'public', fallbackPath)
    if (fs.existsSync(staticFilePath)) {
      const fallbackBuffer = fs.readFileSync(staticFilePath)
      return new NextResponse(fallbackBuffer, {
        headers: { 'Content-Type': 'image/png' },
      })
    }

    return NextResponse.redirect(new URL('/issues/pothole.png', request.url))
  } catch {
    return NextResponse.redirect(new URL('/issues/pothole.png', request.url))
  }
}
