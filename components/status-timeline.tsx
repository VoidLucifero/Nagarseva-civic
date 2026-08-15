import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, STATUS_ORDER } from '@/lib/civic'
import type { Issue } from '@/lib/types'

function currentIndex(status: Issue['status']) {
  return STATUS_ORDER.indexOf(status)
}

/** Compact horizontal progress rail used on issue cards. */
export function TimelineRail({ issue, className }: { issue: Issue; className?: string }) {
  const active = currentIndex(issue.status)
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Status: ${issue.status}`}>
      {STATUS_ORDER.map((stage, i) => {
        const reached = i <= active
        return (
          <div key={stage} className="flex flex-1 items-center gap-1">
            <span
              className={cn(
                'size-2 shrink-0 rounded-full transition-colors',
                reached ? 'bg-primary' : 'bg-border',
              )}
            />
            {i < STATUS_ORDER.length - 1 && (
              <span className={cn('h-0.5 flex-1 rounded-full', i < active ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Detailed vertical timeline with timestamps for the issue detail page. */
export function StatusTimeline({ issue }: { issue: Issue }) {
  const active = currentIndex(issue.status)
  return (
    <ol className="relative space-y-6">
      {issue.timeline.map((entry, i) => {
        const reached = i <= active
        const isCurrent = i === active
        const isLast = i === issue.timeline.length - 1
        return (
          <li key={entry.stage} className="relative flex gap-4">
            {!isLast && (
              <span
                className={cn(
                  'absolute top-7 left-3.5 h-[calc(100%+0.25rem)] w-0.5 -translate-x-1/2',
                  i < active ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                reached
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
                isCurrent && 'ring-4 ring-primary/15',
              )}
            >
              {reached ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <div className="pb-1">
              <p className={cn('text-sm font-semibold', reached ? 'text-foreground' : 'text-muted-foreground')}>
                {entry.label}
              </p>
              {entry.at ? (
                <p className="font-mono text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
              ) : (
                <p className="text-xs text-muted-foreground/70">Pending</p>
              )}
              {entry.note && <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
