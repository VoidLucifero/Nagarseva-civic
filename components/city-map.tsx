'use client'

import { cn } from '@/lib/utils'
import { phaseOf } from '@/lib/civic'
import type { Issue, IssuePhase } from '@/lib/types'

const PIN_COLOR: Record<IssuePhase, string> = {
  pending: 'bg-status-pending',
  progress: 'bg-status-progress',
  resolved: 'bg-status-resolved',
}

const PIN_RING: Record<IssuePhase, string> = {
  pending: 'ring-status-pending/30',
  progress: 'ring-status-progress/30',
  resolved: 'ring-status-resolved/30',
}

/**
 * Stylized abstract city map. Coordinates are percentage-based (mapX/mapY) so
 * pins stay positioned across breakpoints. This is a placeholder surface —
 * swap for Leaflet/Mapbox with real lat/lng later.
 */
export function CityMap({
  issues,
  selectedId,
  onSelect,
  showUser = true,
  className,
}: {
  issues: Issue[]
  selectedId?: string | null
  onSelect?: (issue: Issue) => void
  showUser?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-[oklch(0.95_0.02_215)]',
        className,
      )}
    >
      {/* base blocks */}
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(oklch(0.9_0.02_215)_1px,transparent_1px),linear-gradient(90deg,oklch(0.9_0.02_215)_1px,transparent_1px)] [background-size:38px_38px]" />
      {/* major avenues */}
      <div className="absolute inset-0 [background-image:linear-gradient(oklch(0.88_0.02_215)_3px,transparent_3px),linear-gradient(90deg,oklch(0.88_0.02_215)_3px,transparent_3px)] [background-size:152px_152px]" />
      {/* park */}
      <div className="absolute left-[8%] top-[58%] h-[30%] w-[26%] rotate-3 rounded-2xl bg-[oklch(0.9_0.07_150)]" />
      {/* river */}
      <div className="absolute -right-[10%] top-0 h-[140%] w-[16%] -rotate-[24deg] bg-[oklch(0.86_0.05_230)]" />
      {/* civic block */}
      <div className="absolute left-[46%] top-[40%] h-[16%] w-[16%] rounded-lg bg-[oklch(0.92_0.03_60)]" />

      {showUser && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-primary/20" />
          <span className="relative flex size-4 items-center justify-center rounded-full border-2 border-background bg-primary shadow">
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          </span>
        </div>
      )}

      {issues.map((issue) => {
        const phase = phaseOf(issue.status)
        const selected = selectedId === issue.id
        const Comp = onSelect ? 'button' : 'div'
        return (
          <Comp
            key={issue.id}
            {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(issue) } : {})}
            title={`${issue.category} — ${issue.title}`}
            aria-label={`${issue.category}: ${issue.title}`}
            className={cn(
              'group absolute -translate-x-1/2 -translate-y-full focus:outline-none',
              onSelect && 'cursor-pointer',
            )}
            style={{ left: `${issue.mapX}%`, top: `${issue.mapY}%` }}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full rounded-bl-none border-2 border-background shadow-md ring-4 transition-transform',
                PIN_COLOR[phase],
                PIN_RING[phase],
                selected ? 'scale-125 z-20' : 'group-hover:scale-110',
              )}
            >
              <span className="size-1.5 rounded-full bg-background/90" />
            </span>
            {issue.severity === 'High' && phase === 'pending' && (
              <span className={cn('absolute -top-1 left-1/2 -z-10 -m-1 size-6 -translate-x-1/2 animate-ping rounded-full', PIN_COLOR[phase], 'opacity-40')} />
            )}
          </Comp>
        )
      })}
    </div>
  )
}

export function MapLegend({ className }: { className?: string }) {
  const items: { phase: IssuePhase; label: string }[] = [
    { phase: 'pending', label: 'Pending' },
    { phase: 'progress', label: 'In progress' },
    { phase: 'resolved', label: 'Resolved' },
  ]
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)}>
      {items.map((item) => (
        <span key={item.phase} className="inline-flex items-center gap-1.5">
          <span className={cn('size-2.5 rounded-full', PIN_COLOR[item.phase])} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
