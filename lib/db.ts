import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { firestore } from './firebase'
import { MOCK_ISSUES, MOCK_REPORTERS, CURRENT_USER } from './mock-data'
import type { Issue } from './types'
import { savePhoto } from './photos'
import {
  getIssuesFromFirestore,
  getIssueFromFirestore,
  createIssueInFirestore,
  updateIssueInFirestore,
} from './firestore-issues'

export interface UserRecord {
  id: string
  name: string
  phone: string
  initials: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  points: number
  reports: number
  resolved: number
  role: 'citizen' | 'official'
}

// In-memory fallback store for offline / read-only serverless execution
let inMemoryUsers: UserRecord[] = []
let inMemoryIssues: Issue[] = []
let isSeeded = false

function withTimeout<T>(promise: Promise<T>, ms = 2500, fallback: T): Promise<T> {
  let timer: any
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback)
    }, ms)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

function getInitialUsers(): UserRecord[] {
  return [
    {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      phone: '9876543210',
      initials: CURRENT_USER.initials,
      tier: CURRENT_USER.tier,
      points: CURRENT_USER.points,
      reports: CURRENT_USER.reports,
      resolved: CURRENT_USER.resolved,
      role: 'citizen',
    },
    {
      id: 'user-official-1',
      name: 'Municipal Officer',
      phone: '9999999999',
      initials: 'MO',
      tier: 'Gold',
      points: 5000,
      reports: 0,
      resolved: 50,
      role: 'official',
    },
    ...MOCK_REPORTERS.map((r) => ({
      id: r.id,
      name: r.name,
      phone: '9000000000',
      initials: r.initials,
      tier: r.tier,
      points: r.points,
      reports: r.reports,
      resolved: 0,
      role: 'citizen' as const,
    })),
  ]
}

async function ensureSeeded() {
  if (isSeeded) return
  isSeeded = true

  // Seed mock photos into photos store
  MOCK_ISSUES.forEach((iss) => {
    if (iss.photo) {
      savePhoto(iss.id, iss.photo, iss.category)
    }
  })

  try {
    const usersSnap = await withTimeout(getDocs(collection(firestore, 'users')), 2000, null)
    if (usersSnap && !usersSnap.empty) {
      inMemoryUsers = usersSnap.docs.map((d) => d.data() as UserRecord)
    } else {
      const initialUsers = getInitialUsers()
      inMemoryUsers = initialUsers
      if (usersSnap) {
        for (const u of initialUsers) {
          setDoc(doc(firestore, 'users', u.id), u).catch(() => {})
        }
      }
    }
  } catch (err) {
    if (inMemoryUsers.length === 0) inMemoryUsers = getInitialUsers()
  }
}

function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export async function getUserByPhone(phone: string): Promise<UserRecord | null> {
  await ensureSeeded()
  const cleanPhone = phone.trim().replace(/\D/g, '')

  try {
    const usersSnap = await withTimeout(getDocs(collection(firestore, 'users')), 2000, null)
    if (usersSnap && !usersSnap.empty) {
      const found = usersSnap.docs
        .map((d) => d.data() as UserRecord)
        .find((u) => u.phone.replace(/\D/g, '') === cleanPhone)
      if (found) return found
    }
  } catch {}

  return inMemoryUsers.find((u) => u.phone.replace(/\D/g, '') === cleanPhone) ?? null
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  await ensureSeeded()
  try {
    const docRef = doc(firestore, 'users', id)
    const docSnap = await withTimeout(getDoc(docRef), 2000, null)
    if (docSnap && docSnap.exists()) {
      return docSnap.data() as UserRecord
    }
  } catch {}

  return inMemoryUsers.find((u) => u.id === id) ?? null
}

