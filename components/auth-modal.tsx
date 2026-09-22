'use client'

import { useState, useEffect } from 'react'
import { Phone, User, X, Loader2, LogIn, UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserRecord } from '@/lib/db'
import { saveClientUser } from '@/lib/client-storage'

import { DissolvingIntro } from '@/components/dissolving-intro'

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: UserRecord) => void
  initialMode?: 'signin' | 'signup'
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDissolve, setShowDissolve] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<UserRecord | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  if (showDissolve && loggedInUser) {
    return (
      <DissolvingIntro
        userName={loggedInUser.name}
        onComplete={() => {
          window.location.reload()
        }}
      />
    )
  }

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'signup' && (!name.trim() || name.trim().length < 2)) {
      toast.error('Please enter your full name.')
      return
    }

    if (!phone.trim() || phone.trim().length < 6) {
      toast.error('Please enter a valid phone number (at least 6 digits).')
      return
    }

    setLoading(true)
    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || `${mode === 'signup' ? 'Sign up' : 'Sign in'} failed.`)
      }

      if (data.user) {
        saveClientUser(data.user)
      }

      toast.success(
        mode === 'signup' ? 'Account created successfully!' : 'Signed in successfully!',
        {
          description: `Welcome to NagarSeva, ${data.user.name}!`,
        },
      )

      if (onSuccess) onSuccess(data.user)
      setLoggedInUser(data.user)
      setShowDissolve(true)
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Tab Switcher */}
        <div className="mx-auto flex w-full max-w-xs rounded-xl bg-secondary/80 p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="size-3.5" />
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'signin'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="size-3.5" />
            Sign In
          </button>
        </div>

        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {mode === 'signup' ? <UserPlus className="size-6" /> : <LogIn className="size-6" />}
          </div>
          <h2 className="mt-3 text-xl font-bold text-foreground">
            {mode === 'signup' ? 'Create NagarSeva Account' : 'Welcome Back'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === 'signup'
              ? 'Register with your name and phone number to report issues, earn points, and track progress.'
              : 'Enter your phone number to access your existing reports and Civic points.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="auth-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full gap-2 bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {loading
              ? mode === 'signup'
                ? 'Creating Account…'
                : 'Signing In…'
              : mode === 'signup'
              ? 'Create Account & Sign Up'
              : 'Sign In'}
          </Button>

          <div className="pt-2 text-center text-xs">
            {mode === 'signup' ? (
              <p className="text-muted-foreground">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>

          <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3 text-status-resolved" />
            No passwords required. Your account is tied to your phone number.
          </p>
        </form>
      </div>
    </div>
  )
}
