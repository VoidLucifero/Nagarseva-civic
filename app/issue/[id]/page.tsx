import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Sparkles, Users, MessageSquare } from 'lucide-react'
import { generateWhatsAppShareLink } from '@/lib/whatsapp'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { StatusBadge, SeverityBadge } from '@/components/status-badge'
import { StatusTimeline } from '@/components/status-timeline'
import { UpvoteButton } from '@/components/upvote-button'
import { CategoryIcon } from '@/components/category-icon'
import { IssueComments } from '@/components/issue-comments'
import { IssueResolutionActions } from '@/components/issue-resolution-actions'
import { Card } from '@/components/ui/card'
import { formatDateTime, formatRelative } from '@/lib/civic'
import { getIssue } from '@/lib/api'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const issue = await getIssue(id)
  return {
    title: issue ? `${issue.title} — CivicFix` : 'Issue not found — CivicFix',
  }
}

import { SafeImage } from '@/components/safe-image'

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const issue = await getIssue(id)
  if (!issue) notFound()

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to map
          </Link>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Left: photos + description + comments */}
            <div className="space-y-6">
              <Card className="overflow-hidden p-0">
                <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    <SafeImage
                      src={issue.photo}
                      alt={issue.title}
                      category={issue.category}
                      className="size-full object-cover"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                      <Sparkles className="size-3.5 text-accent" />
                      AI confidence {issue.aiConfidence}%
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                      Before
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {issue.afterPhoto ? (
                      <>
                        <SafeImage
                          src={issue.afterPhoto}
                          alt={`${issue.title} — resolved`}
                          category={issue.category}
                          className="size-full object-cover"
                        />
                        <span className="absolute bottom-3 left-3 rounded-full bg-status-resolved/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                          After
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center text-muted-foreground">
                        <span className="text-xs font-medium">No after-photo yet</span>
                        <span className="text-xs">Added once resolved</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CategoryIcon category={issue.category} className="size-3.5 text-primary" />
                        {issue.category} · <span className="font-mono">{issue.id}</span>
                      </div>
                      <h1 className="mt-1 text-xl font-bold text-foreground text-balance">{issue.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground text-pretty">{issue.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {issue.address}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-3.5" />
                      {issue.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {issue.confirmations} confirmed
                    </span>
                    <span>Reported {formatRelative(issue.createdAt)} by {issue.reporter}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <IssueComments initialComments={issue.comments} />
              </Card>
            </div>

            {/* Right: status + meta + actions */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <Card className="flex-row items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Community support</p>
                  <p className="text-sm font-semibold text-foreground">{issue.upvotes} upvotes</p>
                </div>
                <UpvoteButton issueId={issue.id} count={issue.upvotes} />
              </Card>

              {/* Direct WhatsApp Share & Alert Card */}
              <Card className="border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  📱 Get WhatsApp Ticket Alert
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Send live status update & tracking link straight to WhatsApp.
                </p>
                <a
                  href={generateWhatsAppShareLink({
                    id: issue.id,
                    category: issue.category,
                    address: issue.address,
                    status: issue.status,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow transition-all hover:bg-emerald-700"
                >
                  <MessageSquare className="size-3.5" />
                  Send Alert to WhatsApp
                </a>
              </Card>

              <Card className="p-5">
                <h2 className="text-sm font-semibold text-foreground">Status timeline</h2>
                <div className="mt-4">
                  <StatusTimeline issue={issue} />
                </div>
              </Card>

              {issue.status === 'resolved' && (
                <Card className="p-4">
                  <IssueResolutionActions issueId={issue.id} />
                </Card>
              )}

              <Card className="space-y-2.5 p-5 text-sm">
                <h2 className="mb-1 text-sm font-semibold text-foreground">Details</h2>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ward</span>
                  <span className="text-foreground">{issue.ward}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Distance</span>
                  <span className="text-foreground">{issue.distanceKm} km</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Reported</span>
                  <span className="text-foreground">{formatDateTime(issue.createdAt)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Last update</span>
                  <span className="text-foreground">{formatDateTime(issue.updatedAt)}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
