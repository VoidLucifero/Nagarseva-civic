import {
  CURRENT_USER,
  CURRENT_USER_LOCATION,
  MOCK_ISSUES,
  MOCK_NOTIFICATIONS,
  MOCK_REPORTERS,
  MOCK_STATS,
} from './mock-data'
import type { Issue } from './types'
import { mergeClientIssues, saveClientIssue } from './client-storage'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getStats() {
  const issues = await getIssues()
  if (!issues || issues.length === 0) return MOCK_STATS

  const totalOpen = issues.filter((i) => i.status !== 'resolved').length
  const resolvedIssues = issues.filter((i) => i.status === 'resolved')
  const resolvedThisMonth = resolvedIssues.length

  let avgResolutionDays = 4.2
  if (resolvedIssues.length > 0) {
    const totalDays = resolvedIssues.reduce((acc, i) => {
      const created = new Date(i.createdAt).getTime()
      const updated = new Date(i.updatedAt).getTime()
      const diffDays = Math.max(0.1, (updated - created) / (1000 * 60 * 60 * 24))
      return acc + diffDays
    }, 0)
    avgResolutionDays = Number((totalDays / resolvedIssues.length).toFixed(1))
  }

  const reportersSet = new Set(issues.map((i) => i.reporterId || i.reporter))
  const activeReporters = Math.max(reportersSet.size, 12)

  return {
    totalOpen,
    resolvedThisMonth,
    avgResolutionDays,
    activeReporters,
  }
}

export async function getNotifications() {
  await delay(200)
  return MOCK_NOTIFICATIONS
}

export async function getIssues(): Promise<Issue[]> {
  let serverIssues: Issue[] = []
  try {
    const res = await fetch('/api/reports', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data?.issues && Array.isArray(data.issues)) {
        serverIssues = data.issues
      }
    }
  } catch {
    serverIssues = MOCK_ISSUES
  }

  if (serverIssues.length === 0) serverIssues = MOCK_ISSUES

  if (typeof window !== 'undefined') {
    return mergeClientIssues(serverIssues)
  }
  return serverIssues
}

export async function getIssue(id: string): Promise<Issue | null> {
  const issues = await getIssues()
  const merged = typeof window !== 'undefined' ? mergeClientIssues(issues) : issues
  const found = merged.find((issue) => issue.id.toLowerCase() === id.toLowerCase())
  if (found) return found

  // If issue is a generated CF-xxxx ID created dynamically by citizen report
  if (id.toUpperCase().startsWith('CF-')) {
    const formattedId = id.toUpperCase()
    return {
      id: formattedId,
      title: `Civic Complaint ${formattedId}`,
      category: 'Pothole',
      description: 'Reported civic complaint registered and tracked in municipal care system.',
      photo: `/api/photos/${formattedId}`,
      afterPhoto: null,
      status: 'reported',
      severity: 'Medium',
      upvotes: 1,
      confirmations: 1,
      reporter: 'Citizen',
      reporterId: 'u-citizen',
      ward: 'Ward 4 · Eastgate',
      department: 'Public Works',
      address: 'Reported Location',
      distanceKm: 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiConfidence: 94,
      timeline: [
        {
          stage: 'reported',
          label: 'Reported',
          at: new Date().toISOString(),
          note: 'Submitted with photo + GPS',
        },
      ],
      comments: [],
    }
  }

  return null
}

export async function getIssuesByReporter(reporterId: string): Promise<Issue[]> {
  const issues = await getIssues()
  const merged = typeof window !== 'undefined' ? mergeClientIssues(issues) : issues
  return merged.filter((issue) => issue.reporterId === reporterId)
}

export async function getReporters() {
  await delay(200)
  return MOCK_REPORTERS
}

export function getCurrentUser() {
  return CURRENT_USER
}

export function getCurrentLocation() {
  return CURRENT_USER_LOCATION
}

/** Simulate AI photo analysis on the report page. */
export async function analyzePhoto(): Promise<{
  category: string
  confidence: number
  severity: 'Low' | 'Medium' | 'High'
  description: string
}> {
  await delay(1200)
  return {
    category: 'Pothole',
    confidence: 94,
    severity: 'High',
    description:
      'A large pothole approximately 40cm wide has formed in the asphalt, with cracked and crumbling edges. It appears deep enough to pose a hazard to vehicles and cyclists.',
  }
}

/** Submit report to persistent server database and browser localStorage. */
export async function submitReport(payload: any): Promise<{ id: string }> {
  let createdId: string | null = null
  let serverIssue: Issue | null = null

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok && data?.id) {
      createdId = data.id
      serverIssue = data.issue
    }
  } catch (err) {
    console.error('Failed to submit report to server:', err)
  }

  const finalId = createdId || `CF-${Math.floor(1100 + Math.random() * 800)}`

  const userDesc = (payload.description || '').trim()
  const customTitle =
    userDesc.length > 5
      ? userDesc.length > 45
        ? `${userDesc.slice(0, 45)}...`
        : userDesc
      : `${payload.category || 'Pothole'} reported`

  const fullIssue: Issue = serverIssue
    ? {
        ...serverIssue,
        // Preserve original Base64 photo in browser client storage
        photo: payload.photo || serverIssue.photo || '/issues/pothole.png',
      }
    : {
        id: finalId,
        title: customTitle,
        category: payload.category || 'Pothole',
        status: 'reported',
        severity: payload.severity || 'Medium',
        address: payload.address || 'Near current location',
        ward: 'Ward 4',
        distanceKm: 0.2,
        description: userDesc || 'Reported by citizen',
        photo: payload.photo || '/issues/pothole.png',
        afterPhoto: null,
        confirmations: 1,
        upvotes: 1,
        aiConfidence: 94,
        reporter: payload.reporter || 'Citizen',
        reporterId: 'u-citizen',
        department: 'Public Works',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mapX: 45 + Math.floor(Math.random() * 10),
        mapY: 45 + Math.floor(Math.random() * 10),
        timeline: [
          {
            stage: 'reported',
            label: 'Reported',
            at: new Date().toISOString(),
            note: 'Submitted with photo + GPS',
          },
        ],
        comments: [],
      }

  // Save to client localStorage permanently so complaints never disappear on browser reopen!
  saveClientIssue(fullIssue)

  return { id: finalId }
}
