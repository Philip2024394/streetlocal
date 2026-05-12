// Detect region from browser timezone and return localised unlock price

const TZ_MAP = [
  // United Kingdom
  { match: tz => tz === 'Europe/London' || tz === 'Europe/Belfast',                     symbol: '£', amount: '1.99', label: '£1.99' },
  // Europe (EU timezones)
  { match: tz => tz.startsWith('Europe/'),                                               symbol: '€', amount: '1.99', label: '€1.99' },
  // Australia
  { match: tz => tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland')
                  || tz === 'Pacific/Fiji',                                              symbol: 'A$', amount: '1.99', label: 'A$1.99' },
  // United States & Canada
  { match: tz => tz.startsWith('America/'),                                             symbol: '$',  amount: '1.99', label: '$1.99' },
  // Asia (Indonesia, Philippines, Thailand, Malaysia, Singapore, India, etc.)
  { match: tz => tz.startsWith('Asia/'),                                                symbol: '$',  amount: '1.99', label: '$1.99 USD' },
  // Africa
  { match: tz => tz.startsWith('Africa/'),                                              symbol: '$',  amount: '1.99', label: '$1.99 USD' },
  // Pacific
  { match: tz => tz.startsWith('Pacific/'),                                             symbol: '$',  amount: '1.99', label: '$1.99 USD' },
]

const DEFAULT_PRICE = { symbol: '$', amount: '1.99', label: '$1.99' }

export function getUnlockPrice() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    for (const entry of TZ_MAP) {
      if (entry.match(tz)) return entry
    }
  } catch {}
  return DEFAULT_PRICE
}

export const UNLOCK_PRICE = getUnlockPrice().label
