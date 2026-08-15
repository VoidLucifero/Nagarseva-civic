'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/civic'
import type { Issue } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { TimelineRail } from '@/components/status-timeline'
import { UpvoteButton } from '@/components/upvote-button'
import { CategoryIcon } from '@/components/category-icon'

import { SafeImage } from '@/components/safe-image'

export function IssueCard({
  issue,
  active,
  onHover,
}: {
  issue: Issue
  active?: boolean
  onHover?: (id: string | null) => void
}) {
  return (
    <Link
      href={`/issue/${issue.id}`}
      onMouseEnter={() => onHover?.(issue.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'group flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40',
        active ? 'border-primary/50 ring-2 ring-primary/15' : 'border-border',
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        <SafeImage
          src={issue.photo}
          alt={issue.title}
          category={issue.category}
          className="size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CategoryIcon category={issue.category} className="size-3.5 text-primary" />
            {issue.category}
          </span>
          <StatusBadge status={issue.status} />
        </div>

        <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">
          {issue.title}
        </h3>

        <TimelineRail issue={issue} className="my-0.5" />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {issue.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {issue.confirmations} confirmed
          </span>
          <span className="ml-auto font-mono">{formatRelative(issue.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center">
        <UpvoteButton issueId={issue.id} count={issue.upvotes} size="sm" />
      </div>
    </Link>
  )
}
