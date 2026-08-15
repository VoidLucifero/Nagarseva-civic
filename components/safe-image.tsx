'use client'

import { useState } from 'react'

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Pothole: '/issues/pothole.png',
  Roads: '/issues/pothole.png',
  Streetlight: '/issues/streetlight.png',
  Electricity: '/issues/streetlight.png',
  'Street Light': '/issues/streetlight.png',
  Graffiti: '/issues/graffiti.png',
  'Trash & Litter': '/issues/trash.png',
  Sanitation: '/issues/trash.png',
  Drainage: '/issues/trash.png',
  'Water Leak': '/issues/water-leak.png',
  Water: '/issues/water-leak.png',
  Sidewalk: '/issues/pothole.png',
  Parks: '/issues/trash.png',
  Signage: '/issues/streetlight.png',
  Other: '/issues/pothole.png',
}

export function getCategoryFallback(category?: string): string {
  if (!category) return '/issues/pothole.png'
  const matchedKey = Object.keys(CATEGORY_FALLBACK_IMAGES).find(
    (key) => key.toLowerCase() === category.toLowerCase() || category.toLowerCase().includes(key.toLowerCase())
  )
  return matchedKey ? CATEGORY_FALLBACK_IMAGES[matchedKey] : '/issues/pothole.png'
}

export function SafeImage({
  src,
  alt,
  category,
  className,
  style,
}: {
  src?: string | null
  alt: string
  category?: string
  className?: string
  style?: React.CSSProperties
}) {
  const fallback = getCategoryFallback(category)

  // Fallback if src is missing, blob, data URI, placeholder, or invalid
  const isInvalidSrc =
    !src ||
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    src.includes('placeholder') ||
    src.includes('undefined') ||
    src.trim() === ''

  const initialSrc = isInvalidSrc ? fallback : src

  const [imgSrc, setImgSrc] = useState(initialSrc)

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback)
          e.currentTarget.src = fallback
        }
      }}
    />
  )
}
