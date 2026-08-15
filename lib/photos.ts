import fs from 'fs'
import path from 'path'
import os from 'os'
import { CATEGORY_FALLBACK_IMAGES } from '@/components/safe-image'

interface PhotoStore {
  [key: string]: {
    data: string
    category?: string
    createdAt: string
  }
}

let inMemoryPhotos: PhotoStore | null = null

function getPhotoFilePath(): string {
  try {
    const defaultDataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(defaultDataDir)) {
      fs.mkdirSync(defaultDataDir, { recursive: true })
    }
    return path.join(defaultDataDir, 'photos.json')
  } catch {
    return path.join(os.tmpdir(), 'civic_photos.json')
  }
}

function initPhotoStore(): PhotoStore {
  if (inMemoryPhotos) return inMemoryPhotos

  const filePath = getPhotoFilePath()
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      inMemoryPhotos = JSON.parse(raw) as PhotoStore
      return inMemoryPhotos
    }
  } catch {
    // Memory fallback
  }

  inMemoryPhotos = {}
  savePhotoStore(inMemoryPhotos)
  return inMemoryPhotos
}

function savePhotoStore(store: PhotoStore) {
  inMemoryPhotos = store
  try {
    const filePath = getPhotoFilePath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8')
  } catch {
    // Memory fallback for read-only serverless environment
  }
}

/** Save an uploaded photo to dedicated photos storage file */
export function savePhoto(id: string, photoData: string, category?: string) {
  const store = initPhotoStore()
  store[id] = {
    data: photoData,
    category: category || 'Pothole',
    createdAt: new Date().toISOString(),
  }
  savePhotoStore(store)
}

/** Retrieve photo from dedicated photos storage file */
export function getPhoto(id: string): { data: string; category?: string } | null {
  const store = initPhotoStore()
  if (store[id]) {
    return store[id]
  }
  return null
}
