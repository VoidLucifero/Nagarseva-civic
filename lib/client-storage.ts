import type { Issue } from './types'
import type { UserRecord } from './db'

const LOCAL_STORAGE_KEY = 'nagar_seva_user_issues'
const UPVOTES_MAP_KEY = 'nagar_seva_upvoted_ids'
const USERS_STORAGE_KEY = 'nagar_seva_registered_users'

export function getClientIssues(): Issue[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveClientIssue(issue: Issue) {
  if (typeof window === 'undefined') return
  try {
    const existing = getClientIssues()
    const filtered = existing.filter((i) => i.id !== issue.id)
    const updated = [issue, ...filtered]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

export function getUpvotedIds(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(UPVOTES_MAP_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setUpvotedState(id: string, isUpvoted: boolean) {
  if (typeof window === 'undefined') return
  try {
    const ids = getUpvotedIds()
    if (isUpvoted) ids[id] = true
    else delete ids[id]
    localStorage.setItem(UPVOTES_MAP_KEY, JSON.stringify(ids))
  } catch {}
}

export function updateLocalIssueUpvotes(id: string, delta: number): number {
  if (typeof window === 'undefined') return 1
  try {
    const issues = getClientIssues()
    const target = issues.find((i) => i.id === id)
    if (target) {
      target.upvotes = Math.max(1, (target.upvotes || 1) + delta)
      saveClientIssue(target)
      return target.upvotes
    }
  } catch {}
  return 1
}

export function mergeClientIssues(serverIssues: Issue[]): Issue[] {
  const localIssues = getClientIssues()
  if (localIssues.length === 0) return serverIssues

  const serverMap = new Map(
    serverIssues.map((i) => {
      // Preserve upvotes & client photo saved locally
      const localMatch = localIssues.find((loc) => loc.id === i.id)
      const upvotes = localMatch ? localMatch.upvotes : i.upvotes
      const photo =
        localMatch && localMatch.photo && localMatch.photo.startsWith('data:')
          ? localMatch.photo
          : i.photo
      return [i.id, { ...i, upvotes, photo }]
    }),
  )

  localIssues.forEach((local) => {
    serverMap.set(local.id, local)
  })

  return Array.from(serverMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/* User Account Storage & Persistence */

export function getClientUsers(): UserRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveClientUser(user: UserRecord) {
  if (typeof window === 'undefined') return
  try {
    const existing = getClientUsers()
    const filtered = existing.filter((u) => u.id !== user.id && u.phone !== user.phone)
    const updated = [user, ...filtered]
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

export function mergeClientUsers(serverUsers: UserRecord[]): UserRecord[] {
  const localUsers = getClientUsers()
  if (localUsers.length === 0) return serverUsers

  const userMap = new Map<string, UserRecord>()
  serverUsers.forEach((u) => userMap.set(u.phone, u))
  localUsers.forEach((u) => userMap.set(u.phone, u))

  return Array.from(userMap.values())
}
