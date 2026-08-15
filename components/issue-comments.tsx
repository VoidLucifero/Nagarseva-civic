'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatRelative } from '@/lib/civic'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Comment } from '@/lib/types'

const ROLE_STYLES: Record<Comment['role'], string> = {
  citizen: 'bg-secondary text-foreground',
  department: 'bg-primary/10 text-primary',
  system: 'bg-muted text-muted-foreground',
}

export function IssueComments({ initialComments }: { initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments)
  const [draft, setDraft] = useState('')

  function post() {
    if (!draft.trim()) return
    const comment: Comment = {
      id: `local-${Date.now()}`,
      author: 'You',
      role: 'citizen',
      at: new Date().toISOString(),
      text: draft.trim(),
    }
    setComments((prev) => [...prev, comment])
    setDraft('')
    toast.success('Comment added')
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">
        Updates &amp; comments {comments.length > 0 && <span className="text-muted-foreground">({comments.length})</span>}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No comments yet — be the first to add context.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${ROLE_STYLES[c.role]}`}
              >
                {c.author.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(c.at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-foreground text-pretty">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-start gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an update — extra detail helps departments prioritize."
          rows={2}
          className="flex-1"
        />
        <Button type="button" size="icon" onClick={post} disabled={!draft.trim()} className="mt-0.5 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
