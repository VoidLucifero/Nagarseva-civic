'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Clock, ListChecks } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CategoryIcon } from '@/components/category-icon'
import { StatusBadge } from '@/components/status-badge'
import { getIssues, getStats } from '@/lib/api'
import { formatRelative, phaseOf, priorityScore, slaState, STATUS_LABEL, STATUS_ORDER } from '@/lib/civic'
import { CATEGORIES, DEPARTMENTS } from '@/lib/mock-data'
import type { CivicStats, Issue, IssueStatus } from '@/lib/types'

type StatusFilter = 'all' | 'overdue' | IssueStatus

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'reported', label: 'Reported' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function AdminPage() {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [stats, setStats] = useState<CivicStats | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    getIssues().then(setIssues)
    getStats().then(setStats)
  }, [])

  const overdueCount = useMemo(
    () => (issues ?? []).filter((i) => slaState(i).overdue).length,
    [issues],
  )

  const categoryData = useMemo(() => {
    if (!issues) return []
    return CATEGORIES.map((cat) => ({
      category: cat.length > 10 ? cat.slice(0, 9) + '…' : cat,
      count: issues.filter((i) => i.category === cat && i.status !== 'resolved').length,
    })).filter((d) => d.count > 0)
  }, [issues])

  const statusData = useMemo(() => {
    if (!issues) return []
    return STATUS_ORDER.map((s) => ({
      status: STATUS_LABEL[s],
      count: issues.filter((i) => i.status === s).length,
    }))
  }, [issues])

  const rows = useMemo(() => {
    if (!issues) return []
    const filteredIssues = issues.filter((i) => {
      if (filter === 'all') return true
      if (filter === 'overdue') return slaState(i).overdue
      return i.status === filter
    })
    return filteredIssues
      .map((issue) => ({ issue, score: priorityScore(issue), sla: slaState(issue) }))
      .sort((a, b) => b.score - a.score)
  }, [issues, filter])

  async function updateStatus(id: string, status: IssueStatus) {
    setIssues((prev) => prev?.map((i) => (i.id === id ? { ...i, status } : i)) ?? prev)
    try {
      await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success(`${id} marked as ${STATUS_LABEL[status]}`)
    } catch {
      toast.error('Failed to update status on server')
    }
  }

  async function updateDepartment(id: string, department: string) {
    setIssues((prev) => prev?.map((i) => (i.id === id ? { ...i, department } : i)) ?? prev)
    try {
      await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department }),
      })
      toast.success(`${id} assigned to ${department}`)
    } catch {
      toast.error('Failed to update department on server')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Triage by priority, track SLAs, and route issues to the right department.
          </p>

          {/* Stat cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ListChecks} label="Open issues" value={stats?.totalOpen} accent="text-primary" />
            <StatCard icon={AlertTriangle} label="Overdue" value={issues ? overdueCount : undefined} accent="text-status-pending" />
            <StatCard icon={CheckCircle2} label="Resolved this month" value={stats?.resolvedThisMonth} accent="text-status-resolved" />
            <StatCard icon={Clock} label="Avg. resolution (days)" value={stats?.avgResolutionDays} accent="text-status-progress-foreground" />
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Open issues by category</h2>
              <div className="mt-3 h-56">
                {issues ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={24} />
                      <RechartsTooltip
                        cursor={{ fill: 'var(--secondary)' }}
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      />
                      <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full" />
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Issues by status</h2>
              <div className="mt-3 h-56">
                {issues ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={80} />
                      <RechartsTooltip
                        cursor={{ fill: 'var(--secondary)' }}
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      />
                      <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full" />
                )}
              </div>
            </Card>
          </div>

          {/* Filter tabs */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`h-8 rounded-lg border px-3 text-xs font-medium transition-colors ${
                  filter === tab.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
                {tab.value === 'overdue' && issues && overdueCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-status-pending px-1.5 text-[10px] font-semibold text-status-pending-foreground">
                    {overdueCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <Card className="mt-3 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!issues &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {issues && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No issues match this filter.
                    </TableCell>
                  </TableRow>
                )}

                {rows.map(({ issue, score, sla }) => (
                  <TableRow key={issue.id}>
                    <TableCell className="max-w-[260px] whitespace-normal">
                      <Link href={`/issue/${issue.id}`} className="flex items-center gap-2 hover:text-primary">
                        <CategoryIcon category={issue.category} iconClassName="size-3.5" className="size-7 shrink-0" />
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium">{issue.title}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{issue.id}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{issue.ward}</TableCell>
                    <TableCell>
                      <select
                        value={issue.status}
                        onChange={(e) => updateStatus(issue.id, e.target.value as IssueStatus)}
                        className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={issue.department}
                        onChange={(e) => updateDepartment(issue.id, e.target.value)}
                        className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{score}</TableCell>
                    <TableCell>
                      {issue.status === 'resolved' ? (
                        <Badge variant="outline" className="border-status-resolved/40 text-status-resolved">
                          Closed
                        </Badge>
                      ) : sla.overdue ? (
                        <Badge className="bg-status-pending text-status-pending-foreground">
                          {Math.round(sla.hoursOverBy)}h overdue
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{Math.round(sla.hoursLeft)}h left</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatRelative(issue.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof ListChecks
  label: string
  value: number | undefined
  accent: string
}) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary ${accent}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-1 h-5 w-10" />
        ) : (
          <p className="text-lg font-bold text-foreground">{value}</p>
        )}
      </div>
    </Card>
  )
}
