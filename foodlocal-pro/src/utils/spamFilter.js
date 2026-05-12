/**
 * Indoo Spam Filter — shared across all chat systems
 * (Rentals, Marketplace, Dating, Food, Rides)
 *
 * Blocks phone numbers, social media handles, contact sharing attempts.
 * Returns { isSpam, reason, severity } for each message.
 */

// ── Step 1: Normalize text before checking ──────────────────────────────────
function normalize(text) {
  return text
    // Replace common letter→number substitutions
    .replace(/[oO]/g, (m, offset, str) => {
      // Only replace O/o that's surrounded by digits
      const before = str[offset - 1]
      const after = str[offset + 1]
      if ((before && /\d/.test(before)) || (after && /\d/.test(after))) return '0'
      return m
    })
    .replace(/[iIlL|]/g, (m, offset, str) => {
      const before = str[offset - 1]
      const after = str[offset + 1]
      if ((before && /\d/.test(before)) || (after && /\d/.test(after))) return '1'
      return m
    })
    // Remove invisible chars, zero-width spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize common separators in numbers
    .replace(/[\s\-\.\/\(\)]+/g, ' ')
}

// ── Step 2: Extract digits from text ────────────────────────────────────────
function extractDigits(text) {
  // Remove all non-digit characters and check for long sequences
  return text.replace(/[^0-9]/g, '')
}

// ── Patterns ────────────────────────────────────────────────────────────────

// Phone number patterns
const PHONE_PATTERNS = [
  /\b0\s*8\s*\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d/i, // 08xx with spaces/dots
  /\+\s*6\s*2\s*\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d/i,        // +62 with spaces
  /\b62\s*8\s*\d{8,11}\b/,                     // 628xxx without +
]

// Social media / messaging apps
const SOCIAL_PATTERNS = [
  /w\s*h?\s*a\s*t?\s*s?\s*a\s*p\s*p?/i,        // whatsapp with any spacing
  /\bw[\s.\/]*a\b/i,                             // w.a, w/a, w a
  /\bwhats\s*up\b/i,                             // whatsup (common misspelling for WA)
  /\btele\s*gram\b/i,                            // telegram
  /\binsta\s*gram?\b/i,                          // instagram / insta
  /\b(ig|insta)\s*:\s*/i,                        // ig: or insta:
  /\bline\s*(id|:)\b/i,                          // line id / line:
  /\bsignal\s*(app)?\b/i,                        // signal
  /\bwechat\b/i,                                 // wechat
  /\bviber\b/i,                                  // viber
  /\bfb\s*(messenger)?\b/i,                      // fb messenger
  /\bmessenger\b/i,                              // messenger
  /\btiktok\b/i,                                 // tiktok
  /\bsnapchat\b/i,                               // snapchat
  /\btwitter\b/i,                                // twitter
  /\bdiscord\b/i,                                // discord
]

// Indonesian contact slang
const INDO_SLANG_PATTERNS = [
  /\bhub\s*(ungi)?\b/i,                          // hub, hubungi
  /\bkontak\s*(saya|aku|gw|gue)?\b/i,           // kontak / kontak saya
  /\bno\s*(mor|mer|hp|telp|wa)\b/i,              // nomor, nomer, no hp, no wa
  /\bnomor\s*(hp|telp|telepon|wa)?\b/i,          // nomor hp
  /\bjapri\b/i,                                  // japri (jalur pribadi = DM)
  /\bdm\s*(me|saya|aku)?\b/i,                    // dm me
  /\bpm\s*(me|saya|aku)?\b/i,                    // pm me
  /\btelepon\b/i,                                // telepon
  /\btelp\b/i,                                   // telp
  /\bcall\s*(me|saya|aku)?\b/i,                  // call me
  /\btext\s*(me|saya|aku)?\b/i,                  // text me
  /\bchat\s*(di\s*luar|outside)\b/i,             // chat di luar / chat outside
  /\bdi\s*luar\s*(app|aplikasi)\b/i,             // di luar app
  /\boutside\s*(the\s*)?(app|platform)\b/i,      // outside the app
]

