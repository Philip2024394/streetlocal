import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * Initiates a Stripe Checkout session to unlock a seller's contact details.
 * In demo mode (no supabase): simulates success after a short delay.
 */
export async function initiateContactUnlock({ buyerUserId, sellerUserId, sessionId, stripeAmount, stripeCurrency }) {
  if (!supabase) {
    // Demo mode — simulate payment
    await delay(1200)
    window.dispatchEvent(new CustomEvent('demo:contact-unlock-success', {
      detail: { sessionId, sellerUserId }
    }))
    return
  }

  const { data, error } = await supabase.functions.invoke('create-contact-checkout', {
    body: {
      buyerUserId,
      sellerUserId,
      sessionId,
      stripeAmount,
      stripeCurrency,
      successUrl: `${window.location.origin}/?contact_unlock=success&seller=${sellerUserId}`,
      cancelUrl: `${window.location.origin}/`,
    }
  })

  if (error || !data?.checkoutUrl) throw new Error(error?.message ?? 'Could not start payment')
  window.location.href = data.checkoutUrl
}

/**
 * Checks if the buyer has already unlocked a seller's contact and returns
 * the contact details if so.
 *
 * Calls get_contact_number RPC which enforces the contact_unlocks gate
 * server-side — contact_number is never read from profiles directly.
 * Returns { unlocked: bool, contactNumber, contactPlatform }.
 */
export async function getContactUnlock(buyerUserId, sellerUserId) {
  if (!supabase) return { unlocked: false }

  const { data, error } = await supabase.rpc('get_contact_number', {
    p_buyer_user_id:  buyerUserId,
    p_seller_user_id: sellerUserId,
  })

  // Any error — including the 'not_unlocked' exception — means not yet unlocked
  if (error) return { unlocked: false }

  return {
    unlocked:        true,
    contactNumber:   data?.contactNumber   ?? null,
    contactPlatform: data?.contactPlatform ?? null,
  }
}

/**
 * Reads the current user's own contact number from private_contacts.
 * Owner-only RLS allows this; no unlock row required for self-read.
 * Used by ContactOptionsSheet to pre-populate the number field.
 */
export async function getMyContactNumber(userId) {
  if (!supabase || !userId) return null
  const { data } = await supabase
    .from('private_contacts')
    .select('contact_number')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.contact_number ?? null
}
