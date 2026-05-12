/**
 * kprRatesService — Fetch and manage KPR bank interest rates.
 * Reads from Supabase `kpr_bank_rates` table, falls back to defaults.
 */
import { supabase } from '@/lib/supabase'

export const DEFAULT_BANKS = [
  { id: 1, bank_name: 'BCA',     rate: 7.5,  emoji: '🏦', is_active: true, sort_order: 1 },
  { id: 2, bank_name: 'Mandiri', rate: 8.0,  emoji: '🏛️', is_active: true, sort_order: 2 },
  { id: 3, bank_name: 'BNI',     rate: 8.5,  emoji: '🏢', is_active: true, sort_order: 3 },
]

/** Fetch active KPR bank rates (for frontend calculator) */
export async function fetchKprRates() {
  if (!supabase) return DEFAULT_BANKS
  const { data, error } = await supabase
    .from('kpr_bank_rates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error || !data?.length) return DEFAULT_BANKS
  return data
}

/** Fetch all KPR bank rates including inactive (for admin) */
export async function fetchAllKprRates() {
  if (!supabase) return DEFAULT_BANKS
  const { data, error } = await supabase
    .from('kpr_bank_rates')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error || !data?.length) return DEFAULT_BANKS
  return data
}

/** Create or update a KPR bank rate */
export async function upsertKprRate(rate) {
  if (!supabase) throw new Error('Supabase not configured')
  const payload = {
    bank_name: rate.bank_name,
    rate: rate.rate,
    emoji: rate.emoji || '🏦',
    is_active: rate.is_active ?? true,
    sort_order: rate.sort_order ?? 0,
    updated_at: new Date().toISOString(),
  }
  if (rate.id) payload.id = rate.id
  const { data, error } = await supabase
    .from('kpr_bank_rates')
    .upsert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/** Delete a KPR bank rate */
export async function deleteKprRate(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('kpr_bank_rates').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
