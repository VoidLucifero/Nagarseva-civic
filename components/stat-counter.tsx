'use client'

import { useEffect, useRef, useState } from 'react'

export function StatCounter({
  value,
  decimals = 0,
  duration = 1200,
  className,
}: {
  value: number
  decimals?: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(value)

  useEffect(() => {
    // If value updates from async fetch, update display state directly
    if (prevValue.current !== value) {
      prevValue.current = value
      setDisplay(value)
    }
  }, [value])

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let animationFrameId: number

    const run = () => {
      const start = performance.now()
      const startVal = 0
      const targetVal = value

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(startVal + (targetVal - startVal) * eased)
        if (t < 1) {
          animationFrameId = requestAnimationFrame(tick)
        } else {
          setDisplay(targetVal)
        }
      }
      animationFrameId = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(node)

    return () => {
      observer.disconnect()
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [duration, value])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}
