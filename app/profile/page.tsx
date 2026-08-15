'use client'

import { useEffect, useState } from 'react'
import { Bell, FileText, MapPin, Trophy, LogIn, Phone } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IssueCard } from '@/components/issue-card'
import { EmptyState } from '@/components/empty-state'
import { AuthModal } from '@/components/auth-modal'
import { formatRelative } from '@/lib/civic'
import { getIssues, getNotifications, getReporters } from '@/lib/api'
import type { BadgeTier, Issue } from '@/lib/types'
import type { UserRecord } from '@/lib/db'

const TIER_THRESHOLDS: Record<BadgeTier, number> = { Bronze: 0, Silver: 1000, Gold: 2000 }
const TIER_NEXT: Record<BadgeTier, BadgeTier | null> = { Bronze: 'Silver', Silver: 'Gold', Gold: null }
const TIER_STYLES: Record<BadgeTier, string> = {
  Bronze: 'bg-[oklch(0.7_0.09_55)] text-white',
  Silver: 'bg-[oklch(0.75_0.01_240)] text-[oklch(0.25_0.01_240)]',
  Gold: 'bg-[oklch(0.8_0.15_85)] text-[oklch(0.3_0.08_85)]',
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [reporters, setReporters] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()
        const currentUser = meData?.user ?? null
        setUser(currentUser)

        const [allIssues, allReporters, allNotifs] = await Promise.all([
          getIssues(),
          getReporters(),
          getNotifications(),
        ])

        if (currentUser) {
          setIssues(allIssues.filter((i) => i.reporterId === currentUser.id || i.reporter === currentUser.name))
        } else {
          setIssues(allIssues.slice(0, 2))
        }
        setReporters(allReporters)
        setNotifications(allNotifs)
      } catch (err) {
        console.error('Failed to load profile data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const nextTier = user ? TIER_NEXT[user.tier] : 'Silver'
  const progressPct = user && nextTier
    ? Math.min(
        100,
        Math.round(
          ((user.points - TIER_THRESHOLDS[user.tier]) /
            (TIER_THRESHOLDS[nextTier] - TIER_THRESHOLDS[user.tier])) *
            100,
        ),
      )
    : 30

  const ranked = [...reporters].sort((a, b) => b.points - a.points)

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {/* Unauthenticated state banner */}
          {!loading && !user && (
            <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-primary/5 p-6">
              <div>
                <h2 className="text-base font-bold text-foreground">Sign in with Full Name &amp; Phone</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sign in to view your points, badges, and track your submitted civic reports.
                </p>
              </div>
              <Button onClick={() => setAuthModalOpen(true)} className="gap-2 bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
                <LogIn className="size-4" />
                Sign In / Register
              </Button>
            </Card>
          )}

          {/* Profile header */}
          <Card className="flex-row flex-wrap items-center gap-5 p-6">
            <Avatar size="lg" className="size-16">
              <AvatarFallback className="text-lg font-semibold">
                {user ? user.initials : 'GU'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {user ? user.name : 'Guest User'}
                </h1>
                <Badge className={TIER_STYLES[user ? user.tier : 'Bronze']}>
                  {user ? user.tier : 'Bronze'} Reporter
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-2">
                {user ? (
                  <>
                    <span>{user.reports} reports</span> · <span>{user.resolved} resolved</span> · <span className="inline-flex items-center gap-1"><Phone className="size-3" /> {user.phone}</span>
                  </>
                ) : (
                  'Not signed in · Register in 5 seconds with phone number'
                )}
              </p>
              <div className="mt-3 max-w-xs">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{(user ? user.points : 50).toLocaleString()} pts</span>
                  <span>{nextTier ? `${nextTier} at ${TIER_THRESHOLDS[nextTier].toLocaleString()}` : 'Top tier'}</span>
                </div>
                <Progress value={progressPct} className="mt-1" />
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* My reports */}
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <FileText className="size-4 text-primary" />
                My reports
              </h2>
              <div className="mt-3 space-y-3">
                {issues.length === 0 ? (
                  <EmptyState
                    icon={MapPin}
                    title="No reports yet"
                    description="Issues you report will show up here so you can track their progress."
                  />
                ) : (
                  issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Notifications */}
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Bell className="size-4 text-primary" />
                  Notifications
                </h2>
                <div className="mt-3 space-y-2">
                  {notifications.map((n) => (
                    <Card key={n.id} className={`p-3.5 ${n.unread ? 'ring-1 ring-primary/30' : ''}`}>
                      <div className="flex items-start gap-2">
                        {n.unread && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground text-pretty">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{n.body}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(n.at)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Trophy className="size-4 text-primary" />
                  Leaderboard
                </h2>
                <Card className="mt-3 divide-y divide-border p-0">
                  {ranked.map((r, i) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 px-4 py-2.5 ${user && r.id === user.id ? 'bg-primary/5' : ''}`}
                    >
                      <span className="w-4 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                      <Avatar size="sm">
                        <AvatarFallback className="text-[10px]">{r.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">
                          {r.name}
                          {user && r.id === user.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {r.points.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </div>
  )
}
