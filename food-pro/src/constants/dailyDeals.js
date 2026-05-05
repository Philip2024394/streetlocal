/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Daily Restaurant Deals — one themed deal per day of the week
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Each day has: name, background image, default discount, color accent.
 * The active day shows a full-size card with glowing discount + countdown.
 * Only today's deal is "live" — others show as upcoming/past.
 */

// Day index: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export const DAILY_DEALS = [
  {
    day: 0,
    name: 'Sunday Saver',
    emoji: '🌅',
    discount: 25,
    color: '#FACC15',
    slogan: 'Start your week with savings',
    img: 'https://ik.imagekit.io/nepgaxllc/sasf.png',
  },
  {
    day: 1,
    name: 'Magic Monday',
    emoji: '✨',
    discount: 20,
    color: '#A78BFA',
    slogan: 'Monday magic at unreal prices',
    img: 'https://ik.imagekit.io/nepgaxllc/sssaasssssss.png',
  },
  {
    day: 2,
    name: 'Tuesday Grooves',
    emoji: '🎵',
    discount: 15,
    color: '#34D399',
    slogan: 'Groove into tasty Tuesday deals',
    img: 'https://ik.imagekit.io/nepgaxllc/sssaasssss.png',
  },
  {
    day: 3,
    name: 'Wicked Wednesday',
    emoji: '🔥',
    discount: 30,
    color: '#F87171',
    slogan: 'Wickedly good mid-week discounts',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2007_50_12%20AM.png?updatedAt=1776905429676',
  },
  {
    day: 4,
    name: 'Thirsty Thursday',
    emoji: '🥤',
    discount: 20,
    color: '#60A5FA',
    slogan: 'Quench your cravings for less',
    img: 'https://ik.imagekit.io/nepgaxllc/sssaasssssssdd.png',
  },
  {
    day: 5,
    name: 'Crunchy Friday',
    emoji: '🍗',
    discount: 25,
    color: '#FB923C',
    slogan: 'Crispy deals to end your week right',
    img: 'https://ik.imagekit.io/nepgaxllc/sssaa.png',
  },
  {
    day: 6,
    name: 'Sizzling Saturday',
    emoji: '🥩',
    discount: 35,
    color: '#EF4444',
    slogan: 'Sizzle into the weekend feast',
    img: 'https://ik.imagekit.io/nepgaxllc/sssaass.png',
  },
]

/**
 * Get today's active deal (WIB timezone)
 */
export function getTodayDeal() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wib = new Date(utcMs + 7 * 3_600_000)
  return DAILY_DEALS[wib.getDay()]
}

/**
 * Get milliseconds until today's deal expires (midnight WIB)
 */
export function getMsUntilMidnightWIB() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wib = new Date(utcMs + 7 * 3_600_000)
  const midnight = new Date(wib)
  midnight.setHours(23, 59, 59, 999)
  return midnight.getTime() - wib.getTime()
}
