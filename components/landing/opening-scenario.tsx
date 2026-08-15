'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  Sparkles,
  MapPin,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  Building2,
  Award,
  Zap,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OpeningScenario() {
  const [activeStep, setActiveStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const steps = [
    {
      id: 1,
      title: 'Step 1: Snap a Photo',
      subtitle: 'Instant Citizen Action',
      icon: Camera,
      badge: '10 Seconds',
      color: 'from-blue-500/20 to-primary/20 text-primary',
      description:
        'Anjali is walking near Oshiwara market and notices a severe sewage leak flooding the street. She opens Nagar Seva and snaps a quick photo on her phone.',
    },
    {
      id: 2,
      title: 'Step 2: AI & Ward Routing',
      subtitle: 'Smart Department Transfer',
      icon: Sparkles,
      badge: 'Automated ⚡',
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-600',
      description:
        'Nagar Seva AI instantly classifies the image as "Sanitation & Health Hazard" (96% confidence), tags Ward 3 GPS coordinates, and alerts municipal officers.',
    },
    {
      id: 3,
      title: 'Step 3: Municipal Repair Crew',
      subtitle: 'Visible Accountability',
      icon: Building2,
      badge: 'In Progress 🛠️',
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-600',
      description:
        'City Department officers review the complaint on their Official Dashboard, acknowledge receipt, and dispatch a repair crew within 24 hours.',
    },
    {
      id: 4,
      title: 'Step 4: Resolved & Citizen Rewards',
      subtitle: 'Points & Titles Earned',
      icon: Award,
      badge: 'Resolved 🏆',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600',
      description:
        'The street is cleaned and repaired! Anjali receives a notification ping, earns +100 Civic Points, and unlocks the "Sanitation Champion" title.',
    },
  ]

  const current = steps[activeStep]
  const Icon = current.icon

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl sm:p-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
              <Zap className="size-3.5 text-accent" />
              Nagar Seva Interactive Scenario
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              How Nagar Seva Transforms Your Neighborhood
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow Anjali’s story to see how a single photo leads to real municipal action in 4 simple steps.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/report">
              <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground font-semibold hover:bg-accent/90 text-xs">
                Start Reporting
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Close scenario"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="my-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`flex items-center gap-2 rounded-xl p-3 text-left transition-all ${
                activeStep === idx
                  ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                  activeStep === idx ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-card text-foreground'
                }`}
              >
                {s.id}
              </span>
              <div className="min-w-0">
                <p className="text-xs truncate font-bold">{s.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Story Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] items-center rounded-xl border border-border bg-card p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${current.color}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-foreground text-lg">{current.title}</h3>
                <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-extrabold text-primary">
                  {current.badge}
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground mt-3">
              {current.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                className="gap-1.5 text-xs font-semibold"
              >
                Next Step ({activeStep + 1}/4)
                <ArrowRight className="size-3.5" />
              </Button>

              <Link href="/public-complaint-feed">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                  View Live Complaint Feed
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Visual Card */}
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted shadow-inner flex items-center justify-center">
              <img
                src={
                  activeStep === 0
                    ? 'https://img.rocket.new/generatedImages/rocket_gen_img_137cf33fd-1778244287060.png'
                    : activeStep === 1
                    ? 'https://img.rocket.new/generatedImages/rocket_gen_img_13a78aac2-1767581330656.png'
                    : activeStep === 2
                    ? '/issues/pothole.png'
                    : '/issues/pothole-fixed.png'
                }
                alt={current.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-mono text-white backdrop-blur-sm">
                Nagar Seva Live Scenario #{current.id}
              </span>
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">
              Real-time civic progress tracking from submission to repair.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
