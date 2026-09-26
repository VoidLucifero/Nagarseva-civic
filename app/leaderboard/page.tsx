'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Award,
  Medal,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  Shield,
  Star,
  Zap,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { Issue, UserRecord, CitizenTitle } from '@/lib/types'

const OBTAINABLE_TITLES: CitizenTitle[] = [
  {
    id: 'pothole-patrol',
    name: 'Pothole Patrol Master',
    icon: '🛣️',
    description: 'Report 5 or more Road / Pothole issues to protect city drivers and pedestrians.',
    category: 'Roads',
    requiredCount: 5,
    currentCount: 3,
    unlocked: false,
  },
  {
    id: 'night-guardian',
    name: 'Night Guardian',
    icon: '💡',
    description: 'Report 5 or more Streetlight outages to keep streets safe after dark.',
    category: 'Street Light',
    requiredCount: 5,
    currentCount: 2,
    unlocked: false,
  },
  {
    id: 'clean-stream',
    name: 'Clean Stream Sentinel',
    icon: '🌊',
    description: 'Report 5 or more Water Leak or Drainage flooding issues.',
    category: 'Water',
    requiredCount: 5,
    currentCount: 4,
    unlocked: false,
  },
  {
    id: 'sanitation-champ',
    name: 'Sanitation Champion',
    icon: '🗑️',
    description: 'Report 5 or more Garbage & Sanitation overflow issues.',
    category: 'Sanitation',
    requiredCount: 5,
    currentCount: 5,
    unlocked: true,
  },
  {
    id: 'civic-hero',
    name: 'Civic Hero',
    icon: '🎖️',
    description: 'Earn 1,000 or more Civic Points through verified reports and upvotes.',
    requiredCount: 1000,
    currentCount: 1240,
    unlocked: true,
  },
  {
    id: 'city-legend',
    name: 'City Legend',
    icon: '👑',
    description: 'Reach Rank #1 on the City Leaderboard for total resolved complaints.',
    requiredCount: 1,
    currentCount: 3,
    unlocked: false,
  },
]

interface LeaderboardUser {
  id: string
  name: string
  initials: string
  points: number
  tier: 'Bronze' | 'Silver' | 'Gold'
  reports: number
  resolved: number
  titles: string[]
}

const MOCK_LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    id: 'u-leo',
    name: 'Leo Martins',
    initials: 'LM',
    points: 2480,
    tier: 'Gold',
    reports: 63,
    resolved: 51,
    titles: ['City Legend 👑', 'Pothole Patrol Master 🛣️', 'Civic Hero 🎖️'],
  },
  {
    id: 'u-priya',
    name: 'Priya Nair',
    initials: 'PN',
    points: 1975,
    tier: 'Gold',
    reports: 48,
    resolved: 39,
    titles: ['Night Guardian 💡', 'Sanitation Champion 🗑️'],
  },
  {
    id: 'u-maya',
    name: 'Maya Chen',
    initials: 'MC',
    points: 1240,
    tier: 'Silver',
    reports: 27,
    resolved: 19,
    titles: ['Sanitation Champion 🗑️', 'Civic Hero 🎖️'],
  },
  {
    id: 'u-ana',
    name: 'Ana Gomez',
    initials: 'AG',
    points: 860,
    tier: 'Silver',
    reports: 19,
    resolved: 12,
    titles: ['Clean Stream Sentinel 🌊'],
  },
  {
    id: 'u-sam',
    name: 'Sam Reyes',
    initials: 'SR',
    points: 430,
    tier: 'Bronze',
    reports: 11,
    resolved: 6,
    titles: ['Pothole Patrol Master 🛣️'],
  },
]

function deriveUserTitles(user: UserRecord): string[] {
  const titles: string[] = []
  if (user.points >= 1000) titles.push('Civic Hero 🎖️')
  if (user.reports >= 5) titles.push('Pothole Patrol Master 🛣️')
  if (user.role === 'official') titles.push('City Guardian 🛡️')
  if (user.resolved >= 5) titles.push('Sanitation Champion 🗑️')
  if (titles.length === 0) titles.push('Active Citizen 🌱')
  return titles
}

