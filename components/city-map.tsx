'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { onSnapshot, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { phaseOf } from '@/lib/civic'
import type { Issue, IssuePhase, IssueStatus } from '@/lib/types'
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

const PIN_COLOR: Record<IssuePhase, string> = {
  pending: 'bg-yellow-500',
  progress: 'bg-amber-500',
  resolved: 'bg-emerald-500',
}

const PIN_HEX: Record<IssueStatus, string> = {
  reported: '#eab308',
  assigned: '#3b82f6',
  'in-progress': '#f59e0b',
  resolved: '#10b981',
}

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

    // Real-time Firestore subscription to issues collection
    const unsubscribe = onSnapshot(
      collection(db, 'issues'),
      (snapshot) => {
        if (!snapshot.empty) {
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
    if (initialIssues && initialIssues.length > 0 && liveIssues.length === 0) {
      setLiveIssues(initialIssues)
    }
  }, [initialIssues])

  // Center map around Mumbai coordinates or first issue location
  const centerLat = liveIssues[0]?.lat && !isNaN(liveIssues[0].lat) ? liveIssues[0].lat : 19.0760
  const centerLng = liveIssues[0]?.lng && !isNaN(liveIssues[0].lng) ? liveIssues[0].lng : 72.8777

  if (!isMounted || !L) {
    return (
      <div className={cn('flex items-center justify-center rounded-xl border border-border bg-card p-8 text-xs text-muted-foreground', className)}>
        Loading Interactive OpenStreetMap…
      </div>
    )
  }

  // Create custom Leaflet Marker Icons dynamically
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
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full min-h-[350px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {liveIssues.map((issue) => {
          const lat = typeof issue.lat === 'number' && !isNaN(issue.lat) ? issue.lat : 19.0760
          const lng = typeof issue.lng === 'number' && !isNaN(issue.lng) ? issue.lng : 72.8777

          return (
            <Marker
              key={issue.id}
              position={[lat, lng]}
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
