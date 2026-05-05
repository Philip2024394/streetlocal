import { supabase } from '@/lib/supabase'

/**
 * Save profile fields to Supabase profiles table.
 */
export async function saveProfile({
  userId, displayName, dob, bio, city, country, activities, lookingFor, extraPhotos,
  speakingNative, speakingSecond,
  priceMin, priceMax, brandName, tradeRole, market,
  relationshipGoal, starSign, height,
  photoOffsetX, photoOffsetY, photoZoom,
  tags,
  instagramHandle, tiktokHandle, facebookHandle, websiteUrl, youtubeHandle,
  cuisineType, targetAudience, shopType,
}) {
  if (!supabase || !userId) return

  // Calculate age from dob string "YYYY-MM-DD"
  let age = null
  if (dob) {
    const birth = new Date(dob)
    const today = new Date()
    age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name:      displayName ?? null,
      dob:               dob ?? null,
      age:               age,
      bio:               bio ?? null,
      city:              city ?? null,
      country:           country ?? null,
      activities:        activities ?? [],
      looking_for:       lookingFor ?? null,
      extra_photos:      (extraPhotos ?? []).filter(Boolean),
      speaking_native:   speakingNative ?? null,
      speaking_second:   speakingSecond ?? null,
      price_min:         priceMin || null,
      price_max:         priceMax || null,
      brand_name:        brandName || null,
      trade_role:        tradeRole || null,
      market:            market || null,
      relationship_goal: relationshipGoal || null,
      star_sign:         starSign || null,
      height:            height || null,
      photo_offset_x:    photoOffsetX ?? 50,
      photo_offset_y:    photoOffsetY ?? 50,
      photo_zoom:        photoZoom ?? 1,
      tags:              (tags ?? []).filter(Boolean).slice(0, 10),
      instagram_handle:  instagramHandle || null,
      tiktok_handle:     tiktokHandle || null,
      facebook_handle:   facebookHandle || null,
      website_url:       websiteUrl || null,
      youtube_handle:    youtubeHandle || null,
      cuisine_type:      cuisineType || null,
      target_audience:   targetAudience?.length ? targetAudience : null,
      shop_type:         shopType || null,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

/**
 * Save contact options for a business user.
 *
 * contact_platform and chat_enabled are public — written to profiles.
 * contact_number is private — written to private_contacts (separate table,
 * owner-only RLS, never exposed in sessions_with_profiles view).
 * Buyers reach contact_number only via the get_contact_number RPC after payment.
 */
export async function saveContactOptions(userId, { contactPlatform, contactNumber, chatEnabled }) {
  if (!supabase || !userId) return

  // Public fields stay on profiles
  const { error } = await supabase
    .from('profiles')
    .update({
      contact_platform: contactPlatform ?? null,
      chat_enabled:     chatEnabled    ?? true,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', userId)
  if (error) throw new Error(error.message)

  // Private field: upsert or delete from private_contacts
  if (contactNumber) {
    const { error: pcError } = await supabase
      .from('private_contacts')
      .upsert({ user_id: userId, contact_number: contactNumber, updated_at: new Date().toISOString() })
    if (pcError) throw new Error(pcError.message)
  } else {
    // Null means seller is clearing their contact number
    await supabase.from('private_contacts').delete().eq('user_id', userId)
  }
}

/**
 * Upload avatar file to Supabase Storage and save the public URL to profiles.
 * Returns the public URL.
 */
export async function uploadAvatar(userId, file) {
  if (!supabase || !userId || !file) return null

  const ext  = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  // Persist URL to profiles row
  await supabase
    .from('profiles')
    .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return publicUrl
}

/**
 * Upload one of the 4 gallery (extra) photos to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadGalleryPhoto(userId, file, index) {
  if (!supabase || !userId || !file) return null

  const ext  = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/gallery_${index}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  return publicUrl
}

/**
 * Record a profile view (once per viewer per day).
 */
export async function recordProfileView(viewedUserId) {
  if (!supabase || !viewedUserId) return
  await supabase
    .from('profile_views')
    .upsert({ viewed_id: viewedUserId }, { onConflict: 'viewer_id,viewed_id,date_trunc(day, created_at)', ignoreDuplicates: true })
    .then(() => {})
}

// ─────────────────────────────────────────────────────────────────────────────
// GDPR COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete all user data and request account deletion via Edge Function.
 * GDPR Article 17 — Right to Erasure.
 *
 * Flow:
 *  1. Delete all photos from Storage
 *  2. Delete profile row (cascades to sessions, messages via FK)
 *  3. Call delete-account edge function to remove the auth user
 */
export async function deleteAccount(userId) {
  if (!supabase || !userId) return

  // 1. Remove all storage files for this user
  try {
    const { data: files } = await supabase.storage.from('avatars').list(userId)
    if (files?.length) {
      const paths = files.map(f => `${userId}/${f.name}`)
      await supabase.storage.from('avatars').remove(paths)
    }
  } catch {
    // Non-fatal — continue with account deletion
  }

  // 2. Wipe profile data (RLS allows owner to delete their own row)
  await supabase.from('profiles').delete().eq('id', userId)

  // 3. Delete the auth user via Edge Function (requires service_role server-side)
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { userId },
  })
  if (error) throw new Error('Account deletion failed — please contact support@indoo.id')
}

/**
 * Export all data held for the current user as a downloadable JSON file.
 * GDPR Article 20 — Right to Data Portability.
 */
export async function exportMyData(userId) {
  if (!supabase || !userId) return

  const [profileRes, sessionsRes, messagesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('sessions').select('*').eq('user_id', userId),
    supabase.from('messages').select('*').eq('sender_id', userId),
  ])

  const payload = {
    _exported_at: new Date().toISOString(),
    _note: 'Your personal data export from Indoo. Contact privacy@indoo.id to request changes.',
    profile:  profileRes.data  ?? null,
    sessions: sessionsRes.data ?? [],
    messages: messagesRes.data ?? [],
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `indoo-my-data-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
