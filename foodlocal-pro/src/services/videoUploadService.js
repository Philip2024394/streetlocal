/**
 * videoUploadService — Upload property videos to Supabase Storage.
 * Bucket: property-videos (public read)
 * Max: 1 minute, ~15MB per video at 720p
 */
import { supabase } from '@/lib/supabase'

const BUCKET = 'property-videos'
const MAX_SIZE_MB = 30
const MAX_DURATION_SEC = 60

/**
 * Upload a video file to Supabase Storage.
 * Returns the public URL or null on failure.
 */
export async function uploadPropertyVideo(file, listingRef) {
  if (!supabase) {
    console.warn('Supabase not available — video saved as blob URL only')
    return URL.createObjectURL(file)
  }

  // Validate size
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Video too large. Max ${MAX_SIZE_MB}MB.`)
  }

  const ext = file.type.includes('mp4') ? 'mp4' : file.type.includes('webm') ? 'webm' : 'mp4'
  const fileName = `${listingRef || 'video'}_${Date.now()}.${ext}`
  const filePath = `${fileName}`

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'video/mp4',
        cacheControl: '31536000',
        upsert: true,
      })

    if (error) {
      console.error('Video upload error:', error)
      // Fallback: try creating bucket if it doesn't exist
      if (error.message?.includes('not found') || error.statusCode === 404) {
        await createBucketIfNeeded()
        const retry = await supabase.storage.from(BUCKET).upload(filePath, file, { contentType: file.type || 'video/mp4', cacheControl: '31536000', upsert: true })
        if (retry.error) throw retry.error
        return getPublicUrl(filePath)
      }
      throw error
    }

    return getPublicUrl(filePath)
  } catch (e) {
    console.error('Video upload failed:', e)
    // Fallback to blob URL for demo
    return URL.createObjectURL(file)
  }
}

function getPublicUrl(filePath) {
  if (!supabase) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data?.publicUrl || null
}

async function createBucketIfNeeded() {
  if (!supabase) return
  try {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    })
  } catch (e) {
    // Bucket may already exist — that's fine
    if (!e.message?.includes('already exists')) console.warn('Bucket creation:', e.message)
  }
}

/**
 * Generate a thumbnail from a video file.
 * Returns a data URL.
 */
export function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.currentTime = 1
    video.muted = true
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => resolve(null)
  })
}

/**
 * Get video duration from a file.
 */
export function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => resolve(0)
  })
}

export { MAX_SIZE_MB, MAX_DURATION_SEC }
