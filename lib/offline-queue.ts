import { submitReport } from './api'
import { toast } from 'sonner'

export interface QueuedReport {
  queueId: string
  payload: any
  createdAt: string
  retryCount: number
}

const OFFLINE_QUEUE_KEY = 'nagar_seva_offline_reports_queue'

export function getOfflineQueue(): QueuedReport[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function enqueueOfflineReport(payload: any): QueuedReport {
  const queueId = `offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const item: QueuedReport = {
    queueId,
    payload: {
      ...payload,
      offlineQueuedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }

  if (typeof window !== 'undefined') {
    try {
      const queue = getOfflineQueue()
      queue.push(item)
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch (err) {
      console.warn('Failed to save report to local offline queue:', err)
    }
  }

  return item
}

export function removeQueuedReport(queueId: string) {
  if (typeof window === 'undefined') return
  try {
    const queue = getOfflineQueue()
    const updated = queue.filter((item) => item.queueId !== queueId)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated))
  } catch {}
}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let syncedCount = 0
  let failedCount = 0

  for (const item of queue) {
    try {
      const res = await submitReport(item.payload)
      if (res && res.id) {
        removeQueuedReport(item.queueId)
        syncedCount++
      }
    } catch (err) {
      console.warn(`Failed to sync queued report ${item.queueId}:`, err)
      failedCount++
    }
  }

  if (syncedCount > 0) {
    toast.success(`${syncedCount} offline report${syncedCount > 1 ? 's' : ''} submitted successfully!`, {
      description: 'Your queued complaints are now registered with municipal care.',
    })
  }

  return { synced: syncedCount, failed: failedCount }
}

// Auto-sync listener setup for browser connectivity
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    toast.info('Back online! Syncing offline reports…')
    flushOfflineQueue()
  })
}
