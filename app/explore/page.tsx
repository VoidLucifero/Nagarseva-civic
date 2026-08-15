'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapPin, SearchX } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CityMap, MapLegend } from '@/components/city-map'
import { IssueCard } from '@/components/issue-card'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getIssues } from '@/lib/api'
import { CATEGORIES, CURRENT_USER_LOCATION } from '@/lib/mock-data'
import { phaseOf } from '@/lib/civic'
import type { Issue, IssuePhase } from '@/lib/types'

const PHASE_FILTERS: { value: IssuePhase | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

const WARDS = [
  { value: 'all', label: 'All Wards' },
  { value: 'Ward 1', label: 'Ward 1 · Downtown' },
  { value: 'Ward 2', label: 'Ward 2 · Uptown' },
  { value: 'Ward 3', label: 'Ward 3 · Riverside' },
  { value: 'Ward 4', label: 'Ward 4 · Eastgate' },
]

import { mergeClientIssues } from '@/lib/client-storage'

export default function ExplorePage() {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [category, setCategory] = useState<string>('all')
  const [ward, setWard] = useState<string>('all')
  const [phase, setPhase] = useState<IssuePhase | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    getIssues().then((fetched) => {
      const merged = mergeClientIssues(fetched || [])
      setIssues(merged)
    })
  }, [])

  const filtered = useMemo(() => {
    if (!issues) return []
    return issues
      .filter((issue) => category === 'all' || issue.category === category)
      .filter((issue) => ward === 'all' || issue.ward.includes(ward))
      .filter((issue) => phase === 'all' || phaseOf(issue.status) === phase)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [issues, category, ward, phase])

  const selected = filtered.find((i) => i.id === selectedId) ?? null

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-border bg-card/50">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Explore issues
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              Near {CURRENT_USER_LOCATION.label}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {WARDS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1.5">
                {PHASE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setPhase(f.value)}
                    className={`h-8 rounded-lg border px-3 text-xs font-medium transition-colors ${
                      phase === f.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="ml-auto text-xs text-muted-foreground">
                {issues ? `${filtered.length} issue${filtered.length === 1 ? '' : 's'}` : 'Loading…'}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            {issues ? (
              <CityMap
                issues={filtered}
                selectedId={selectedId ?? hoveredId}
                onSelect={(issue) => setSelectedId(issue.id)}
                className="aspect-[4/3] w-full lg:aspect-square"
              />
            ) : (
              <Skeleton className="aspect-[4/3] w-full rounded-xl lg:aspect-square" />
            )}
            <MapLegend className="px-1" />

            {selected && (
              <div className="hidden lg:block">
                <IssueCard issue={selected} active />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {!issues &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}

            {issues && filtered.length === 0 && (
              <EmptyState
                icon={SearchX}
                title="No issues match those filters"
                description="Try a different category or status — or be the first to report one."
              />
            )}

            {issues &&
              filtered.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  active={issue.id === selectedId}
                  onHover={setHoveredId}
                />
              ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
