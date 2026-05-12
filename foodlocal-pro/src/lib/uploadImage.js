import { supabase } from './supabase'
import { compressImageFile } from '@/utils/imageCompress'

const BUCKET = 'images'
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic', 'heif', 'bmp', 'tiff']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * Automatically compresses images before upload (800px max, 70% quality).
 * Falls back to a local object URL in demo mode (no Supabase).
 *
 * @param {File} file - the image file to upload
 * @param {string} folder - sub-folder inside the bucket (e.g. 'avatars', 'products')
 * @returns {Promise<string>} public URL
 */
export async function uploadImage(file, folder = 'general') {
  if (!file) throw new Error('No file provided')

  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTS.includes(ext)) {
    throw new Error(`Format .${ext} not supported. Use PNG, JPG, WEBP, GIF, etc.`)
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 10 MB')
  }

  // Compress image before upload (800px max width, 70% quality)
  const compressed = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 })

  // Demo mode — return a local blob URL so previews still work
  if (!supabase) {
    return URL.createObjectURL(compressed)
  }

  const compExt = compressed.name.split('.').pop().toLowerCase()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${folder}/${unique}.${compExt}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { upsert: false, contentType: compressed.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