// English contact attempts
const ENGLISH_CONTACT_PATTERNS = [
  /\bcall\s*me\b/i,
  /\btext\s*me\b/i,
  /\breach\s*me\s*(at|on)\b/i,
  /\bcontact\s*me\b/i,
  /\bhit\s*me\s*up\b/i,
  /\bmy\s*(number|phone|cell|mobile)\b/i,
  /\bphone\s*(number|no\.?|#)\b/i,
  /\bgive\s*(you|u)\s*my\s*(number|phone)\b/i,
  /\bhere\'?s?\s*my\s*(number|phone|contact)\b/i,
  /\badd\s*me\s*(on|@)\b/i,
  /\bfollow\s*me\s*(on|@)\b/i,
  /\bfind\s*me\s*(on|at)\b/i,
]

// Email patterns
const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/

// Coded language / evasion attempts
const EVASION_PATTERNS = [
  /\bgreen\s*app\b/i,                            // "green app" = WhatsApp
  /\bblue\s*app\b/i,                             // "blue app" = Telegram
  /\bother\s*app\b/i,                            // "other app"
  /\bsend\s*(number|nomer|nomor)\b/i,            // "send number"
]

// ── Main filter function ────────────────────────────────────────────────────
export function checkSpam(text) {
  if (!text || typeof text !== 'string') return { isSpam: false }

  const normalized = normalize(text)
  const digits = extractDigits(normalized)

  // Check 1: Long digit sequences (8+ digits = likely phone number)
  if (digits.length >= 8) {
    return { isSpam: true, reason: 'Phone number detected', severity: 'high' }
  }

  // Check 2: Phone patterns
  for (const p of PHONE_PATTERNS) {
    if (p.test(text) || p.test(normalized)) {
      return { isSpam: true, reason: 'Phone number detected', severity: 'high' }
    }
  }

  // Check 3: Social media / messaging
  for (const p of SOCIAL_PATTERNS) {
    if (p.test(text) || p.test(normalized)) {
      return { isSpam: true, reason: 'Social media contact detected', severity: 'medium' }
    }
  }

  // Check 4: Indonesian slang
  for (const p of INDO_SLANG_PATTERNS) {
    if (p.test(text) || p.test(normalized)) {
      return { isSpam: true, reason: 'Contact sharing attempt', severity: 'medium' }
    }
  }

  // Check 5: English contact attempts
  for (const p of ENGLISH_CONTACT_PATTERNS) {
    if (p.test(text) || p.test(normalized)) {
      return { isSpam: true, reason: 'Contact sharing attempt', severity: 'medium' }
    }
  }

  // Check 6: Email
  if (EMAIL_PATTERN.test(text)) {
    return { isSpam: true, reason: 'Email address detected', severity: 'medium' }
  }

  // Check 7: Evasion attempts
  for (const p of EVASION_PATTERNS) {
    if (p.test(text) || p.test(normalized)) {
      return { isSpam: true, reason: 'Contact sharing attempt', severity: 'low' }
    }
  }

  return { isSpam: false }
}

// ── Strike system — track spam attempts per user ────────────────────────────
const STRIKE_KEY = 'indoo_spam_strikes'
const MAX_STRIKES = 3
const BAN_DURATION = 15 * 60 * 1000 // 15 minutes

export function recordStrike(userId = 'default') {
  try {
    const strikes = JSON.parse(localStorage.getItem(STRIKE_KEY) || '{}')
    const user = strikes[userId] || { count: 0, bannedUntil: null }

    // Check if currently banned
    if (user.bannedUntil && Date.now() < user.bannedUntil) {
      const mins = Math.ceil((user.bannedUntil - Date.now()) / 60000)
      return { banned: true, minutesLeft: mins }
    }

    // Reset if ban expired
    if (user.bannedUntil && Date.now() >= user.bannedUntil) {
      user.count = 0
      user.bannedUntil = null
    }

    user.count++
    if (user.count >= MAX_STRIKES) {
      user.bannedUntil = Date.now() + BAN_DURATION
      strikes[userId] = user
      localStorage.setItem(STRIKE_KEY, JSON.stringify(strikes))
      return { banned: true, minutesLeft: 15 }
    }

    strikes[userId] = user
    localStorage.setItem(STRIKE_KEY, JSON.stringify(strikes))
    return { banned: false, strikesLeft: MAX_STRIKES - user.count }
  } catch {
    return { banned: false, strikesLeft: MAX_STRIKES }
  }
}

export function isUserBanned(userId = 'default') {
  try {
    const strikes = JSON.parse(localStorage.getItem(STRIKE_KEY) || '{}')
    const user = strikes[userId]
    if (!user?.bannedUntil) return false
    if (Date.now() < user.bannedUntil) return true
    return false
  } catch {
    return false
  }
}

// ── Warning messages — randomized for natural feel ──────────────────────────
const WARNINGS = {
  high: [
    'Phone numbers are not allowed in chat. Complete a booking to unlock contact details.',
    'Sharing phone numbers is blocked. Book through Indoo to get the owner\'s WhatsApp.',
    'Contact details are protected. Pay the booking deposit to unlock WhatsApp.',
  ],
  medium: [
    'Sharing contact details outside the platform is not allowed.',
    'Please keep conversations within Indoo for your safety.',
    'External contact sharing is blocked. Use the booking system to connect.',
  ],
  low: [
    'Please keep your conversation within the app.',
    'For your safety, all communication should stay on Indoo.',
  ],
}

export function getWarningMessage(severity = 'medium') {
  const msgs = WARNINGS[severity] || WARNINGS.medium
  return msgs[Math.floor(Math.random() * msgs.length)]
}