export default function LeaderboardPage() {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null)
  const [userIssues, setUserIssues] = useState<Issue[]>([])
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(MOCK_LEADERBOARD_USERS)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(() => {})

    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUserIssues(data)
        else if (data?.issues) setUserIssues(data.issues)
      })
      .catch(() => {})

    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.users) && data.users.length > 0) {
          const mapped: LeaderboardUser[] = data.users.map((u: UserRecord) => ({
            id: u.id,
            name: u.name || 'Citizen',
            initials: u.initials || (u.name ? u.name.slice(0, 2).toUpperCase() : 'CZ'),
            points: u.points || 0,
            tier: u.tier || 'Bronze',
            reports: u.reports || 0,
            resolved: u.resolved || 0,
            titles: deriveUserTitles(u),
          }))
          setLeaderboardUsers(mapped)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 text-primary-foreground shadow-xl sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Trophy className="size-3.5 text-yellow-300" />
              NagarSeva Rewards & Honor Titles
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Obtainable Titles &amp; City Leaderboard
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/80 leading-relaxed">
              Earn specialized citizen titles by reporting local issues. Top reporters unlock badges, gain civic points, and lead the city board!
            </p>
          </div>

          <div className="absolute -right-8 -top-8 size-48 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Section 1: Obtainable Titles Collection */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Award className="size-5 text-accent" />
                Obtainable Citizen Titles
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete community reporting milestones to unlock honor titles on your profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OBTAINABLE_TITLES.map((title) => {
              const pct = Math.min(100, Math.round((title.currentCount / title.requiredCount) * 100))

              return (
                <div
                  key={title.id}
                  className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
                    title.unlocked
                      ? 'border-accent/40 bg-card shadow-md shadow-accent/5 ring-1 ring-accent/20'
                      : 'border-border bg-card/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-2xl shadow-inner">
                        {title.icon}
                      </span>
                      <div>
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {title.name}
                          {title.unlocked && (
                            <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-500/20" />
                          )}
                        </h3>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {title.category || 'Special Milestone'}
                        </span>
                      </div>
                    </div>

                    {!title.unlocked && (
                      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Lock className="size-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {title.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono text-foreground font-semibold">
                        {title.currentCount} / {title.requiredCount} ({pct}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 2: City Top Reporters Leaderboard */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="size-5 text-yellow-500" />
                Top Community Reporters
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active citizens keeping the city clean, safe, and accountable.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border">
              {leaderboardUsers.map((reporter, idx) => {
                const rank = idx + 1
                const isTop3 = rank <= 3

                return (
                  <div
                    key={reporter.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Medal */}
                      <div className="flex size-9 items-center justify-center font-extrabold text-sm shrink-0">
                        {rank === 1 ? (
                          <span className="flex size-8 items-center justify-center rounded-full bg-yellow-400 text-yellow-950 font-bold text-xs shadow-md">
                            🥇 #1
                          </span>
                        ) : rank === 2 ? (
                          <span className="flex size-8 items-center justify-center rounded-full bg-slate-300 text-slate-900 font-bold text-xs shadow-sm">
                            🥈 #2
                          </span>
                        ) : rank === 3 ? (
                          <span className="flex size-8 items-center justify-center rounded-full bg-amber-600 text-amber-50 font-bold text-xs shadow-sm">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">#{rank}</span>
                        )}
                      </div>

                      {/* User Info & Badges */}
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border">
                          <AvatarFallback className="font-bold text-primary bg-primary/10">
                            {reporter.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm">{reporter.name}</h3>
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                              {reporter.tier} Tier
                            </span>
                          </div>

                          {/* Unlocked Titles */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {reporter.titles.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="flex items-center gap-6 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <div className="text-center sm:text-right">
                        <p className="font-mono text-sm font-extrabold text-foreground tabular-nums">
                          {reporter.points}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Civic Points</p>
                      </div>

                      <div className="text-center sm:text-right">
                        <p className="font-mono text-sm font-extrabold text-emerald-600 tabular-nums">
                          {reporter.resolved} / {reporter.reports}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Resolved</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
