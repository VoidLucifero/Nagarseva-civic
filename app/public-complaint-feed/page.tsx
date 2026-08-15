'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  ThumbsUp,
  MessageSquare,
  ChevronRight,
  Clock,
  MapPin,
  CirclePlus,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Issue, IssueStatus } from '@/lib/types'

const CATEGORY_ITEMS: { id: string; label: string; icon: string }[] = [
  { id: 'All', label: 'All', icon: '📋' },
  { id: 'Roads', label: 'Roads', icon: '🛣️' },
  { id: 'Water', label: 'Water', icon: '💧' },
  { id: 'Sanitation', label: 'Sanitation', icon: '🗑️' },
  { id: 'Electricity', label: 'Electricity', icon: '⚡' },
  { id: 'Parks', label: 'Parks', icon: '🌳' },
  { id: 'Drainage', label: 'Drainage', icon: '🌊' },
  { id: 'Street Light', label: 'Street Light', icon: '💡' },
  { id: 'Other', label: 'Other', icon: '📌' },
]

const STATUS_ITEMS: { id: string; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'reported', label: 'Submitted' },
  { id: 'assigned', label: 'Acknowledged' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
]

const SORT_ITEMS: { id: string; label: string }[] = [
  { id: 'upvoted', label: 'Most Upvoted' },
  { id: 'newest', label: 'Newest First' },
  { id: 'discussed', label: 'Most Discussed' },
]

function getCategoryIcon(cat: string): string {
  const match = CATEGORY_ITEMS.find((c) => c.label.toLowerCase() === cat.toLowerCase())
  if (match) return match.icon
  if (cat.toLowerCase().includes('pothole') || cat.toLowerCase().includes('sidewalk')) return '🛣️'
  if (cat.toLowerCase().includes('light')) return '💡'
  if (cat.toLowerCase().includes('trash')) return '🗑️'
  if (cat.toLowerCase().includes('leak')) return '💧'
  return '📌'
}

function getStatusBadge(status: IssueStatus) {
  switch (status) {
    case 'reported':
      return <span className="inline-flex items-center rounded-full font-medium text-[11px] px-2.5 py-0.5 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">Submitted</span>
    case 'assigned':
      return <span className="inline-flex items-center rounded-full font-medium text-[11px] px-2.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400">Acknowledged</span>
    case 'in-progress':
      return <span className="inline-flex items-center rounded-full font-medium text-[11px] px-2.5 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400">In Progress</span>
    case 'resolved':
      return <span className="inline-flex items-center rounded-full font-medium text-[11px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Resolved</span>
    default:
      return <span className="inline-flex items-center rounded-full font-medium text-[11px] px-2.5 py-0.5 bg-secondary text-foreground">{status}</span>
  }
}

import { mergeClientIssues, getClientIssues } from '@/lib/client-storage'
import { SafeImage } from '@/components/safe-image'

