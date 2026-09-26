import Link from 'next/link'
import { CivicMark } from '@/components/civic-mark'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <CivicMark className="size-7" />
          <span className="font-bold text-lg">
            Nagar<span className="text-primary">Seva</span>
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/report" className="hover:text-foreground">
            Report Issue
          </Link>
          <Link href="/public-complaint-feed" className="hover:text-foreground">
            Complaint Feed
          </Link>
          <Link href="/explore" className="hover:text-foreground">
            Explore Map
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/profile" className="hover:text-foreground">
            My Profile
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          NagarSeva · Powered by CivicFix. Built for visible civic accountability.
        </p>
      </div>
    </footer>
  )
}
