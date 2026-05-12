import { supabase } from '@/lib/supabase'
import { compressImageFile } from '@/utils/imageCompress'

const BUCKET = 'driver-documents'

/**
 * Upload a single driver document to Supabase Storage.
 * Compresses images before upload.
 * Returns the public URL.
 */
export async function uploadDriverDocument(userId, docKey, file) {
  if (!supabase) throw new Error('Supabase not configured')
  const compressed = await compressImageFile(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.75 })
  const ext  = compressed.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${docKey}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { upsert: true, contentType: compressed.type })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return publicUrl
}

/**
 * Create or update the driver_applications row for this user.
 * Uses upsert so resubmissions overwrite the previous entry.
 */
export async function submitDriverApplication(userId, driverType, documentUrls) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('driver_applications')
    .upsert({
      user_id:       userId,
      driver_type:   driverType,
      document_urls: documentUrls,
      status:        'pending',
      admin_notes:   null,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Upload a go-online selfie to Supabase Storage, log it, and update the profile.
 * Returns the public URL. Falls back gracefully if Supabase is not configured.
 */
export async function uploadGoOnlineSelfie(userId, blob) {
  if (!supabase) return null
  const path = `${userId}/${Date.now()}.jpg`

  const { error: uploadErr } = await supabase.storage
    .from('driver-selfies')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (uploadErr) throw new Error(uploadErr.message)

  const { data: { publicUrl } } = supabase.storage
    .from('driver-selfies')
    .getPublicUrl(path)

  // Store on profile for quick admin access
  await supabase.from('profiles').update({
    last_selfie_url: publicUrl,
    last_selfie_at:  new Date().toISOString(),
  }).eq('id', userId)

  // Audit log
  await supabase.from('driver_selfie_logs').insert({
    driver_id:  userId,
    selfie_url: publicUrl,
  })

  return publicUrl
}

/**
 * Fetch the current driver application for a user (null if none).
 */
export async function getDriverApplication(userId) {
  if (!supabase || !userId) return null

  const { data } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data ?? null
}
