import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-16 md:py-20">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_2px,transparent_2px),radial-gradient(circle_at_80%_60%,white_2px,transparent_2px)] [background-size:60px_60px]" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            See something broken? Report it in under a minute.
          </h2>
          <p className="mt-4 text-primary-foreground/80 leading-relaxed text-pretty">
            Join thousands of neighbors keeping the city accountable. No account hoops, no
            bureaucracy—just a photo and a tap.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/report"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-accent text-accent-foreground hover:bg-accent/90',
              )}
            >
              Report an issue
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/explore"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
              )}
            >
              Explore the map
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
