/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Typography — WCAG 2.1 AA compliant text sizes for INDOO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RULE: These sizes are ENFORCED across all modules.
 * NO text smaller than 12px. NO buttons smaller than 44px.
 * All body text minimum 4.5:1 contrast ratio.
 *
 * Usage: import { TEXT, TAP } from '@/constants/typography'
 *        style={{ fontSize: TEXT.body, lineHeight: LINE.body }}
 */

// ── Text sizes (rem-based, scales with user preferences) ─────────────────
export const TEXT = {
  xs:    '0.75rem',   // 12px — badges, legal only
  sm:    '0.875rem',  // 14px — helper text, captions
  base:  '1rem',      // 16px — body text, prices, buttons, inputs
  md:    '1.125rem',  // 18px — card titles, restaurant names
  lg:    '1.25rem',   // 20px — section headers, category headers
  xl:    '1.5rem',    // 24px — page titles
  xxl:   '1.75rem',   // 28px — stat numbers, big prices
}

// ── Font weights ─────────────────────────────────────────────────────────
export const WEIGHT = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
  heavy:    800,
  black:    900,
}

// ── Line heights ─────────────────────────────────────────────────────────
export const LINE = {
  tight:  1.2,   // headings
  snug:   1.3,   // subheadings
  body:   1.5,   // body text (WCAG recommended)
  relaxed: 1.6,  // descriptions, long text
}

// ── Minimum tap target size (WCAG 2.5.5) ─────────────────────────────────
export const TAP = {
  min:    44,     // minimum 44x44px for all interactive elements
  toggle: 44,    // toggle switch height
  button: 48,    // standard button height
  icon:   44,    // icon button minimum
}

// ── Contrast-safe colors against dark backgrounds ────────────────────────
// All meet 4.5:1 minimum against #0a0a0a / rgba(0,0,0,0.5)
export const COLOR = {
  primary:    '#8DC63F',  // green — 5.2:1 on dark
  accent:     '#FACC15',  // yellow — 8.1:1 on dark
  danger:     '#EF4444',  // red — 4.6:1 on dark
  info:       '#60A5FA',  // blue — 5.8:1 on dark
  text:       '#ffffff',  // white — 21:1 on dark
  textMuted:  'rgba(255,255,255,0.6)',  // 4.8:1 on dark
  textFaint:  'rgba(255,255,255,0.4)',  // 3.2:1 — ONLY for large text (18px+)
}

// ── Customer app text specs ──────────────────────────────────────────────
export const CUSTOMER = {
  restaurantName: { fontSize: TEXT.md, fontWeight: WEIGHT.semibold },
  menuItemName:   { fontSize: TEXT.base, fontWeight: WEIGHT.medium },
  menuItemDesc:   { fontSize: TEXT.sm, fontWeight: WEIGHT.regular, lineHeight: LINE.relaxed },
  price:          { fontSize: TEXT.base, fontWeight: WEIGHT.bold },
  categoryHeader: { fontSize: TEXT.lg, fontWeight: WEIGHT.bold },
  buttonText:     { fontSize: TEXT.base, fontWeight: WEIGHT.medium },
  badge:          { fontSize: TEXT.xs, fontWeight: WEIGHT.medium },
  helperText:     { fontSize: '0.8125rem', fontWeight: WEIGHT.regular }, // 13px
}

// ── Vendor dashboard text specs ──────────────────────────────────────────
export const VENDOR = {
  pageTitle:      { fontSize: TEXT.xl, fontWeight: WEIGHT.bold },
  sectionHeader:  { fontSize: TEXT.lg, fontWeight: WEIGHT.semibold },
  menuItemName:   { fontSize: TEXT.base, fontWeight: WEIGHT.medium },
  menuItemPrice:  { fontSize: TEXT.base, fontWeight: WEIGHT.bold },
  formLabel:      { fontSize: TEXT.sm, fontWeight: WEIGHT.medium },
  formInput:      { fontSize: TEXT.base },  // 16px prevents iOS zoom
  tableCell:      { fontSize: TEXT.sm },
  buttonText:     { fontSize: TEXT.base, fontWeight: WEIGHT.bold },
  helpTooltip:    { fontSize: TEXT.sm },
  statNumber:     { fontSize: TEXT.xxl, fontWeight: WEIGHT.black },
  orderRef:       { fontSize: TEXT.md, fontWeight: WEIGHT.black },
  customerName:   { fontSize: TEXT.base, fontWeight: WEIGHT.heavy },
  itemLine:       { fontSize: TEXT.sm, lineHeight: LINE.body },
  totalPrice:     { fontSize: TEXT.lg, fontWeight: WEIGHT.black },
  driverETA:      { fontSize: TEXT.sm, fontWeight: WEIGHT.heavy },
}
