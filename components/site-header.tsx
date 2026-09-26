'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, ShieldCheck, User, LogOut, LogIn, X, Bell, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CivicMark } from '@/components/civic-mark'
import { AuthModal } from '@/components/auth-modal'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import type { UserRecord } from '@/lib/db'

const NAV = [
  { href: '/public-complaint-feed', label: 'Complaint Feed' },
  { href: '/explore', label: 'Explore Map' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/official-dashboard', label: 'Official Dashboard' },
  { href: '/profile', label: 'My Profile' },
]

import { ensureAnonymousAuth } from '@/lib/firebase'

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [user, setUser] = useState<UserRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Notification state
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [notifOpen, setNotifOpen] = useState(false)

  const unreadCount = notifications.filter((n) => n.unread).length

  useEffect(() => {
    ensureAnonymousAuth()
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.reload()
  }

  function openAuth(mode: 'signin' | 'signup') {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <CivicMark className="size-8" />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight leading-none">
                Nagar<span className="text-primary">Seva</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">Powered by CivicFix</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.filter((item) => item.href !== '/official-dashboard' || user?.role === 'official').map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-secondary/50">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Bell className="size-3.5 text-primary" />
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 divide-y divide-border overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={`/issue/${n.issueId}`}
                        onClick={() => setNotifOpen(false)}
                        className={`flex items-start gap-3 p-3 text-xs transition-colors hover:bg-secondary/40 ${
                          n.unread ? 'bg-primary/5' : ''
                        }`}
                      >
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                          <Sparkles className="size-3" />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{n.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">
                            {new Date(n.at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User auth state or Sign Up / Sign In buttons */}
            {!loading && user ? (
              <div className="flex items-center gap-1.5">
                <Link href="/profile" className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium hover:bg-secondary">
                  <Avatar size="xs" className="size-5 sm:size-6">
                    <AvatarFallback className="text-[10px]">{user.initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground text-xs">{user.name.split(' ')[0]}</span>
                  <span className="hidden rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent sm:inline">
                    {user.points} pts
                  </span>
                </Link>
                <Button variant="ghost" size="icon-xs" onClick={handleLogout} title="Log out" className="hidden text-muted-foreground hover:text-destructive sm:inline-flex">
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : !loading ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('signin')}
                  className="gap-1 px-2 text-xs font-semibold sm:px-2.5"
                >
                  <LogIn className="size-3.5 text-muted-foreground" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAuth('signup')}
                  className="gap-1 border-primary/40 bg-primary/5 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 sm:px-3"
                >
                  Sign Up
                </Button>
              </div>
            ) : null}

            <Link
              href="/report"
              className={cn(
                buttonVariants({ variant: 'default' }),
                'h-9 bg-accent px-4 font-semibold text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm',
              )}
            >
              Report Issue
            </Link>

            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <nav className="border-t border-border bg-background px-4 pb-4 md:hidden">
            {/* Mobile Auth Banner */}
            <div className="my-2 rounded-lg border border-border bg-secondary/40 p-3">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.phone} · {user.points} pts</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="xs" onClick={handleLogout} className="text-xs text-destructive">
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Sign in or create account</span>
                  <div className="flex gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => { setOpen(false); openAuth('signin'); }}>
                      Sign In
                    </Button>
                    <Button size="xs" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setOpen(false); openAuth('signup'); }}>
                      Sign Up
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {NAV.filter((item) => item.href !== '/official-dashboard' || user?.role === 'official').map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium',
                    active ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.href === '/official-dashboard' && <ShieldCheck className="size-4" />}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
        initialMode={authMode}
      />
    </>
  )
}
