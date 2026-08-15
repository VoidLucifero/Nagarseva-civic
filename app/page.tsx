import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/landing/hero-section'
import { OpeningScenario } from '@/components/landing/opening-scenario'
import { StatsBanner } from '@/components/landing/stats-banner'
import { HowItWorks } from '@/components/landing/how-it-works'
import { MapPreview } from '@/components/landing/map-preview'
import { CategoriesShowcase } from '@/components/landing/categories-showcase'
import { CtaSection } from '@/components/landing/cta-section'

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <OpeningScenario />
        <StatsBanner />
        <MapPreview />
        <HowItWorks />
        <CategoriesShowcase />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
