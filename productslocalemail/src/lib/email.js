/* Products Local Email — order email helper */
import { supabase } from './supabase'

/**
 * Send a customer order to the vendor's configured email address via the
 * `send-vendor-email` Supabase Edge Function (which uses Resend under the hood).
 *
 * Returns { ok, id } on success, or { error } on failure.
 */
export async function sendCustomerOrderEmail({
  vendorId,
  vendorEmail,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  orderPayload,
  summaryBody,
}) {
  if (!supabase) return { error: 'Supabase not configured' }
  if (!vendorEmail) return { error: 'Vendor email not configured. Ask the vendor to set their order email in shop settings.' }
  const { data, error } = await supabase.functions.invoke('send-vendor-email', {
    body: {
      vendorId,
      vendorEmail,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderPayload,
      summaryBody,
    },
  })
  if (error) return { error: error.message || 'Failed to send' }
  if (data && data.error) return { error: data.error }
  return { ok: true, id: data?.id }
}

export function fmtRupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}
