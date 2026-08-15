export type IssueStatus = 'reported' | 'assigned' | 'in-progress' | 'resolved'

export type IssuePhase = 'pending' | 'progress' | 'resolved'

export type Severity = 'Low' | 'Medium' | 'High'

export type Category =
  | 'Pothole'
  | 'Streetlight'
  | 'Graffiti'
  | 'Trash & Litter'
  | 'Water Leak'
  | 'Sidewalk'
  | 'Signage'
  | 'Roads'
  | 'Water'
  | 'Sanitation'
  | 'Electricity'
  | 'Parks'
  | 'Drainage'
  | 'Street Light'
  | 'Other'

export interface TimelineEntry {
  stage: IssueStatus
  label: string
  at: string | null
  note?: string
}

export interface Comment {
  id: string
  author: string
  role: 'citizen' | 'department' | 'system'
  at: string
  text: string
}

export interface Issue {
  id: string
  title: string
  category: Category
  description: string
  photo: string
  afterPhoto: string | null
  status: IssueStatus
  severity: Severity
  upvotes: number
  confirmations: number
  reporter: string
  reporterId: string
  ward: string
  department: string
  address: string
  lat: number
  lng: number
  /** Position on the stylized city map, 0-100 percentage */
  mapX: number
  mapY: number
  distanceKm: number
  createdAt: string
  updatedAt: string
  slaHours: number
  aiConfidence: number
  timeline: TimelineEntry[]
  comments: Comment[]
}

export interface CivicStats {
  resolvedThisMonth: number
  activeReporters: number
  avgResolutionDays: number
  totalOpen: number
}

export type BadgeTier = 'Bronze' | 'Silver' | 'Gold'

export interface Reporter {
  id: string
  name: string
  initials: string
  points: number
  tier: BadgeTier
  reports: number
  resolved: number
}

export interface AppNotification {
  id: string
  issueId: string
  title: string
  body: string
  at: string
  phase: IssuePhase
  unread: boolean
}

export interface CitizenTitle {
  id: string
  name: string
  icon: string
  description: string
  category?: string
  requiredCount: number
  currentCount: number
  unlocked: boolean
}