export default function PublicComplaintFeedPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortBy, setSortBy] = useState('upvoted')
  const [searchQuery, setSearchQuery] = useState('')
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.issues || []
        const merged = mergeClientIssues(raw)
        setIssues(merged)
      })
      .catch(() => {
        setIssues(getClientIssues())
      })
      .finally(() => setLoading(false))
  }, [])

  function handleUpvote(e: React.MouseEvent, issueId: string) {
    e.preventDefault()
    e.stopPropagation()
    const isUpvoted = !!upvotedIds[issueId]
    const delta = isUpvoted ? -1 : 1
    const newUpvoted = !isUpvoted

    setUpvotedIds((prev) => ({ ...prev, [issueId]: newUpvoted }))
    setUpvotedState(issueId, newUpvoted)

    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === issueId) {
          const newCount = Math.max(1, i.upvotes + delta)
          updateLocalIssueUpvotes(issueId, delta)
          fetch(`/api/reports/${issueId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upvotes: newCount }),
          }).catch(() => {})
          return { ...i, upvotes: newCount }
        }
        return i
      }),
    )
    toast.success(newUpvoted ? 'Upvote noted and saved!' : 'Upvote removed.')
  }

  const filteredIssues = issues
    .filter((issue) => {
      if (selectedCategory !== 'All') {
        const catMatch =
          issue.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          (selectedCategory === 'Roads' && (issue.category === 'Pothole' || issue.category === 'Sidewalk')) ||
          (selectedCategory === 'Sanitation' && issue.category === 'Trash & Litter') ||
          (selectedCategory === 'Water' && issue.category === 'Water Leak') ||
          (selectedCategory === 'Street Light' && issue.category === 'Streetlight')
        if (!catMatch) return false
      }
      if (selectedStatus !== 'All' && issue.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = issue.title.toLowerCase().includes(q)
        const descMatch = issue.description.toLowerCase().includes(q)
        const addrMatch = issue.address.toLowerCase().includes(q)
        if (!titleMatch && !descMatch && !addrMatch) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'upvoted') return b.upvotes - a.upvotes
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'discussed') return (b.comments?.length || 0) - (a.comments?.length || 0)
      return 0
    })

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Title Section */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              NagarSeva — Public Complaint Feed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredIssues.length} active complaints in your area · Real-time civic accountability
            </p>
          </div>

          <Link href="/report">
            <Button className="gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
              <CirclePlus className="size-4" />
              File a Complaint
            </Button>
          </Link>
        </div>

        {/* Main Feed Container */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Filters */}
          <div className="shrink-0 lg:w-56 xl:w-64">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                    <SlidersHorizontal className="size-4 text-muted-foreground" />
                    Filters
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Category
                  </p>
                  <div className="space-y-1">
                    {CATEGORY_ITEMS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Status
                  </p>
                  <div className="space-y-1">
                    {STATUS_ITEMS.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStatus(st.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                          selectedStatus === st.id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By Filter */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Sort By
                  </p>
                  <div className="space-y-1">
                    {SORT_ITEMS.map((sort) => (
                      <button
                        key={sort.id}
                        type="button"
                        onClick={() => setSortBy(sort.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                          sortBy === sort.id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold text-primary tabular-nums">
                  {filteredIssues.length}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">complaints found</p>
              </div>
            </div>
          </div>

          {/* Feed List Grid */}
          <div className="min-w-0 flex-1">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search complaints by title, description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-9 rounded-xl border-border bg-card"
              />
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
                <p className="font-semibold text-foreground">No complaints match your criteria</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try adjusting your search query or reset category filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('All')
                    setSelectedStatus('All')
                    setSearchQuery('')
                  }}
                  className="mt-4 text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredIssues.map((issue) => {
                  const icon = getCategoryIcon(issue.category)
                  const isUpvoted = !!upvotedIds[issue.id]

                  return (
                    <Link
                      key={issue.id}
                      href={`/issue/${issue.id}`}
                      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative h-48 w-full overflow-hidden bg-muted">
                        <SafeImage
                          src={issue.photo}
                          alt={issue.title}
                          category={issue.category}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                            <span>{icon}</span>
                            {issue.category}
                          </span>
                          {issue.severity === 'High' && (
                            <span className="rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                              Urgent
                            </span>
                          )}
                        </div>

                        <div className="absolute right-3 top-3">
                          {getStatusBadge(issue.status)}
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-4">
                        <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                          {issue.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {issue.description}
                        </p>

                        {/* Location & Time */}
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {issue.address || issue.ward}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Footer Info & Actions */}
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-extrabold text-primary">
                              {issue.reporter
                                ? issue.reporter
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                : 'CZ'}
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {issue.reporter || 'Citizen'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleUpvote(e, issue.id)}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                isUpvoted
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <ThumbsUp className={`size-3.5 ${isUpvoted ? 'fill-current' : ''}`} />
                              <span className="tabular-nums">{issue.upvotes}</span>
                            </button>

                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="size-3.5" />
                              <span className="tabular-nums">{issue.comments?.length || 0}</span>
                            </span>

                            <ChevronRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
