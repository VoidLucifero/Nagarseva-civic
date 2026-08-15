'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function IssueResolutionActions({ issueId }: { issueId: string }) {
  const [choice, setChoice] = useState<'pending' | 'confirmed' | 'reopened'>('pending')

  if (choice === 'confirmed') {
    return (
      <div className="rounded-xl border border-status-resolved/30 bg-status-resolved/10 px-3 py-2.5 text-sm text-status-resolved">
        Thanks for confirming — you earned +25 Civic points.
      </div>
    )
  }

  if (choice === 'reopened') {
    return (
      <div className="rounded-xl border border-status-pending/30 bg-status-pending/10 px-3 py-2.5 text-sm text-status-pending">
        Reopened — we've flagged this back to the department.
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">Is this actually fixed?</p>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          onClick={() => {
            setChoice('confirmed')
            toast.success('Marked as confirmed resolved', { description: issueId })
          }}
          className="h-9 flex-1 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <CheckCircle2 className="size-4" />
          Confirm resolved
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setChoice('reopened')
            toast('Issue reopened', { description: issueId })
          }}
          className="h-9 flex-1 gap-1.5"
        >
          <RotateCcw className="size-4" />
          Reopen
        </Button>
      </div>
    </div>
  )
}
