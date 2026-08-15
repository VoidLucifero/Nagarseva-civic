'use client'

import { useState, useEffect } from 'react'
import { DissolvingIntro } from '@/components/dissolving-intro'

export function SplashProvider() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('nagarseva_splash_seen')
    if (!hasSeenSplash) {
      setShowSplash(true)
      sessionStorage.setItem('nagarseva_splash_seen', 'true')
    }
  }, [])

  if (!showSplash) return null

  return <DissolvingIntro onComplete={() => setShowSplash(false)} />
}