export async function loginOrRegisterUser(
  name: string,
  phone: string,
  requestedRole?: 'citizen' | 'official',
): Promise<UserRecord> {
  await ensureSeeded()
  const cleanPhone = phone.trim().replace(/\D/g, '')
  const isOfficial = cleanPhone === '9999999999' || requestedRole === 'official'

  let user = await getUserByPhone(cleanPhone)

  if (user) {
    let updated = false
    if (name.trim() && user.name !== name.trim()) {
      user.name = name.trim()
      user.initials = generateInitials(user.name)
      updated = true
    }
    if (isOfficial && user.role !== 'official') {
      user.role = 'official'
      updated = true
    }
    if (updated) {
      setDoc(doc(firestore, 'users', user.id), user, { merge: true }).catch((err) => {
        console.warn('Failed to update user in Firestore:', err.message || err)
      })
    }
    return user
  }

  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    name: name.trim() || (isOfficial ? 'Municipal Officer' : 'Citizen'),
    phone: cleanPhone,
    initials: generateInitials(name.trim() || (isOfficial ? 'Municipal Officer' : 'Citizen')),
    tier: isOfficial ? 'Gold' : 'Bronze',
    points: isOfficial ? 5000 : 50,
    reports: 0,
    resolved: isOfficial ? 10 : 0,
    role: isOfficial ? 'official' : 'citizen',
  }

  inMemoryUsers.push(newUser)
  setDoc(doc(firestore, 'users', newUser.id), newUser).catch((err) => {
    console.warn('Failed to register user in Firestore:', err.message || err)
  })

  return newUser
}

export async function setOfficerRole(
  phone: string,
  isOfficial: boolean = true,
  name?: string,
): Promise<UserRecord> {
  await ensureSeeded()
  const cleanPhone = phone.trim().replace(/\D/g, '')

  let user = await getUserByPhone(cleanPhone)
  const role: 'citizen' | 'official' = isOfficial ? 'official' : 'citizen'

  if (user) {
    user.role = role
    if (name?.trim()) {
      user.name = name.trim()
      user.initials = generateInitials(user.name)
    }
    if (isOfficial) {
      user.tier = 'Gold'
      user.points = Math.max(user.points, 5000)
    }
    await setDoc(doc(firestore, 'users', user.id), user, { merge: true }).catch((err) => {
      console.warn('Failed to set officer role in Firestore:', err)
    })
    return user
  }

  const newUser: UserRecord = {
    id: `user-officer-${Date.now()}`,
    name: name?.trim() || 'Municipal Officer',
    phone: cleanPhone,
    initials: generateInitials(name?.trim() || 'Municipal Officer'),
    tier: 'Gold',
    points: 5000,
    reports: 0,
    resolved: 10,
    role,
  }

  inMemoryUsers.push(newUser)
  await setDoc(doc(firestore, 'users', newUser.id), newUser).catch((err) => {
    console.warn('Failed to create officer in Firestore:', err)
  })

  return newUser
}

export async function getAllUsers(): Promise<UserRecord[]> {
  await ensureSeeded()
  try {
    const usersSnap = await withTimeout(getDocs(collection(firestore, 'users')), 2000, null)
    if (usersSnap && !usersSnap.empty) {
      const users = usersSnap.docs.map((d) => d.data() as UserRecord)
      inMemoryUsers = users
      return users
    }
  } catch {}

  return inMemoryUsers
}

