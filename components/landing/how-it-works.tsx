import { Camera, MapPinned, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    icon: Camera,
    title: 'Report',
    copy: 'Snap a photo. AI suggests the category and writes the description. Tap submit — done in 10 seconds.',
    tone: 'bg-status-pending/12 text-status-pending',
  },
  {
    icon: MapPinned,
    title: 'Track',
    copy: 'Watch your report move from Reported to Assigned to In Progress. Get a ping at every step.',
    tone: 'bg-status-progress/20 text-status-progress-foreground',
  },
  {
    icon: PartyPopper,
    title: 'Resolved',
    copy: 'See the after photo, confirm the fix, and earn Civic points. Real accountability, not a black hole.',
    tone: 'bg-status-resolved/15 text-status-resolved',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
        <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          From a photo to a fix — with everyone watching
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          The difference isn&apos;t the complaint. It&apos;s the visible follow-through.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className={cn('flex size-12 items-center justify-center rounded-xl', step.tone)}>
                <step.icon className="size-6" />
              </div>
              <span className="font-mono text-4xl font-bold text-border">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              {step.copy}
            </p>
            {i < STEPS.length - 1 && (
              <div className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 rotate-45 border-r border-t border-border bg-card md:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
