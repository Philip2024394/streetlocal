import { supabase } from '@/lib/supabase'

const DEMO = !supabase

// ── Plan limits ──────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:     { products: 3,  images: 3,  unlimitedChat: false, boost: false },
  standard: { products: 50, images: 20, unlimitedChat: true,  boost: false },
  premium:  { products: Infinity, images: Infinity, unlimitedChat: true, boost: true },
}

export const PLAN_PRICES = {
  standard: { idr: 40000, label: '40.000 rp/bln' },
  premium:  { idr: 79000, label: '79.000 rp/bln' },
}

export const UNLOCK_PACK  = { credits: 2, usd: 1.99, label: '2 unlocks — $1.99' }
export const BUYER_UNLOCK = { days: 30,  usd: 1.99 }

// ── Chat session ─────────────────────────────────────────────────────────────

/** Start or fetch the chat session for this conversation.
 *  Returns { startedAt, unlockedAt } — unlockedAt null means still in free window */
export async function getChatSession(conversationId, userId) {
  if (DEMO) {
    const key = `cs_${conversationId}_${userId}`
    const raw = sessionStorage.getItem(key)
    if (raw) return JSON.parse(raw)
    const session = { startedAt: Date.now(), unlockedAt: null }
    sessionStorage.setItem(key, JSON.stringify(session))
    return session
  }

  // Upsert on first open
  const { data, error } = await supabase
    .from('chat_sessions')
    .upsert(
      { conversation_id: conversationId, user_id: userId },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: false }
    )
    .select('started_at, unlocked_at')
    .single()

  if (error) throw error
  return {
    startedAt:  new Date(data.started_at).getTime(),
    unlockedAt: data.unlocked_at ? new Date(data.unlocked_at).getTime() : null,
  }
}

/** Mark a chat session as unlocked (after payment or subscription check) */
export async function markChatUnlocked(conversationId, userId, unlockType) {
  if (DEMO) {
    const key = `cs_${conversationId}_${userId}`
    const raw = sessionStorage.getItem(key)
    const session = raw ? JSON.parse(raw) : { startedAt: Date.now() }
    session.unlockedAt = Date.now()
    sessionStorage.setItem(key, JSON.stringify(session))
    return
  }

  await supabase
    .from('chat_sessions')
    .update({ unlocked_at: new Date().toISOString(), unlock_type: unlockType })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
}

// ── Subscription ─────────────────────────────────────────────────────────────

