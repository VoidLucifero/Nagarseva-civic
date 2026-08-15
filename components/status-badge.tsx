import { cn } from '@/lib/utils'
import { phaseOf, STATUS_LABEL } from '@/lib/civic'
import type { IssuePhase, IssueStatus, Severity } from '@/lib/types'

const PHASE_STYLES: Record<IssuePhase, string> = {
  pending: 'bg-status-pending/12 text-status-pending',
  progress: 'bg-status-progress/20 text-status-progress-foreground',
  resolved: 'bg-status-resolved/15 text-status-resolved',
}

const PHASE_DOT: Record<IssuePhase, string> = {
  pending: 'bg-status-pending',
  progress: 'bg-status-progress',
  resolved: 'bg-status-resolved',
}

export function StatusBadge({
  status,
  className,
}: {
  status: IssueStatus
  className?: string
}) {
  const phase = phaseOf(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        PHASE_STYLES[phase],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', PHASE_DOT[phase])} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  )
}

const SEVERITY_STYLES: Record<Severity, string> = {
  Low: 'border-border text-muted-foreground',
  Medium: 'border-status-progress/40 text-status-progress-foreground bg-status-progress/10',
  High: 'border-status-pending/40 text-status-pending bg-status-pending/10',
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        SEVERITY_STYLES[severity],
        className,
      )}
    >
      {severity} severity
    </span>
  )
}