export async function getAllIssues(): Promise<Issue[]> {
  try {
    const issues = await withTimeout(getIssuesFromFirestore(), 3000, [])
    if (issues && issues.length > 0) {
      inMemoryIssues = issues
      return issues
    }
  } catch (err) {
    console.warn('getIssuesFromFirestore warning:', err)
  }

  return inMemoryIssues.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function createIssue(
  newIssueData: Partial<Issue> & { reporterId?: string },
): Promise<Issue> {
  const id = `CF-${Math.floor(1000 + Math.random() * 9000)}`
  const category = (newIssueData.category as any) || 'Pothole'
  const rawPhoto = newIssueData.photo || ''

  savePhoto(id, rawPhoto, category)

  const userDesc = (newIssueData.description || '').trim()
  const customTitle =
    newIssueData.title ||
    (userDesc.length > 5
      ? userDesc.length > 45
        ? `${userDesc.slice(0, 45)}...`
        : userDesc
      : `${category} reported`)

  const issue: Issue = {
    id,
    title: customTitle,
    category,
    status: 'reported',
    severity: (newIssueData.severity as any) || 'Medium',
    address: newIssueData.address || 'Near current location',
    ward: 'Ward 4',
    distanceKm: 0.2,
    description: userDesc || 'Reported by citizen',
    photo: `/api/photos/${id}`,
    afterPhoto: null,
    confirmations: 1,
    upvotes: 1,
    aiConfidence: 94,
    reporter: newIssueData.reporter || 'Citizen',
    reporterId: newIssueData.reporterId || CURRENT_USER.id,
    department: 'Public Works',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lat: typeof newIssueData.lat === 'number' && !isNaN(newIssueData.lat) ? newIssueData.lat : 19.0760,
    lng: typeof newIssueData.lng === 'number' && !isNaN(newIssueData.lng) ? newIssueData.lng : 72.8777,
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

  inMemoryIssues.unshift(issue)
  
  // Call Firestore to save issue — log warning if offline, but throw error if rule violation
  try {
    await createIssueInFirestore(issue)
  } catch (err: any) {
    console.warn('createIssueInFirestore error:', err.message || err)
    // If error is permission-denied, throw so user UI gets toast notification
    if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
      throw new Error('Firestore permission denied: Database rules rejected the write operation.')
    }
  }

  // Increment reporter stats in Firestore background
  if (issue.reporterId) {
    getUserById(issue.reporterId).then((user) => {
      if (user) {
        user.reports += 1
        user.points += 100
        if (user.points >= 2000) user.tier = 'Gold'
        else if (user.points >= 1000) user.tier = 'Silver'

        setDoc(doc(firestore, 'users', user.id), user, { merge: true }).catch(() => {})
      }
    })
  }

  return issue
}

export async function updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | null> {
  let issue: Issue | null = null

  try {
    issue = await withTimeout(getIssueFromFirestore(id), 2500, null)
  } catch {}

  if (!issue) {
    issue = inMemoryIssues.find((i) => i.id === id) || null
  }

  if (!issue) return null

  const oldStatus = issue.status
  if (updates.status && updates.status !== issue.status) {
    issue.status = updates.status
    const stageMap: Record<string, string> = {
      reported: 'Reported',
      assigned: 'Assigned to crew',
      'in-progress': 'Work in progress',
      resolved: 'Marked resolved',
    }
    issue.timeline.push({
      stage: updates.status as any,
      label: stageMap[updates.status] || updates.status,
      at: new Date().toISOString(),
      note: `Status updated to ${updates.status}`,
    })

    if (updates.status === 'resolved' && oldStatus !== 'resolved') {
      if (issue.reporterId) {
        getUserById(issue.reporterId).then((user) => {
          if (user) {
            user.resolved += 1
            user.points += 50
            setDoc(doc(firestore, 'users', user.id), user, { merge: true }).catch(() => {})
          }
        })
      }
    }
  }

  if (typeof updates.upvotes === 'number') {
    issue.upvotes = updates.upvotes
  }

  if (updates.department) {
    issue.department = updates.department
  }

  if (updates.afterPhoto) {
    issue.afterPhoto = updates.afterPhoto
  }

  issue.updatedAt = new Date().toISOString()
  
  // Call Firestore to update issue
  try {
    await updateIssueInFirestore(id, issue)
  } catch (err: any) {
    console.warn('updateIssueInFirestore error:', err.message || err)
    if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
      throw new Error('Firestore permission denied: Database rules rejected the update operation.')
    }
  }

  return issue
}
