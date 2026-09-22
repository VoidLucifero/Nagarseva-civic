'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Users } from 'lucide-react'
import { StatCounter } from '@/components/stat-counter'
import { getStats } from '@/lib/api'
import type { CivicStats } from '@/lib/types'

export function StatsBanner() {
  const [data, setData] = useState<CivicStats>({
    resolvedThisMonth: 342,
    activeReporters: 1284,
    avgResolutionDays: 4.2,
    totalOpen: 128,
  })

  useEffect(() => {
    getStats().then((res) => {
      if (res) setData(res)
    })
  }, [])

  const stats = [
    {
      icon: CheckCircle2,
      value: data.resolvedThisMonth,
      decimals: 0,
      suffix: '',
      label: 'issues resolved this month',
      tone: 'text-status-resolved',
    },
    {
      icon: Users,
      value: data.activeReporters,
      decimals: 0,
      suffix: '',
      label: 'active reporters in your city',
      tone: 'text-primary',
    },
    {
      icon: Clock,
      value: data.avgResolutionDays,
      decimals: 1,
      suffix: ' days',
      label: 'average resolution time',
      tone: 'text-accent',
    },
  ]

  return (
    <section className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-primary-foreground/15 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 py-7 sm:justify-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/10">
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="font-mono text-3xl font-bold tracking-tight">
                <StatCounter value={s.value} decimals={s.decimals} />
                {s.suffix}
              </p>
              <p className="text-sm text-primary-foreground/75">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
