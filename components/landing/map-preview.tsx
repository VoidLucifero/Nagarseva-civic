'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { CityMap, MapLegend } from '@/components/city-map'
import { MOCK_ISSUES, MOCK_STATS } from '@/lib/mock-data'
import { getIssues } from '@/lib/api'

export function MapPreview() {
  const [openCount, setOpenCount] = useState<number>(MOCK_STATS.totalOpen)

  useEffect(() => {
    getIssues().then((issues) => {
      if (issues && issues.length > 0) {
        const count = issues.filter((i) => i.status !== 'resolved').length
        setOpenCount(count > 0 ? count : issues.length)
      }
    })
  }, [])

  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Live map</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {openCount} open issues near you
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Every pin is a real report with a status you can follow. Yellow is reported, blue is acknowledged, amber is in progress, green is resolved.
            </p>
          </div>
          <Link
            href="/explore"
            className={cn(buttonVariants({ variant: 'default' }), 'h-11 gap-1.5 px-5 font-semibold')}
          >
            Open full map
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8">
          <CityMap issues={MOCK_ISSUES} className="h-[320px] w-full sm:h-[420px]" />
          <MapLegend className="mt-4" />
        </div>
      </div>
    </section>
  )
}
