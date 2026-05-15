/* ─────────────────────────────────────────────────────────────
   Per-vendor image library — record / list / soft-delete.
   Every upload that goes through uploadMenuImage() is recorded
   here so the same URL can be picked again from any other
   image slot in the app. Backed by the vendor_image_library
   table (see migration 20260608000000_vendor_image_library.sql).
   ───────────────────────────────────────────────────────────── */
import { supabase } from './supabase'

// Record an uploaded URL in the vendor's image library so it can be
// re-picked from the gallery later. Idempotent — the unique index on
// (vendor_id, url) makes duplicate calls harmless.
//   kind  semantic slot the image is for (drives picker filtering).
//   meta  optional { label, bytes, width, height } captured at upload.
export async function recordVendorImage (vendorId, url, kind = 'other', meta = {}) {
  if (!supabase || !vendorId || !url) return
  if (String(vendorId).startsWith('local')) return
  try {
    await supabase.from('vendor_image_library').upsert({
      vendor_id: vendorId,
      url,
      kind,
      label: meta.label || null,
      bytes: meta.bytes || null,
      width: meta.width || null,
      height: meta.height || null,
    }, { onConflict: 'vendor_id,url', ignoreDuplicates: true })
  } catch { /* fire-and-forget — library record loss never blocks upload */ }
}

// Read the vendor's library — optional kind filter, omits soft-deleted.
// limit caps the result so the picker stays responsive even for power
// users with hundreds of uploads. Pagination can be added later if
// vendors complain about not seeing older images.
export async function listVendorImages (vendorId, kind = null, limit = 200) {
  if (!supabase || !vendorId || String(vendorId).startsWith('local')) return []
  try {
    let q = supabase
      .from('vendor_image_library')
      .select('id, url, kind, label, width, height, created_at')
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (kind) q = q.eq('kind', kind)
    const { data, error } = await q
    if (error) return []
    return data || []
  } catch { return [] }
}

// Soft-delete a library row. The image stays on storage so any slot
// that still references the URL keeps working — only the picker
// hides it. A pg_cron job (added later) hard-deletes rows with
// deleted_at older than 30 days.
export async function softDeleteVendorImage (id) {
  if (!supabase || !id) return false
  try {
    const { error } = await supabase
      .from('vendor_image_library')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  } catch { return false }
}

// One-shot backfill — first time a vendor opens the picker, scoop up
// any URLs they're already using on other slots and add them to the
// library so nothing they've customised "disappears" from the picker.
// Returns the number of rows actually inserted.
export async function backfillVendorImages (vendorId, urlsByKind) {
  if (!supabase || !vendorId || String(vendorId).startsWith('local')) return 0
  const rows = []
  for (const [kind, urls] of Object.entries(urlsByKind || {})) {
    for (const url of (urls || [])) {
      if (typeof url === 'string' && url.startsWith('http')) {
        rows.push({ vendor_id: vendorId, url, kind, label: null })
      }
    }
  }
  if (rows.length === 0) return 0
  try {
    const { error } = await supabase
      .from('vendor_image_library')
      .upsert(rows, { onConflict: 'vendor_id,url', ignoreDuplicates: true })
    return error ? 0 : rows.length
  } catch { return 0 }
}
