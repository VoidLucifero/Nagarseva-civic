'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Rss, Map, PlusCircle, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_TABS = [
  { href: '/public-complaint-feed', label: 'Feed', icon: Rss },
  { href: '/explore', label: 'Map', icon: Map },
  { href: '/report', label: 'Report', icon: PlusCircle, isPrimary: true },
  { href: '/leaderboard', label: 'Titles', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden supports-[backdrop-filter]:bg-card/85">
      <nav className="flex h-16 items-center justify-around px-2">
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          if (tab.isPrimary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative -top-3 flex flex-col items-center"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 transition-transform active:scale-95">
                  <Icon className="size-6" />
                </div>
                <span className="mt-0.5 text-[10px] font-bold text-accent">Report</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 transition-colors',
                active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-5" />
              <span className="mt-1 text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
