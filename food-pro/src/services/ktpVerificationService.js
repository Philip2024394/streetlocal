/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KTP Verification Service — 4-step identity verification for Indonesia
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Steps:
 * 1. Phone OTP (already done at signup)
 * 2. KTP NIK (16-digit) + full name on KTP
 * 3. Selfie holding KTP — admin reviews photo match
 * 4. Bank account name must match KTP name
 *
 * Status: none → pending → approved / rejected
 */
import { supabase } from '@/lib/supabase'

const LOCAL_KEY = 'indoo_ktp_data'

// ── Validate NIK format (16 digits, Indonesian ID number) ────────────────────
export function validateNIK(nik) {
  const clean = nik.replace(/\s/g, '')
  if (!/^\d{16}$/.test(clean)) return { valid: false, reason: 'NIK must be exactly 16 digits' }
  // First 2 digits = province code (01-94)
  const province = parseInt(clean.slice(0, 2), 10)
  if (province < 1 || province > 94) return { valid: false, reason: 'Invalid province code' }
  return { valid: true, clean }
}

// ── Submit KTP for verification ──────────────────────────────────────────────
export async function submitKTPVerification(userId, {
  nik,
  ktpName,
  ktpPhotoFile,
  ktpSelfieFile,
  bankName,
  bankAccount,
  bankCode,
}) {
  // Validate NIK
  const nikResult = validateNIK(nik)
  if (!nikResult.valid) return { error: nikResult.reason }

  // Validate name match with bank
  if (!ktpName?.trim()) return { error: 'Full name on KTP is required' }
  if (!bankName?.trim()) return { error: 'Bank account holder name is required' }

  // Name match check (basic — admin does final review)
  const ktpNameNorm = ktpName.trim().toLowerCase().replace(/\s+/g, ' ')
  const bankNameNorm = bankName.trim().toLowerCase().replace(/\s+/g, ' ')
  if (ktpNameNorm !== bankNameNorm) {
    // Warn but don't block — admin will verify
    console.warn('[KTP] Name mismatch: KTP="%s" Bank="%s"', ktpName, bankName)
  }

  let ktpPhotoUrl = null
  let ktpSelfieUrl = null

  if (supabase) {
    // Upload KTP photo
    if (ktpPhotoFile) {
      const photoPath = `ktp/${userId}/${Date.now()}-ktp.${ktpPhotoFile.name.split('.').pop()}`
      const { data: photoData } = await supabase.storage.from('documents').upload(photoPath, ktpPhotoFile)
      if (photoData) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(photoPath)
        ktpPhotoUrl = publicUrl
      }
    }

    // Upload selfie holding KTP
    if (ktpSelfieFile) {
      const selfiePath = `ktp/${userId}/${Date.now()}-selfie.${ktpSelfieFile.name.split('.').pop()}`
      const { data: selfieData } = await supabase.storage.from('documents').upload(selfiePath, ktpSelfieFile)
      if (selfieData) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(selfiePath)
        ktpSelfieUrl = publicUrl
      }
    }

    // Update profile
    const { error } = await supabase.from('profiles').update({
      ktp_nik: nikResult.clean,
      ktp_name: ktpName.trim(),
      ktp_photo_url: ktpPhotoUrl,
      ktp_selfie_url: ktpSelfieUrl,
      ktp_status: 'pending',
      ktp_bank_name: bankName.trim(),
      ktp_bank_account: bankAccount?.trim() ?? null,
      ktp_bank_code: bankCode ?? null,
      id_verification_status: 'pending',
    }).eq('id', userId)

    if (error) return { error: error.message }
  }

  // Save locally for offline/demo
  const data = {
    nik: nikResult.clean,
    ktpName: ktpName.trim(),
    ktpPhotoUrl,
    ktpSelfieUrl,
    bankName: bankName.trim(),
    bankAccount: bankAccount?.trim(),
    bankCode,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))

  return { success: true, status: 'pending' }
}

// ── Get current KTP status ───────────────────────────────────────────────────
export async function getKTPStatus(userId) {
  if (supabase && userId) {
    const { data } = await supabase
      .from('profiles')
      .select('ktp_nik, ktp_name, ktp_status, ktp_rejected_reason, ktp_verified_at, ktp_bank_name')
      .eq('id', userId)
      .maybeSingle()
    if (data) return data
  }
  // Demo fallback
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY))
    return local ? { ktp_nik: local.nik, ktp_name: local.ktpName, ktp_status: local.status, ktp_bank_name: local.bankName } : { ktp_status: 'none' }
  } catch { return { ktp_status: 'none' } }
}

// ── Admin: approve KTP ───────────────────────────────────────────────────────
export async function approveKTP(userId) {
  if (!supabase) {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
    local.status = 'approved'
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
    return { success: true }
  }
  const { error } = await supabase.from('profiles').update({
    ktp_status: 'approved',
    ktp_verified_at: new Date().toISOString(),
    is_verified: true,
    id_verified: true,
    id_verification_status: 'approved',
  }).eq('id', userId)
  return error ? { error: error.message } : { success: true }
}

// ── Admin: reject KTP ────────────────────────────────────────────────────────
export async function rejectKTP(userId, reason) {
  if (!supabase) {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
    local.status = 'rejected'
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
    return { success: true }
  }
  const { error } = await supabase.from('profiles').update({
    ktp_status: 'rejected',
    ktp_rejected_reason: reason,
    is_verified: false,
    id_verified: false,
    id_verification_status: 'rejected',
  }).eq('id', userId)
  return error ? { error: error.message } : { success: true }
}

// ── Check if user is fully verified (all 4 steps) ───────────────────────────
export async function isFullyVerified(userId) {
  const status = await getKTPStatus(userId)
  return status.ktp_status === 'approved'
}
