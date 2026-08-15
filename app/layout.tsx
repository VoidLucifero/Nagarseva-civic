import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Public_Sans, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { MobileNav } from '@/components/mobile-nav'
import './globals.css'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NagarSeva — Civic Complaints & Resolution Platform',
  description:
    'Crowdsourced civic complaint reporting for Indian citizens. File, track, and resolve roads, water, sanitation, and electricity issues.',
  manifest: '/manifest.json',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#1c5a6b',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

import { SplashProvider } from '@/components/splash-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${publicSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased pb-16 md:pb-0">
        <SplashProvider />
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <MobileNav />
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
