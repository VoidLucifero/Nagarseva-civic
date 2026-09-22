import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ReportForm } from '@/components/report/report-form'

export const metadata: Metadata = {
  title: 'Report an Issue — NagarSeva',
  description: 'Report a civic issue in 10 seconds with a photo and your location.',
}

export default function ReportPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Report an issue
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Snap a photo, confirm the details, done. Most reports take under 10 seconds.
            </p>
          </div>
          <ReportForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
