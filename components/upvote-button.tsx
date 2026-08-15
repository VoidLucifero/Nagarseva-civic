'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  getUpvotedIds,
  setUpvotedState,
  updateLocalIssueUpvotes,
} from '@/lib/client-storage'

export function UpvoteButton({
  issueId,
  count = 1,
  size = 'default',
  className,
}: {
  issueId?: string
  count?: number
  size?: 'default' | 'sm'
  className?: string
}) {
  const [voted, setVoted] = useState(false)
  const [currentCount, setCurrentCount] = useState(count)

  useEffect(() => {
    setCurrentCount(count)
    if (issueId) {
      const upvotedMap = getUpvotedIds()
      if (upvotedMap[issueId]) {
        setVoted(true)
      }
    }
  }, [issueId, count])

  async function handleToggleUpvote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const newVotedState = !voted
    const delta = newVotedState ? 1 : -1
    const newCount = Math.max(1, currentCount + delta)

    setVoted(newVotedState)
    setCurrentCount(newCount)

    if (issueId) {
      setUpvotedState(issueId, newVotedState)
      updateLocalIssueUpvotes(issueId, delta)

      try {
        await fetch(`/api/reports/${issueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upvotes: newCount }),
        })
      } catch {}
    }

    toast.success(newVotedState ? 'Upvote noted and saved!' : 'Upvote removed.')
  }

  return (
    <button
      type="button"
      aria-pressed={voted}
      aria-label={voted ? 'Remove upvote' : 'Upvote this issue'}
      onClick={handleToggleUpvote}
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-lg border font-semibold transition-all',
        size === 'sm' ? 'h-11 w-9 text-xs' : 'h-14 w-11 text-sm',
        voted
          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary',
        className,
      )}
    >
      <ChevronUp className={cn(size === 'sm' ? 'size-4' : 'size-5', voted && 'text-primary')} />
      <span className="tabular-nums">{currentCount}</span>
    </button>
  )
}