/** Fetch the active subscription for the current user. Returns null if none. */
export async function getActiveSubscription(userId) {
  if (DEMO) return null

  const { data } = await supabase
    .from('seller_subscriptions')
    .select('plan, status, renews_at, boost_used_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('renews_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

/** Get the seller_plan field from profiles (synced by webhook / admin). */
export async function getSellerPlan(userId) {
  if (DEMO) return 'free'

  const { data } = await supabase
    .from('profiles')
    .select('seller_plan')
    .eq('id', userId)
    .single()

  return data?.seller_plan ?? 'free'
}

// ── Unlock credits ────────────────────────────────────────────────────────────

/** How many unlock credits does the user have left? */
export async function getUnlockBalance(userId) {
  if (DEMO) {
    return parseInt(localStorage.getItem('demo_unlock_balance') ?? '0', 10)
  }

  const { data, error } = await supabase.rpc('get_unlock_balance', { p_user_id: userId })
  if (error) return 0
  return data ?? 0
}

/** Consume one credit. Returns true if successful, false if none available. */
export async function consumeUnlockCredit(userId) {
  if (DEMO) {
    const bal = parseInt(localStorage.getItem('demo_unlock_balance') ?? '0', 10)
    if (bal <= 0) return false
    localStorage.setItem('demo_unlock_balance', String(bal - 1))
    return true
  }

  const { data, error } = await supabase.rpc('consume_unlock_credit', { p_user_id: userId })
  if (error) return false
  return data === true
}

/** Record a purchase of 2 unlock credits (called after Stripe confirms). */
export async function recordUnlockPurchase(userId, stripePaymentIntentId) {
  if (DEMO) {
    const bal = parseInt(localStorage.getItem('demo_unlock_balance') ?? '0', 10)
    localStorage.setItem('demo_unlock_balance', String(bal + UNLOCK_PACK.credits))
    return
  }

  await supabase.from('chat_unlocks').insert({
    user_id:      userId,
    credits_total: UNLOCK_PACK.credits,
    price_usd:    UNLOCK_PACK.usd,
    stripe_pi_id: stripePaymentIntentId ?? null,
  })
}

// ── Stripe checkout helpers ───────────────────────────────────────────────────

/** Open Stripe Checkout for 2 unlock credits ($1.99).
 *  In demo mode: simulates purchase immediately. */
export async function purchaseUnlockPack(userId, onSuccess) {
  if (DEMO) {
    await recordUnlockPurchase(userId, null)
    onSuccess?.()
    return
  }

  // TODO: call your Supabase Edge Function / backend to create Stripe session
  // const res = await fetch('/api/create-checkout', { method: 'POST', body: JSON.stringify({ type: 'unlock_pack', userId }) })
  // const { url } = await res.json()
  // window.location.href = url

  // For now: demo fallback
  await recordUnlockPurchase(userId, null)
  onSuccess?.()
}

/** Open Stripe Checkout for a monthly subscription.
 *  plan = 'standard' | 'premium' */
export async function purchaseSubscription(userId, plan, onSuccess) {
  void userId // used in backend call when Stripe is wired
  if (DEMO) {
    localStorage.setItem('demo_seller_plan', plan)
    onSuccess?.()
    return
  }

  // TODO: call backend
  // const res = await fetch('/api/create-checkout', { method: 'POST', body: JSON.stringify({ type: 'subscription', plan, userId }) })
  // const { url } = await res.json()
  // window.location.href = url

  localStorage.setItem('demo_seller_plan', plan)
  onSuccess?.()
}

// ── Buyer account-wide unlock ($1.99 · 30 days · all sellers) ────────────────

/** Check if buyer has an active account-wide unlock. */
export async function getBuyerUnlockStatus(userId) {
  if (DEMO) {
    const raw = localStorage.getItem('demo_buyer_unlock_expiry')
    if (!raw) return { active: false, expiresAt: null }
    const expiresAt = parseInt(raw, 10)
    return { active: Date.now() < expiresAt, expiresAt }
  }

  const { data } = await supabase
    .from('chat_unlocks')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('unlock_type', 'buyer_account')
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
    ? { active: true, expiresAt: new Date(data.expires_at).getTime() }
    : { active: false, expiresAt: null }
}

/** Record a buyer account-wide unlock (30 days). Returns expiry timestamp. */
export async function activateBuyerUnlock(userId) {
  const expiresAt = Date.now() + BUYER_UNLOCK.days * 24 * 60 * 60 * 1000

  if (DEMO) {
    localStorage.setItem('demo_buyer_unlock_expiry', String(expiresAt))
    return expiresAt
  }

  await supabase.from('chat_unlocks').insert({
    user_id:       userId,
    unlock_type:   'buyer_account',
    credits_total: 0,
    price_usd:     BUYER_UNLOCK.usd,
    expires_at:    new Date(expiresAt).toISOString(),
  })
  return expiresAt
}

/**
 * Fetch a seller's contact details for auto-posting after buyer unlocks.
 * Returns phone (via gated RPC) + social links from profiles.
 */
export async function getSellerContactDetails(sellerId, buyerId) {
  if (DEMO) {
    return {
      displayName: 'Demo Seller',
      phone:       '+62 812 0000 0000',
      instagram:   'demo_seller',
      tiktok:      null,
      facebook:    null,
      youtube:     null,
      website:     null,
    }
  }

  const [profileResult, phoneResult] = await Promise.allSettled([
    supabase
      .from('profiles')
      .select('display_name, instagram_handle, tiktok_handle, facebook_handle, youtube_handle, website_url')
      .eq('id', sellerId)
      .single(),
    supabase.rpc('get_contact_number', { buyer_uuid: buyerId, seller_uuid: sellerId }),
  ])

  const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null
  const phone   = phoneResult.status === 'fulfilled'   ? phoneResult.value.data  : null

  return {
    displayName: profile?.display_name        ?? null,
    phone:       phone                         ?? null,
    instagram:   profile?.instagram_handle     ?? null,
    tiktok:      profile?.tiktok_handle        ?? null,
    facebook:    profile?.facebook_handle      ?? null,
    youtube:     profile?.youtube_handle       ?? null,
    website:     profile?.website_url          ?? null,
  }
}

/** Mark the monthly boost as used for this billing period. */
export async function useMonthlyBoost(userId) {
  if (DEMO) {
    localStorage.setItem('demo_boost_used', new Date().toISOString())
    return
  }

  await supabase
    .from('seller_subscriptions')
    .update({ boost_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active')
}
