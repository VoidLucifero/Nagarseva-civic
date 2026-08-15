'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ShieldCheck, CheckCircle } from 'lucide-react'
import { CivicMark } from '@/components/civic-mark'

export function DissolvingIntro({
  userName,
  onComplete,
  autoPlay = true,
}: {
  userName?: string
  onComplete?: () => void
  autoPlay?: boolean
}) {
  const [stage, setStage] = useState<'appear' | 'glow' | 'dissolve' | 'hidden'>('appear')

  useEffect(() => {
    if (!autoPlay) return

    // Stage 1: Appear (0ms)
    const glowTimer = setTimeout(() => {
      setStage('glow')
    }, 800)

    // Stage 2: Dissolve particles (2200ms)
    const dissolveTimer = setTimeout(() => {
      setStage('dissolve')
    }, 2400)

    // Stage 3: Hide complete (3200ms)
    const hideTimer = setTimeout(() => {
      setStage('hidden')
      if (onComplete) onComplete()
    }, 3200)

    return () => {
      clearTimeout(glowTimer)
      clearTimeout(dissolveTimer)
      clearTimeout(hideTimer)
    }
  }, [autoPlay, onComplete])

  if (stage === 'hidden') return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-1000 ${
        stage === 'dissolve'
          ? 'opacity-0 backdrop-blur-3xl scale-105 pointer-events-none'
          : 'opacity-100 backdrop-blur-md'
      }`}
    >
      {/* Background Particles / Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-accent/20 blur-[90px]" />
      </div>

      {/* Main Dissolving Logo Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Civic Logo Mark */}
        <div
          className={`flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent shadow-2xl transition-all duration-700 ${
            stage === 'appear'
              ? 'scale-75 opacity-0 translate-y-4'
              : stage === 'glow'
              ? 'scale-110 opacity-100 ring-8 ring-primary/30 shadow-primary/50'
              : 'scale-90 opacity-0 blur-md translate-y-[-10px]'
          }`}
        >
          <CivicMark className="size-10 text-white" />
        </div>

        {/* Brand Name: NAGAR SEVA with Dissolve Animation */}
        <h1
          className={`mt-6 font-extrabold tracking-tighter text-4xl sm:text-6xl transition-all duration-1000 ${
            stage === 'appear'
              ? 'opacity-0 tracking-widest blur-sm translate-y-2'
              : stage === 'glow'
              ? 'opacity-100 tracking-normal blur-none text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-foreground to-accent drop-shadow-[0_0_35px_rgba(28,90,107,0.8)]'
              : 'opacity-0 tracking-widest blur-xl scale-125 text-white'
          }`}
        >
          NAGAR<span className="text-accent">SEVA</span>
        </h1>

        {/* Subtitle / User Welcome */}
        <p
          className={`mt-3 text-xs sm:text-sm font-semibold tracking-wide text-slate-300 transition-all duration-700 delay-150 ${
            stage === 'appear'
              ? 'opacity-0 translate-y-2'
              : stage === 'glow'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 blur-md tracking-wider'
          }`}
        >
          {userName ? (
            <span className="flex items-center gap-1.5 justify-center text-emerald-400">
              <CheckCircle className="size-4 text-emerald-400" />
              Welcome back, <strong className="text-white">{userName}</strong>! Dissolving into portal...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 justify-center text-slate-400">
              <Sparkles className="size-4 text-accent" />
              Empowering Citizen Voice · Connecting Municipal Care
            </span>
          )}
        </p>

        {/* Floating Dissolve Particles */}
        <div className="mt-8 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span className="size-2 rounded-full bg-accent animate-ping delay-150" />
          <span className="size-2 rounded-full bg-emerald-400 animate-ping delay-300" />
        </div>
      </div>
    </div>
  )
}
