// resolve-pricing — server-side pricing authority.
//
// Public landing + vendor signup both call this on mount. We trust the
// request's IP (from edge headers), look it up via ipapi.is (free tier
// includes vpn/proxy/tor/datacenter flags), and return:
//
//   { country, currency, tier, isVPN, source }
//
// Rules:
//   1. If IP flags VPN / proxy / hosting → return US pricing. Always.
//      Even if the IP is geolocated in Asia. This is the bypass guard.
//   2. If IP geolocates to a recognised pricing market → return that
//      market's pricing.
//   3. Otherwise (unknown country) → US pricing as safe default.
//
// Tier in the response refers to the COUNTRY's pricing band, not the
// vendor's plan_level (that's a separate field).
//
// Browser timezone + Accept-Language can be passed in the request body
// and used to triangulate: if any disagrees with IP country, we also
// fall back to US. (Real Indonesian user has IP=ID + tz=Asia/Jakarta +
// lang=id-ID; VPN user fails at least 2 of 3.)
//
// Deploy:
//   supabase functions deploy resolve-pricing --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' }, status })

// Asia + Middle East get PPP-discounted pricing. Everyone else (the
// vast majority of pricing-protected markets) gets the USD anchor.
const PPP_COUNTRIES = new Set([
  'ID', 'TH', 'VN', 'PH', 'IN', 'MY', 'AE', 'SA',
])

// Countries that get their own named currency tier (everyone else falls
// to US). We only enumerate them so the response can carry the right
// currency code.
const KNOWN_MARKETS = new Set([
  'US', 'GB', 'AU', 'CA', 'NZ', 'SG',
  // EU members
  'FR','DE','ES','IT','NL','BE','IE','PT','AT','FI','GR','LU','SE','DK','PL','CZ','RO','HU',
  // Asia / MENA
  'ID', 'TH', 'VN', 'PH', 'IN', 'MY', 'AE', 'SA',
])

function resolveMarket (cc: string): string {
  const code = cc.toUpperCase()
  if (KNOWN_MARKETS.has(code)) return code
  if (['NO', 'CH'].includes(code)) return 'EU' // EFTA → EU pricing
  // unknown → safest is the highest-priced anchor
  return 'US'
}

interface PricingResolution {
  country: string             // resolved country (may differ from raw IP country if VPN)
  rawCountry: string          // what the IP actually said
  market: string              // pricing key (US, GB, EU, ID, etc.)
  isVPN: boolean
  isProxy: boolean
  isHosting: boolean
  isTor: boolean
  source: 'ipapi.is' | 'cf-header' | 'fallback'
  timezoneMatch: boolean
  langMatch: boolean
}

// Best-effort IP extraction. Supabase Edge runs on Deno Deploy which sets
// cf-connecting-ip when fronted by Cloudflare; we also check the standard
// x-forwarded-for chain.
function extractIP (req: Request): string {
  const headers = req.headers
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xr = headers.get('x-real-ip')
  if (xr) return xr
  return ''
}

// Browser tz heuristic — maps a tz name to its plausible country.
// Used only to triangulate against IP country; not for primary detection.
const TZ_COUNTRY_HINT: Record<string, string> = {
  'Asia/Jakarta': 'ID', 'Asia/Pontianak': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID',
  'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Manila': 'PH',
  'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Kolkata': 'IN',
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA',
  'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL', 'Europe/Rome': 'IT', 'Europe/Dublin': 'IE',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
}

async function lookupIP (ip: string): Promise<{ country: string, isVPN: boolean, isProxy: boolean, isHosting: boolean, isTor: boolean } | null> {
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null // local / private — caller will fall back
  }
  try {
    const resp = await fetch(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}`)
    if (!resp.ok) return null
    const data = await resp.json()
    return {
      country: String(data?.location?.country_code || '').toUpperCase(),
      isVPN: !!data?.is_vpn,
      isProxy: !!data?.is_proxy,
      isHosting: !!data?.is_datacenter,
      isTor: !!data?.is_tor,
    }
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let body: { timezone?: string, language?: string } = {}
  try { body = await req.json() } catch { /* body optional */ }

  const ip = extractIP(req)
  const lookup = await lookupIP(ip)

  if (!lookup) {
    // No IP signal → return USD as the safest default. Never assume Asia.
    const out: PricingResolution = {
      country: 'US', rawCountry: '', market: 'US',
      isVPN: false, isProxy: false, isHosting: false, isTor: false,
      source: 'fallback', timezoneMatch: false, langMatch: false,
    }
    return json(out)
  }

  const rawCountry = lookup.country
  const tzHint = body.timezone ? TZ_COUNTRY_HINT[body.timezone] : undefined
  const langPrimary = (body.language || '').split(/[,-]/)[0].slice(0, 2).toUpperCase()

  // Triangulation: tz must MATCH if present + known; lang is a softer
  // signal (lots of false negatives — e.g. en-US user in Singapore).
  const timezoneMatch = !tzHint || tzHint === rawCountry
  const langMatch = !langPrimary || langPrimary === rawCountry

  // The hard rule: any VPN / proxy / datacenter / tor flag → USD.
  // Conservative — better to over-charge a real Indonesian user using
  // a VPN than to leak the Asia discount to a US/UK user behind one.
  const ipFlaggedSuspicious = lookup.isVPN || lookup.isProxy || lookup.isHosting || lookup.isTor

  // Triangulation conflict (tz strongly disagrees) also forces USD.
  // We use only timezone for this — language is too noisy.
  const triangulationFail = tzHint != null && tzHint !== rawCountry && PPP_COUNTRIES.has(rawCountry)

  let resolvedCountry = rawCountry
  if (ipFlaggedSuspicious || triangulationFail) {
    resolvedCountry = 'US'
  }

  const market = resolveMarket(resolvedCountry)

  const out: PricingResolution = {
    country: resolvedCountry,
    rawCountry,
    market,
    isVPN: lookup.isVPN,
    isProxy: lookup.isProxy,
    isHosting: lookup.isHosting,
    isTor: lookup.isTor,
    source: 'ipapi.is',
    timezoneMatch,
    langMatch,
  }
  return json(out)
})
