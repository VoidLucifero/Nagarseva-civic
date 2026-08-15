import type { Issue, IssuePhase, IssueStatus, Severity } from './types'

export const STATUS_ORDER: IssueStatus[] = ['reported', 'assigned', 'in-progress', 'resolved']

export const STATUS_LABEL: Record<IssueStatus, string> = {
  reported: 'Reported',
  assigned: 'Assigned',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
}

/** Maps a lifecycle status to a visual phase (pin/badge color). */
export function phaseOf(status: IssueStatus): IssuePhase {
  if (status === 'resolved') return 'resolved'
  if (status === 'in-progress') return 'progress'
  return 'pending'
}

export const PHASE_LABEL: Record<IssuePhase, string> = {
  pending: 'Pending',
  progress: 'In Progress',
  resolved: 'Resolved',
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  Low: 10,
  Medium: 25,
  High: 50,
}

const NOW = new Date('2026-08-13T12:00:00Z').getTime()

export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((NOW - new Date(iso).getTime()) / 86_400_000))
}

export function hoursSince(iso: string): number {
  return Math.max(0, Math.floor((NOW - new Date(iso).getTime()) / 3_600_000))
}

/**
 * Priority score used to triage issues in the admin dashboard.
 * Combines severity, community demand (upvotes + confirmations), and age.
 */
export function priorityScore(issue: Issue): number {
  if (issue.status === 'resolved') return 0
  const severity = SEVERITY_WEIGHT[issue.severity]
  const demand = issue.upvotes + issue.confirmations * 2
  const age = daysSince(issue.createdAt) * 4
  return Math.round(severity + demand + age)
}

export interface SlaState {
  overdue: boolean
  hoursLeft: number
  hoursOverBy: number
  pct: number
}

export function slaState(issue: Issue): SlaState {
  const elapsed = hoursSince(issue.createdAt)
  const hoursLeft = issue.slaHours - elapsed
  const resolved = issue.status === 'resolved'
  return {
    overdue: !resolved && hoursLeft < 0,
    hoursLeft: Math.max(0, hoursLeft),
    hoursOverBy: Math.max(0, -hoursLeft),
    pct: Math.min(100, Math.round((elapsed / issue.slaHours) * 100)),
  }
}

export function formatRelative(iso: string): string {
  const diff = NOW - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function resolutionDays(issue: Issue): number | null {
  if (issue.status !== 'resolved') return null
  const resolvedEntry = issue.timeline.find((t) => t.stage === 'resolved')
  if (!resolvedEntry?.at) return null
  return Math.max(
    1,
    Math.round(
      (new Date(resolvedEntry.at).getTime() - new Date(issue.createdAt).getTime()) / 86_400_000,
    ),
  )
}
