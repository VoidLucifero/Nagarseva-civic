import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { StatusTimeline } from '@/components/status-timeline'
import { MOCK_ISSUES } from '@/lib/mock-data'

export function HeroSection() {
  const demo = MOCK_ISSUES[0]

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_15%_0%,oklch(0.93_0.05_215)_0%,transparent_60%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="size-3.5 text-accent" />
            NagarSeva Platform · Complaints for Every Citizen
          </span>

          <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            File, Track &amp; Resolve <span className="text-primary">Civic Issues.</span>{' '}
            <span className="text-accent">Directly.</span>
          </h1>

          <p className="mt-5 max-w-md text-pretty text-lg text-muted-foreground">
            Report roads, water, sanitation, and electricity complaints — directly connected to municipal officials for fast resolution.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/public-complaint-feed"
              className={cn(
                buttonVariants({ variant: 'default' }),
                'h-12 gap-2 bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90',
              )}
            >
              Browse Complaint Feed
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/report"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-12 gap-2 px-6 text-base font-medium',
              )}
            >
              File a Complaint
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">3 people</span> already flagged an issue
            near you today.
          </p>
        </div>

        {/* Live report preview card — reinforces the feedback loop */}
        <div className="relative">
          <div className="absolute -right-4 -top-4 -z-10 hidden size-40 rounded-full bg-accent/15 blur-2xl lg:block" />
          <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl shadow-primary/5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <Image
                src={demo.photo || '/placeholder.svg'}
                alt="Reported pothole on Elm Street"
                fill
                sizes="(max-width: 1024px) 90vw, 380px"
                className="object-cover"
                priority
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="size-3.5 text-accent" />
                AI: Pothole · 94%
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{demo.id}</p>
                <p className="text-sm font-semibold">{demo.title}</p>
              </div>
              <StatusBadge status={demo.status} />
            </div>
            <div className="mt-4 rounded-xl bg-secondary/50 p-4">
              <StatusTimeline issue={demo} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
