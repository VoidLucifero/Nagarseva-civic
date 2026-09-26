'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { onSnapshot, collection } from 'firebase/firestore'
import { MapPin } from 'lucide-react'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import type { Issue, IssueStatus } from '@/lib/types'
import { SafeImage } from '@/components/safe-image'

// Import Leaflet CSS dynamically
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
)
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false },
)
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false },
)

const PIN_HEX: Record<IssueStatus, string> = {
  reported: '#eab308',
  assigned: '#3b82f6',
  'in-progress': '#f59e0b',
  resolved: '#10b981',
}

const MapBoundsController = dynamic(
  () =>
    import('react-leaflet').then((m) => {
      const { useMap } = m
      return function BoundsController({ issues, L }: { issues: Issue[]; L: any }) {
        const map = useMap()
        useEffect(() => {
          if (!map || !L || !issues || issues.length === 0) return
          try {
            const points = issues
              .map((i) => {
                const lat = typeof i.lat === 'number' && !isNaN(i.lat) ? i.lat : null
                const lng = typeof i.lng === 'number' && !isNaN(i.lng) ? i.lng : null
                return lat !== null && lng !== null ? ([lat, lng] as [number, number]) : null
              })
              .filter((p): p is [number, number] => p !== null)

            if (points.length === 1) {
              map.setView(points[0], 13)
            } else if (points.length > 1) {
              const bounds = L.latLngBounds(points)
              if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
              }
            }
          } catch (err) {
            console.warn('Map fitBounds warning:', err)
          }
        }, [issues, map, L])
        return null
      }
    }),
  { ssr: false },
)

export function CityMap({
  issues: initialIssues,
  selectedId,
  onSelect,
  showUser = true,
  className,
}: {
  issues?: Issue[]
  selectedId?: string | null
  onSelect?: (issue: Issue) => void
  showUser?: boolean
  className?: string
}) {
  const [liveIssues, setLiveIssues] = useState<Issue[]>(initialIssues || [])
  const [isMounted, setIsMounted] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    import('leaflet').then((leafletObj) => {
      setL(leafletObj.default || leafletObj)
    })

    const unsubscribe = onSnapshot(
      collection(db, 'issues'),
      (snapshot) => {
        if (snapshot.empty) {
          setLiveIssues([])
        } else {
          const docs = snapshot.docs.map((d) => d.data() as Issue)
          setLiveIssues(docs)
        }
      },
      (err) => {
        console.warn('Realtime Firestore snapshot listener error:', err)
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (initialIssues) {
      setLiveIssues(initialIssues)
    }
  }, [initialIssues])

  const validCoordinates = useMemo(() => {
    return liveIssues
      .map((i) => ({
        lat: typeof i.lat === 'number' && !isNaN(i.lat) ? i.lat : null,
        lng: typeof i.lng === 'number' && !isNaN(i.lng) ? i.lng : null,
      }))
      .filter((c): c is { lat: number; lng: number } => c.lat !== null && c.lng !== null)
  }, [liveIssues])

  const centerLat =
    validCoordinates.length > 0
      ? validCoordinates.reduce((sum, c) => sum + c.lat, 0) / validCoordinates.length
      : 20.5937
  const centerLng =
    validCoordinates.length > 0
      ? validCoordinates.reduce((sum, c) => sum + c.lng, 0) / validCoordinates.length
      : 78.9629

  const defaultZoom = validCoordinates.length > 1 ? 5 : validCoordinates.length === 1 ? 13 : 5

  if (!isMounted || !L) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-border bg-card p-8 text-xs text-muted-foreground',
          className,
        )}
      >
        Loading Interactive OpenStreetMap…
      </div>
    )
  }

  const createCustomIcon = (status: IssueStatus) => {
    const color = PIN_HEX[status] || '#eab308'
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
      </svg>
    `
    return L.divIcon({
      html: svgIcon,
      className: 'custom-leaflet-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border shadow-sm z-0', className)}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={defaultZoom}
        scrollWheelZoom={false}
        className="h-full w-full min-h-[350px]"
      >
        <MapBoundsController issues={liveIssues} L={L} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {liveIssues.map((issue) => {
          if (typeof issue.lat !== 'number' || typeof issue.lng !== 'number' || isNaN(issue.lat) || isNaN(issue.lng)) {
            return null
          }

          return (
            <Marker
              key={issue.id}
              position={[issue.lat, issue.lng]}
              icon={createCustomIcon(issue.status)}
              eventHandlers={{
                click: () => {
                  if (onSelect) onSelect(issue)
                },
              }}
            >
              <Popup className="leaflet-popup-custom">
                <div className="p-1 max-w-xs space-y-2">
                  <div className="relative h-28 w-full overflow-hidden rounded-lg bg-muted">
                    <SafeImage
                      src={issue.photo}
                      alt={issue.title}
                      category={issue.category}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {issue.category} · {issue.id}
                    </span>
                    <h4 className="font-bold text-foreground text-xs line-clamp-1">{issue.title}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{issue.address}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      GPS: {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-[10px]">
                    <span className="font-semibold text-foreground">Dept: {issue.department || 'Public Works'}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        issue.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : issue.status === 'in-progress'
                          ? 'bg-amber-100 text-amber-700'
                          : issue.status === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <Link
                    href={`/issue/${issue.id}`}
                    className="block text-center rounded-md bg-primary py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    View Complaint Details ➔
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {liveIssues.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 p-6 text-center backdrop-blur-xs">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <MapPin className="size-6" />
          </div>
          <h3 className="font-bold text-foreground text-sm">No active reports yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Be the first citizen to submit a local civic issue in your city!
          </p>
          <Link
            href="/report"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            Report an Issue Now
          </Link>
        </div>
      )}
    </div>
  )
}

export function MapLegend({ className }: { className?: string }) {
  const items: { status: IssueStatus; label: string; color: string }[] = [
    { status: 'reported', label: 'Submitted', color: 'bg-yellow-500' },
    { status: 'assigned', label: 'Acknowledged', color: 'bg-blue-500' },
    { status: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
    { status: 'resolved', label: 'Resolved', color: 'bg-emerald-500' },
  ]
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)}>
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-1.5 font-medium">
          <span className={cn('size-2.5 rounded-full', item.color)} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
