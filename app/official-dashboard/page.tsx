'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  UserCheck,
  Loader2,
  ExternalLink,
  BarChart3,
  ListFilter,
  Users,
  AlertTriangle,
  ListChecks,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { UserRecord } from '@/lib/db'
import type { Issue, IssueStatus } from '@/lib/types'
import { mergeClientUsers, getClientUsers } from '@/lib/client-storage'
import { priorityScore, slaState } from '@/lib/civic'
import { DEPARTMENTS } from '@/lib/mock-data'

import { ShieldCheck, Lock, ArrowRight } from 'lucide-react'
import { AuthModal } from '@/components/auth-modal'

export default function OfficialDashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [registeredUsers, setRegisteredUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics'>('overview')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [deptFilter, setDeptFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Auth & Access Control state
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const isOfficial = currentUser?.role === 'official' || currentUser?.phone === '9999999999'

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (!isOfficial) return

    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIssues(data)
        else if (data?.issues) setIssues(data.issues)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        const rawUsers = data?.users || []
        const mergedUsers = mergeClientUsers(rawUsers)
        setRegisteredUsers(mergedUsers)
      })
      .catch(() => {
        setRegisteredUsers(getClientUsers())
      })
  }, [isOfficial])

  async function handleStatusUpdate(issueId: string, newStatus: IssueStatus) {
    setUpdatingId(issueId)
    try {
      const res = await fetch(`/api/reports/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
      )
      toast.success(`Complaint status updated to "${newStatus}"!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDepartmentUpdate(issueId: string, department: string) {
    setUpdatingId(issueId)
    try {
      const res = await fetch(`/api/reports/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update department')

      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, department } : i)),
      )
      toast.success(`Complaint assigned to "${department}"!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update department')
    } finally {
      setUpdatingId(null)
    }
  }

  const overdueCount = useMemo(
    () => issues.filter((i) => slaState(i).overdue).length,
    [issues],
  )

  const filtered = issues.filter((i) => {
    if (statusFilter !== 'All' && i.status !== statusFilter) return false
    if (deptFilter !== 'All' && i.department !== deptFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!i.title.toLowerCase().includes(q) && !i.id.toLowerCase().includes(q) && !i.address.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  const totalComplaints = issues.length
  const inProgressCount = issues.filter((i) => i.status === 'in-progress').length
  const assignedCount = issues.filter((i) => i.status === 'assigned').length
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length

  const departments = Array.from(new Set([...DEPARTMENTS, ...issues.map((i) => i.department).filter(Boolean)]))

  // Analytics Chart Data
  const categoryChartData = Array.from(new Set(issues.map((i) => i.category))).map((cat) => ({
    name: cat,
    count: issues.filter((i) => i.category === cat).length,
  }))

  const statusChartData = [
    { name: 'Submitted', count: issues.filter((i) => i.status === 'reported').length },
    { name: 'Acknowledged', count: assignedCount },
    { name: 'In Progress', count: inProgressCount },
    { name: 'Resolved', count: resolvedCount },
  ]

  if (authChecked && !isOfficial) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <Lock className="size-7" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Official Access Required</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The Official Dashboard is restricted to verified municipal officers and department administrators.
            </p>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left text-xs">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <ShieldCheck className="size-4" />
                Municipal Officer Credentials
              </p>
              <p className="mt-1 text-muted-foreground">
                To inspect SLA triage &amp; department controls, sign in with Officer Phone (<span className="font-mono font-bold text-foreground">9999999999</span>) and secret Access Code.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="h-10 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90 text-xs"
              >
                <ShieldCheck className="size-4" />
                Sign In as Municipal Officer
              </Button>
              <Link href="/">
                <Button variant="outline" className="h-10 w-full text-xs font-semibold">
                  Back to Citizen Home
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(u) => setCurrentUser(u)}
          initialMode="official"
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  NagarSeva — Official Municipal Dashboard
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Departmental portal for city officials to review SLA priority, assign departments, and manage complaints.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center rounded-xl bg-secondary p-1 border border-border gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ListFilter className="size-3.5" />
                Overview &amp; Complaints
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="size-3.5" />
                Registered Citizens ({registeredUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="size-3.5" />
                City Analytics
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Complaints
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-foreground tabular-nums">{totalComplaints}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  SLA Overdue
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-destructive tabular-nums">{overdueCount}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acknowledged
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <UserCheck className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-foreground tabular-nums">{assignedCount}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  In Progress
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-foreground tabular-nums">{inProgressCount}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resolved
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-foreground tabular-nums">{resolvedCount}</p>
            </div>
          </div>

          {activeTab === 'users' ? (
            /* Registered Citizens Directory View */
            <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4 bg-secondary/30">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  Registered Citizens &amp; User Accounts ({registeredUsers.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full list of citizens who signed up or logged in on the NagarSeva platform.
                </p>
              </div>
              {registeredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No citizens have registered yet. New sign ups will automatically appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-secondary/50 font-semibold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Citizen Name</th>
                        <th className="px-4 py-3">Phone Number</th>
                        <th className="px-4 py-3">Account Tier</th>
                        <th className="px-4 py-3">Civic Points</th>
                        <th className="px-4 py-3">Reports Filed</th>
                        <th className="px-4 py-3">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {registeredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {user.initials}
                            </span>
                            {user.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{user.phone}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                              {user.tier || 'Bronze'} Member
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-primary">{user.points || 0} pts</td>
                          <td className="px-4 py-3 font-mono text-foreground">{user.reports || 0}</td>
                          <td className="px-4 py-3 font-mono text-emerald-600 font-bold">{user.resolved || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'analytics' ? (
            /* City Analytics View */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Complaints by Category Breakdown
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="size-4 text-accent" />
                  Complaints Status Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}

          {/* Filter Controls & Search */}
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by Complaint ID, title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="All">All Statuses</option>
                  <option value="reported">Submitted</option>
                  <option value="assigned">Acknowledged</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table of Complaints */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No complaints match current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/50 font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Complaint Details</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">SLA Tracking</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Official Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => {
                      const sla = slaState(item)
                      const score = priorityScore(item)

                      return (
                        <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {item.id}
                            <div className="mt-0.5 text-[10px] text-muted-foreground">Prio: {score}</div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <Link
                              href={`/issue/${item.id}`}
                              className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {item.title}
                              <ExternalLink className="size-3 text-muted-foreground" />
                            </Link>
                            <p className="text-[11px] text-muted-foreground truncate">{item.address || item.ward}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.department || 'Unassigned'}
                              onChange={(e) => handleDepartmentUpdate(item.id, e.target.value)}
                              className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring font-medium"
                            >
                              {departments.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {item.status === 'resolved' ? (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
                                Closed
                              </Badge>
                            ) : sla.overdue ? (
                              <Badge className="bg-destructive text-destructive-foreground">
                                {Math.round(sla.hoursOverBy)}h overdue
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">{Math.round(sla.hoursLeft)}h left</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusUpdate(item.id, e.target.value as IssueStatus)}
                              className={`h-7 rounded-md border border-input bg-transparent px-1.5 text-xs font-bold outline-none focus-visible:border-ring ${
                                item.status === 'resolved'
                                  ? 'text-emerald-600'
                                  : item.status === 'in-progress'
                                  ? 'text-amber-600'
                                  : item.status === 'assigned'
                                  ? 'text-blue-600'
                                  : 'text-yellow-600'
                              }`}
                            >
                              <option value="reported">Submitted</option>
                              <option value="assigned">Acknowledged</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status !== 'in-progress' && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  disabled={updatingId === item.id}
                                  onClick={() => handleStatusUpdate(item.id, 'in-progress')}
                                  className="text-[10px]"
                                >
                                  In Progress
                                </Button>
                              )}
                              {item.status !== 'resolved' && (
                                <Button
                                  size="xs"
                                  disabled={updatingId === item.id}
                                  onClick={() => handleStatusUpdate(item.id, 'resolved')}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]"
                                >
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
