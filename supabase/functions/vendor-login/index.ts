// vendor-login — Supabase Auth bridge for the existing
// vendor_accounts table.
//
// THE PROBLEM
// We want RLS policies that gate writes by vendor_id. Supabase's
// PostgREST verifies JWTs signed by Supabase Auth — we can't sign
// our own without the legacy JWT secret (not exposed on newer
// projects). Solution: every vendor gets a matching auth.users row
// with vendor_id baked into app_metadata (server-only, can't be
// tampered with from the client). RLS reads
// auth.jwt() -> 'app_metadata' ->> 'vendor_id'.
//
// THIS FUNCTION
// Idempotent. Takes { phone, password } (or { vendor_id: 'demo' }):
//   1. Verifies credentials against vendor_accounts.
//   2. Looks up or creates a matching auth.users row with
//      email = <phone>@vendor.streetlocal.local, same password.
//   3. Sets app_metadata.vendor_id = vendor.id (admin-only metadata
//      — clients can't modify it, so it's safe in the JWT).
//   4. Returns { email, vendor, demo? } — the CLIENT then calls
//      supabase.auth.signInWithPassword({ email, password }) to
//      obtain a real Supabase-signed JWT with the vendor_id claim.
//
// For the demo vendor (DEMO_VENDOR_UUID), uses a fixed email +
// fixed password so anyone can claim a demo session.
//
// Deploy:
//   supabase functions deploy vendor-login --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' }, status })

const DEMO_VENDOR_UUID = '00000000-0000-0000-0000-00000000d0c0'
const DEMO_EMAIL = 'demo@vendor.streetlocal.local'
const DEMO_PASSWORD = 'streetlocal-demo-public-2025'   // intentionally public — only writes are sandboxed by RLS to the demo vendor
const EMAIL_DOMAIN = 'vendor.streetlocal.local'

function synthEmail (phone: string): string {
  return `${phone.replace(/[^0-9]/g, '')}@${EMAIL_DOMAIN}`
}

// Find auth.users by email — Supabase's admin listUsers is paginated;
// we filter via the `email` query param.
async function findAuthUserByEmail (admin: ReturnType<typeof createClient>, email: string) {
  // The admin API doesn't have a direct getByEmail; we use listUsers
  // with a small page and post-filter. Acceptable since email is unique.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw error
  return (data.users || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase()) || null
}

async function ensureAuthUser (admin: ReturnType<typeof createClient>, params: {
  email: string,
  password: string,
  vendor_id: string,
}) {
  const existing = await findAuthUserByEmail(admin, params.email)
  if (existing) {
    // Re-set app_metadata.vendor_id every time (cheap, idempotent —
    // covers the case where a vendor was created before this function
    // existed and has no vendor_id claim yet). Also re-set password
    // so a vendor_accounts password change syncs over.
    await admin.auth.admin.updateUserById(existing.id, {
      password: params.password,
      app_metadata: { ...(existing.app_metadata || {}), vendor_id: params.vendor_id, provider: 'streetlocal' },
    })
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    app_metadata: { vendor_id: params.vendor_id, provider: 'streetlocal' },
  })
  if (error || !data?.user) throw new Error(error?.message || 'Failed to create auth user')
  return data.user.id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let body: { phone?: string, password?: string, vendor_id?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // ── DEMO PATH ──────────────────────────────────────────────────
  // Anyone can sign in as the demo vendor — the JWT they receive
  // ONLY grants write access to DEMO_VENDOR_UUID's rows (via RLS).
  // Used by the public donut app + landing iframe preview.
  if (body.vendor_id === 'demo' || body.vendor_id === DEMO_VENDOR_UUID) {
    try {
      await ensureAuthUser(admin, { email: DEMO_EMAIL, password: DEMO_PASSWORD, vendor_id: DEMO_VENDOR_UUID })
      const { data: vendor } = await admin.from('vendor_accounts')
        .select('id, shop_name, status, plan_level, plan_tier, shop_logo, slug')
        .eq('id', DEMO_VENDOR_UUID).maybeSingle()
      return json({ email: DEMO_EMAIL, password: DEMO_PASSWORD, vendor, demo: true })
    } catch (e) {
      return json({ error: 'Failed to prepare demo session', detail: String(e) }, 500)
    }
  }

  // ── VENDOR PATH ────────────────────────────────────────────────
  const phone = String(body.phone || '').replace(/[^0-9]/g, '')
  const password = String(body.password || '')
  if (!phone || !password) return json({ error: 'phone and password required' }, 400)

  const { data: vendor, error } = await admin.from('vendor_accounts')
    .select('id, shop_name, status, plan_level, plan_tier, shop_logo, slug, password_hash, phone')
    .eq('phone', phone)
    .maybeSingle()
  if (error) return json({ error: 'Lookup failed', detail: error.message }, 500)
  if (!vendor) return json({ error: 'Wrong phone or password' }, 401)
  if (vendor.password_hash !== password) return json({ error: 'Wrong phone or password' }, 401)

  try {
    const email = synthEmail(phone)
    await ensureAuthUser(admin, { email, password, vendor_id: vendor.id })
    const { password_hash: _omit, ...vendorPublic } = vendor
    return json({ email, vendor: vendorPublic })
  } catch (e) {
    return json({ error: 'Failed to provision auth session', detail: String(e) }, 500)
  }
})
