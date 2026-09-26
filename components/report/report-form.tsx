'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
  Users,
  X,
  FlipHorizontal,
  Upload,
  MessageSquare,
} from 'lucide-react'
import { generateWhatsAppShareLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CategoryIcon } from '@/components/category-icon'
import { StatusBadge } from '@/components/status-badge'
import { UpvoteButton } from '@/components/upvote-button'
import { analyzePhoto, submitReport } from '@/lib/api'
import { CATEGORIES, CURRENT_USER_LOCATION, MOCK_ISSUES } from '@/lib/mock-data'
import type { Category, Severity } from '@/lib/types'

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High']

import { enqueueOfflineReport, flushOfflineQueue } from '@/lib/offline-queue'
import { Copy, WifiOff, ExternalLink, RefreshCw } from 'lucide-react'

type Step = 'photo' | 'analyzing' | 'details' | 'success' | 'offline_queued'

export function ReportForm() {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [step, setStep] = useState<Step>('photo')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [category, setCategory] = useState<Category>('Pothole')
  const [confidence, setConfidence] = useState(0)
  const [severity, setSeverity] = useState<Severity>('Medium')
  const [description, setDescription] = useState('')
  const [aiAssisted, setAiAssisted] = useState(false)

  const [duplicateChoice, setDuplicateChoice] = useState<'pending' | 'same' | 'different'>('pending')
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  // Live Web Camera State
  const [showLiveCamera, setShowLiveCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Real Device GPS Geolocation State
  const [deviceLocation, setDeviceLocation] = useState<{
    lat: number | null
    lng: number | null
    address: string
    detecting: boolean
    gpsVerified: boolean
    error: string | null
  }>({
    lat: null,
    lng: null,
    address: CURRENT_USER_LOCATION.label,
    detecting: false,
    gpsVerified: false,
    error: null,
  })

  const similarIssue = MOCK_ISSUES.find(
    (issue) => issue.category === category && issue.status !== 'resolved',
  )

  // Clean up WebRTC stream and detect GPS location on mount
  useEffect(() => {
    detectExactDeviceLocation()
    return () => {
      stopCameraStream()
    }
  }, [])

  function detectExactDeviceLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setDeviceLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported on this browser',
      }))
      return
    }

    setDeviceLocation((prev) => ({ ...prev, detecting: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        let formattedAddress = `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          )
          if (res.ok) {
            const data = await res.json()
            if (data?.display_name) {
              const parts = data.display_name.split(',')
              formattedAddress = parts.slice(0, 3).join(', ')
            }
          }
        } catch {
          // fallback to lat/lng format
        }

        setDeviceLocation({
          lat,
          lng,
          address: formattedAddress,
          detecting: false,
          gpsVerified: true,
          error: null,
        })
        toast.success('Exact device GPS location detected!', {
          description: formattedAddress,
        })
      },
      (err) => {
        console.warn('GPS location access error:', err)
        setDeviceLocation((prev) => ({
          ...prev,
          detecting: false,
          error: 'Location permission denied. Using default area.',
        }))
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function stopCameraStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  async function startLiveCamera() {
    setCameraError(null)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback directly to native camera file picker
      cameraInputRef.current?.click()
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      setStream(mediaStream)
      setShowLiveCamera(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err: any) {
      console.warn('Live camera stream not available, falling back to native file input:', err)
      // Fall back to camera file input if WebRTC permission fails or is HTTP
      cameraInputRef.current?.click()
    }
  }

  function compressImageDataUrl(dataUrl: string, maxDim = 1024, quality = 0.75): Promise<string> {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image')) {
        resolve(dataUrl)
        return
      }
      const img = new window.Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        } else {
          resolve(dataUrl)
        }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  async function capturePhotoFromCamera() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      stopCameraStream()
      setShowLiveCamera(false)
      const compressed = await compressImageDataUrl(dataUrl)
      setPhotoPreview(compressed)
      runAnalysis()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        const compressed = await compressImageDataUrl(dataUrl)
        setPhotoPreview(compressed)
        runAnalysis()
      }
    }
    reader.readAsDataURL(file)
  }

  function usePresetPhoto() {
    setPhotoPreview('/issues/pothole.png')
    runAnalysis()
  }

  async function runAnalysis() {
    setStep('analyzing')
    const result = await analyzePhoto()
    setCategory(result.category as Category)
    setConfidence(result.confidence)
    setSeverity(result.severity)
    // Do NOT overwrite user's description — keep user's exact typed input!
    setAiAssisted(true)
    setDuplicateChoice('pending')
    setStep('details')
  }

  async function handleSubmit() {
    setSubmitting(true)

    const payload = {
      category,
      severity,
      description,
      address: deviceLocation.address,
      lat: deviceLocation.lat,
      lng: deviceLocation.lng,
      gpsVerified: deviceLocation.gpsVerified,
      photo: photoPreview,
      duplicateOf: duplicateChoice === 'same' ? similarIssue?.id : undefined,
    }

    // Check offline status before network call
    if (typeof window !== 'undefined' && !navigator.onLine) {
      const queuedItem = enqueueOfflineReport(payload)
      setSubmittedId(queuedItem.queueId)
      setStep('offline_queued')
      toast.info('Network offline — report saved locally on device!', {
        description: 'It will automatically sync to municipal care once reconnected.',
      })
      setSubmitting(false)
      return
    }

    try {
      const { id } = await submitReport(payload)
      setSubmittedId(id)
      setStep('success')
      toast.success('Report submitted successfully!', { description: `Tracking ID ${id}` })
    } catch (err: any) {
      // If network request failed or device lost connectivity mid-request
      if (typeof window !== 'undefined' && (!navigator.onLine || err?.message?.includes('fetch'))) {
        const queuedItem = enqueueOfflineReport(payload)
        setSubmittedId(queuedItem.queueId)
        setStep('offline_queued')
        toast.info('Network blip — report saved to local offline queue!', {
          description: 'Will submit automatically when connection restores.',
        })
      } else {
        toast.error(err.message || 'Something went wrong while saving your report. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('photo')
    setPhotoPreview(null)
    setAiAssisted(false)
    setDescription('')
    setConfidence(0)
    setDuplicateChoice('pending')
    setSubmittedId(null)
    stopCameraStream()
    setShowLiveCamera(false)
  }

  if (step === 'offline_queued' && submittedId) {
    return (
      <Card className="mx-auto max-w-lg items-center px-6 py-10 text-center shadow-lg border-amber-500/30 bg-amber-500/5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
          <WifiOff className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">Report Saved Locally (Offline Queue)</h2>
        <p className="mt-1 max-w-sm text-pretty text-xs text-muted-foreground">
          Your report with photo &amp; GPS coordinates is safely saved on your device. It will automatically submit to the municipal care database the moment your connectivity returns.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-card px-4 py-2">
          <span className="text-xs text-muted-foreground">Queue Ticket ID</span>
          <span className="font-mono text-xs font-bold text-foreground">{submittedId}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(submittedId)
              toast.success('Ticket ID copied to clipboard')
            }}
            className="ml-2 text-muted-foreground hover:text-foreground"
            title="Copy ID"
          >
            <Copy className="size-3.5" />
          </button>
        </div>

        <div className="mt-5 w-full rounded-xl border border-border bg-card p-4 text-left space-y-2">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <RefreshCw className="size-3.5 text-amber-500 animate-spin" />
            Automatic Background Sync Active
          </p>
          <p className="text-[11px] text-muted-foreground">
            We are continuously monitoring your network state. You do not need to keep this page open.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await flushOfflineQueue()
              if (res.synced > 0) {
                setStep('success')
              } else {
                toast.info('Still offline or no connection established yet.')
              }
            }}
            className="mt-2 w-full h-8 text-xs font-bold gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Try Syncing Now
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={reset} className="h-9 text-xs font-medium">
            Report another issue
          </Button>
          <Link
            href="/explore"
            className={cn('h-9 px-4', 'inline-flex items-center justify-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground hover:bg-accent/90')}
          >
            View the map
          </Link>
        </div>
      </Card>
    )
  }

  if (step === 'success' && submittedId) {
    const whatsappUrl = generateWhatsAppShareLink({
      id: submittedId,
      category,
      address: deviceLocation.address,
      status: 'Submitted ➔ Routed to Department',
    })

    return (
      <Card className="mx-auto max-w-lg items-center px-6 py-10 text-center shadow-lg">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-status-resolved/15 text-status-resolved">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">Report Submitted &amp; Verified!</h2>
        <p className="mt-1 max-w-sm text-pretty text-xs text-muted-foreground">
          Confirmed in database — routed directly to municipal department for triage &amp; crew dispatch.
        </p>

        {/* Durable Proof of Existence Header */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">Tracking ID</span>
          <span className="font-mono text-sm font-bold text-foreground">{submittedId}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(submittedId)
              toast.success('Tracking ID copied to clipboard!')
            }}
            className="ml-2 text-muted-foreground hover:text-foreground"
            title="Copy ID"
          >
            <Copy className="size-4" />
          </button>
        </div>

        {/* Independent Proof of Existence Verification Links */}
        <div className="mt-5 w-full rounded-xl border border-primary/20 bg-primary/5 p-4 text-left space-y-2.5">
          <p className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CheckCircle2 className="size-4" />
            Independent Proof of Existence
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your complaint is permanently stored. You can verify and track it independently anytime across these pages:
          </p>
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            <Link
              href="/public-complaint-feed"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
            >
              <span>Public Feed</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
            >
              <span>My Profile</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Direct WhatsApp Notification Card */}
        <div className="mt-5 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            📱 Direct WhatsApp Notification
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Get instant complaint tracking alerts &amp; live map link sent directly to your WhatsApp.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-98"
          >
            <MessageSquare className="size-4" />
            Send Ticket Alert to WhatsApp
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={reset} className="h-10 px-5 font-medium">
            Report another issue
          </Button>
          <Link
            href="/explore"
            className={cn('h-10 px-5', 'inline-flex items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground hover:bg-accent/90')}
          >
            View the map
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        {/* Photo capture */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">1. Add a photo</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One clear photo is all we need — our AI reads the rest.
          </p>

          {/* Inputs for native mobile camera & gallery */}
          <input
            id="mobile-camera-input"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            id="mobile-gallery-input"
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Live Web Camera Modal */}
          {showLiveCamera && (
            <div className="relative mt-4 overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 px-4">
                <Button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="size-14 rounded-full border-4 border-white bg-accent p-0 shadow-lg hover:scale-105 hover:bg-accent/90 transition-transform"
                  title="Snap photo"
                >
                  <span className="size-6 rounded-full bg-white" />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream()
                  setShowLiveCamera(false)
                }}
                className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          {!showLiveCamera && photoPreview ? (
            <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <Image src={photoPreview} alt="Uploaded issue photo" fill className="object-cover" unoptimized />
              {step === 'analyzing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Analyzing photo…</p>
                </div>
              )}
              {aiAssisted && step !== 'analyzing' && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                  <Sparkles className="size-3.5 text-accent" />
                  AI: {category} · {confidence}%
                </span>
              )}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <label
                  htmlFor="mobile-camera-input"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-background"
                >
                  <Camera className="size-3.5" />
                  Retake photo
                </label>
              </div>
            </div>
          ) : !showLiveCamera ? (
            <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <ImagePlus className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Take or upload a photo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">JPG or PNG, up to 10MB</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label
                  htmlFor="mobile-camera-input"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
                >
                  <Camera className="size-4" />
                  Take Photo (Camera)
                </label>
                <label
                  htmlFor="mobile-gallery-input"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-background px-4 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors shadow-sm"
                >
                  <Upload className="size-4" />
                  Upload Photo
                </label>
                <Button type="button" variant="ghost" onClick={usePresetPhoto} className="h-9 text-xs text-muted-foreground hover:text-foreground">
                  Try sample photo
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Details */}
        {(step === 'details') && (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">2. Confirm the details</h2>
              {aiAssisted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                  <Sparkles className="size-3.5" />
                  Auto-filled by AI
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Severity</Label>
                <div className="flex gap-1.5">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={cn(
                        'h-9 flex-1 rounded-lg border text-xs font-medium transition-colors',
                        severity === s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What's going on here?"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" />
              {deviceLocation.detecting ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  Detecting device GPS location…
                </span>
              ) : deviceLocation.gpsVerified ? (
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    <span className="mr-1.5 inline-block size-2 rounded-full bg-status-resolved animate-pulse" />
                    Exact GPS: {deviceLocation.address}
                  </span>
                  {deviceLocation.lat && deviceLocation.lng && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({deviceLocation.lat.toFixed(5)}, {deviceLocation.lng.toFixed(5)})
                    </span>
                  )}
                </div>
              ) : (
                <span>
                  Reporting near <span className="font-medium text-foreground">{deviceLocation.address}</span>
                </span>
              )}
              <button
                type="button"
                onClick={detectExactDeviceLocation}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Navigation className="size-3 shrink-0" />
                {deviceLocation.gpsVerified ? 'Re-detect GPS' : 'Detect GPS'}
              </button>
            </div>
          </Card>
        )}

        {/* Duplicate check */}
        {step === 'details' && similarIssue && duplicateChoice === 'pending' && (
          <Card className="border-accent/30 bg-accent/5 p-5">
            <h2 className="text-sm font-semibold text-foreground">Is this the same issue?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              We found a similar report nearby. Confirming avoids duplicate tickets and boosts its
              priority instead.
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={similarIssue.photo} alt="" fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CategoryIcon category={similarIssue.category} className="size-3.5 text-primary" />
                  {similarIssue.category} · {similarIssue.distanceKm} km away
                </div>
                <p className="line-clamp-1 text-sm font-medium text-foreground">{similarIssue.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={similarIssue.status} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {similarIssue.confirmations} confirmed
                  </span>
                </div>
              </div>
              <UpvoteButton count={similarIssue.upvotes} size="sm" />
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setDuplicateChoice('same')
                  toast.success('Thanks — we bumped this issue\'s priority instead of creating a duplicate.')
                }}
                className="h-9 flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Yes, same issue
              </Button>
              <Button type="button" variant="outline" onClick={() => setDuplicateChoice('different')} className="h-9 flex-1">
                No, it's different
              </Button>
            </div>
          </Card>
        )}

        {step === 'details' && duplicateChoice === 'same' && similarIssue && (
          <Card className="border-status-resolved/30 bg-status-resolved/5 p-4">
            <p className="text-sm text-foreground">
              Got it — you've confirmed <span className="font-mono">{similarIssue.id}</span>. Your
              upvote has been added to that report.
            </p>
          </Card>
        )}

        {step === 'details' && (duplicateChoice !== 'pending' || !similarIssue) && (
          <Button
            type="button"
            disabled={submitting || !description.trim()}
            onClick={handleSubmit}
            className="h-11 w-full gap-2 bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        )}
      </div>

      {/* Sidebar: how it works reminder */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
              We route your report to the department that handles it — no need to know who that is.
            </li>
            <li className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
              You get notified at every status change, from Assigned to Resolved.
            </li>
            <li className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
              Once marked resolved, you confirm the fix — or reopen it if it isn't actually done.
            </li>
          </ol>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">10-second reports build trust</h3>
          <p className="mt-1.5 text-xs text-muted-foreground text-pretty">
            The less effort it takes to report, the more people do it — and every report makes the
            next person's issue easier to triage.
          </p>
        </Card>
      </div>
    </div>
  )
}
