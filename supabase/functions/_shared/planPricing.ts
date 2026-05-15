// ═══════════════════════════════════════════════════════════
// StreetLocal plan pricing — country × tier matrix.
//
// Single source of truth for what each tier costs in each market.
// Mirrors the table on the public landing (landing/src/PremiumHome.jsx
// PLAN_PRICING constant). Keep in sync — when the marketing page
// changes, this table must change too, or vendors will see a price
// on the landing they can't pay because the Edge Function rejects it.
//
// Currency strategy:
//   - Indonesia + Southeast Asia + India + MENA → IDR/PHP/VND/THB/INR/AED/SAR/MYR via Midtrans
//   - US / UK / EU / Canada / Australia / NZ / Singapore → USD/GBP/EUR/CAD/AUD/NZD/SGD via Stripe
// ═══════════════════════════════════════════════════════════

export type PlanLevel = 'starter' | 'professional' | 'enterprise'
export type GatewayProvider = 'midtrans' | 'stripe'

export interface PlanMarket {
  code: string
  currency: string
  symbol: string
  starter: number        // amount as integer in the smallest unit FOR THIS gateway
  professional: number
  enterprise: number
  gateway: GatewayProvider
}

// All amounts are in the currency's MAJOR unit × the multiplier the
// chosen gateway expects:
//   - Midtrans: gross_amount is the major unit (Rp 199,000 → 199000)
//   - Stripe:   unit_amount is the smallest unit (USD $49 → 4900 cents)
//     IDR / VND / JPY / KRW are zero-decimal currencies for Stripe,
//     so for those we'd send the same major-unit value, but those
//     markets all go via Midtrans here so it doesn't matter.
export const PLAN_PRICING: Record<string, PlanMarket> = {
  // ── International — Stripe ───────────────────────────────────
  US: { code: 'US', currency: 'USD', symbol: '$',   starter: 1900,    professional: 4900,    enterprise: 9900,    gateway: 'stripe' },
  GB: { code: 'GB', currency: 'GBP', symbol: '£',   starter: 1500,    professional: 3900,    enterprise: 7900,    gateway: 'stripe' },
  EU: { code: 'EU', currency: 'EUR', symbol: '€',   starter: 1700,    professional: 4500,    enterprise: 8900,    gateway: 'stripe' },
  AU: { code: 'AU', currency: 'AUD', symbol: 'A$',  starter: 2900,    professional: 6900,    enterprise: 13900,   gateway: 'stripe' },
  CA: { code: 'CA', currency: 'CAD', symbol: 'C$',  starter: 2500,    professional: 6900,    enterprise: 12900,   gateway: 'stripe' },
  NZ: { code: 'NZ', currency: 'NZD', symbol: 'NZ$', starter: 2900,    professional: 7900,    enterprise: 14900,   gateway: 'stripe' },
  SG: { code: 'SG', currency: 'SGD', symbol: 'S$',  starter: 2500,    professional: 6900,    enterprise: 12900,   gateway: 'stripe' },
  AE: { code: 'AE', currency: 'AED', symbol: 'AED', starter: 7500,    professional: 19900,   enterprise: 39900,   gateway: 'stripe' },
  SA: { code: 'SA', currency: 'SAR', symbol: 'SAR', starter: 7500,    professional: 19900,   enterprise: 39900,   gateway: 'stripe' },
  // ── Asia PPP — Midtrans (single-decimal currencies; amounts in major unit) ───
  ID: { code: 'ID', currency: 'IDR', symbol: 'Rp',  starter: 38000,   professional: 199000,  enterprise: 449000,  gateway: 'midtrans' },
  PH: { code: 'PH', currency: 'PHP', symbol: '₱',   starter: 999,     professional: 4999,    enterprise: 9999,    gateway: 'midtrans' },
  VN: { code: 'VN', currency: 'VND', symbol: '₫',   starter: 399000,  professional: 1999000, enterprise: 3999000, gateway: 'midtrans' },
  TH: { code: 'TH', currency: 'THB', symbol: '฿',   starter: 599,     professional: 2999,    enterprise: 5999,    gateway: 'midtrans' },
  IN: { code: 'IN', currency: 'INR', symbol: '₹',   starter: 1499,    professional: 6999,    enterprise: 13999,   gateway: 'midtrans' },
  MY: { code: 'MY', currency: 'MYR', symbol: 'RM',  starter: 69,      professional: 179,     enterprise: 359,     gateway: 'midtrans' },
}

const EU_COUNTRIES = new Set([
  'FR','DE','ES','IT','NL','BE','IE','PT','AT','FI','GR','LU','SE','DK','NO','CH','PL','CZ','RO','HU',
])

export function resolvePlanMarket (countryCode: string | null | undefined): PlanMarket {
  const code = String(countryCode || '').toUpperCase()
  if (PLAN_PRICING[code]) return PLAN_PRICING[code]
  if (EU_COUNTRIES.has(code)) return PLAN_PRICING.EU
  // Unknown / missing country → default to US pricing. Safe because
  // resolve-pricing geofences VPN/proxy traffic to US anyway.
  return PLAN_PRICING.US
}

export function getTierPrice (market: PlanMarket, tier: PlanLevel): number {
  switch (tier) {
    case 'starter':      return market.starter
    case 'professional': return market.professional
    case 'enterprise':   return market.enterprise
  }
}

export function isValidPlanLevel (s: unknown): s is PlanLevel {
  return s === 'starter' || s === 'professional' || s === 'enterprise'
}

// Format the price for display in receipts, emails, etc. Major unit
// for Asia (Rp 199,000) and Stripe-decimal for international ($49.00).
export function formatPriceForDisplay (market: PlanMarket, tier: PlanLevel): string {
  const v = getTierPrice(market, tier)
  if (market.gateway === 'midtrans') {
    return `${market.symbol} ${v.toLocaleString('en-US')}`
  }
  // Stripe minor unit → major unit with 2 decimals
  return `${market.symbol}${(v / 100).toFixed(2)}`
}
