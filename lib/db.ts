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

export async function loginOrRegisterUser(name: string, phone: string): Promise<UserRecord> {
  await ensureSeeded()
  const cleanPhone = phone.trim().replace(/\D/g, '')

  let user = await getUserByPhone(cleanPhone)

  if (user) {
    if (name.trim() && user.name !== name.trim()) {
      user.name = name.trim()
      user.initials = generateInitials(user.name)
      setDoc(doc(firestore, 'users', user.id), user, { merge: true }).catch(() => {})
    }
    return user
  }

  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    name: name.trim() || 'Citizen',
    phone: cleanPhone,
    initials: generateInitials(name.trim() || 'Citizen'),
    tier: 'Bronze',
    points: 50, // Welcome bonus
    reports: 0,
    resolved: 0,
  }

  inMemoryUsers.push(newUser)
  setDoc(doc(firestore, 'users', newUser.id), newUser).catch(() => {})

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
  
  // Call the new Firestore function to save the issue
  createIssueInFirestore(issue).catch((err) => {
    console.warn('createIssueInFirestore error:', err)
  })

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
  
  // Call the new Firestore function to update the issue
  updateIssueInFirestore(id, issue).catch((err) => {
    console.warn('updateIssueInFirestore error:', err)
  })

  return issue
}
