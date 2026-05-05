// Strict content filter — blocks numbers (digits or words), links, and social-media references
// Returns { blocked: boolean, reason: string | null }

import { supabase } from '@/lib/supabase'

// E.164 and common formatted phone numbers
const PHONE_RE = /(\+|00)?(44|1|61|33|49|34|39|353|31|32|41|43|45|46|47|48|351|30|358|62|60|66|84|63|91|86|81|82|65|852|853|855|856|95)[\s\-.]?\d[\d\s\-\.]{7,12}\d|(\b0[1-9]\d{8,9}\b)|(\b\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}\b)|(\b07\d{9}\b)|(\b08[1-9]\d{7,10}\b)/

// Any sequence of 7+ digits (even spaced/dashed)
const DIGIT_SEQ_RE = /\b(\d[\s\-\.]{0,2}){7,}\d\b/

// Written-out number words used to spell a phone number (6+ words)
const NUMBER_WORDS_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh|nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\b[\s,\-]*((\b(zero|one|two|three|four|five|six|seven|eight|nine|oh|nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\b[\s,\-]*){5,})/i

// Leetspeak / obfuscated numbers (e.g. "0n3 tw0 thr33")
const LEET_RE = /\b(z[3e]ro|[0o]ne|tw[0o]|thr[3e]{2}|f[0o]ur|f[1i]ve|s[1i]x|s[3e]v[3e]n|[3e][1i]ght|n[1i]n[3e])\b/gi

// URLs, domain references, email patterns
const URL_RE = /(https?:\/\/|www\.|\.com\b|\.co\.uk|\.co\.id|\.io\b|\.me\b|\.net\b|\.org\b|\.app\b|\.xyz\b|\.shop\b|\.store\b|\.site\b|\.online\b|\.id\b\/|\.my\b\/|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i

// @username handles
const HANDLE_RE = /@[a-z0-9_\.]{2,}/i

// Bare social media platform names
const SOCIAL_PLATFORM_RE = /\b(snap(chat)?|insta(gram)?|facebook|\bfb\b|whatsapp|\bwa\b|telegram|\btg\b|tiktok|twitter|wechat|kik|viber|signal app|hinge|bumble|tinder|line\s*id|tokopedia|shopee|bukalapak|olx|gojek|grab)\b/i

// Contact-sharing phrases (e.g. "my snap is", "add me on", "find me on")
const SOCIAL_SHARE_RE = /(my\s*(snap|insta|ig|fb|facebook|whatsapp|wa|telegram|signal|tiktok|twitter|line)\s*(is|:|=|handle|username|@)?|add\s+me\s+(on|at|to)|find\s+me\s+on|dm\s+me\s+(on|at)|follow\s+me\s+on|hit\s+me\s+up\s+(on|at)|chat\s+me\s+(on|at))/i

// Phrases offering to share a phone number
const NUMBER_SHARE_RE = /(my\s*(number|num|no\.?|phone|hp|handphone|nomor)\s*(is|:|=)?|call\s+me\s+(on|at)?|text\s+me\s+(on|at)?|ring\s+me|mob(ile)?\s*(is|:|=)?|whatsapp\s+me\s+(on|at)?|hubungi\s+saya|nomor\s+(saya|hp|wa))/i

export function filterMessage(text) {
  if (PHONE_RE.test(text))          return { blocked: true, reason: 'phone' }
  if (DIGIT_SEQ_RE.test(text))      return { blocked: true, reason: 'phone' }
  if (NUMBER_WORDS_RE.test(text))   return { blocked: true, reason: 'phone' }
  // Check for leetspeak — need 5+ matches in one message to trigger
  const leetMatches = text.match(LEET_RE)
  if (leetMatches && leetMatches.length >= 5) return { blocked: true, reason: 'phone' }
  if (URL_RE.test(text))            return { blocked: true, reason: 'link' }
  if (HANDLE_RE.test(text))         return { blocked: true, reason: 'social' }
  if (SOCIAL_PLATFORM_RE.test(text))return { blocked: true, reason: 'social' }
  if (SOCIAL_SHARE_RE.test(text))   return { blocked: true, reason: 'social' }
  if (NUMBER_SHARE_RE.test(text))   return { blocked: true, reason: 'phone' }
  return { blocked: false, reason: null }
}

export const BLOCK_MESSAGES = {
  phone:  "Phone numbers cannot be shared in chat. This protects both buyer and seller. All transactions must stay in-app.",
  link:   "Links and websites are not allowed in chat. Complete your transaction here to stay protected.",
  social: "Social media and external contacts cannot be shared. All communication must remain in Indoo chat.",
}

/**
 * Log a content filter violation to Supabase for admin review.
 * Fire-and-forget — never blocks the UI.
 */
export function logViolation({ userId, conversationId, text, reason, role }) {
  if (!supabase || !userId) return
  supabase.from('content_violations').insert({
    user_id:         userId,
    conversation_id: conversationId ?? null,
    blocked_text:    text.slice(0, 500),
    reason,
    role:            role ?? null,  // 'buyer' | 'seller' | null
    created_at:      new Date().toISOString(),
  }).then(() => {}).catch(() => {})
}

/**
 * Get violation count for a user (used for reputation and admin alerts).
 */
export async function getViolationCount(userId) {
  if (!supabase || !userId) return 0
  try {
    const { count } = await supabase
      .from('content_violations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count ?? 0
  } catch { return 0 }
}
