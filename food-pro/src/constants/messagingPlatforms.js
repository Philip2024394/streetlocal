/**
 * Messaging platform registry.
 * Used in: ContactOptionsSheet (business config), ContactUnlockSheet (reveal), MakerCard (locked badge).
 */

export const PLATFORMS = [
  { id: 'whatsapp',   label: 'WhatsApp',       color: '#25D366', textColor: '#fff', abbr: 'WA',  hint: 'e.g. +44 7700 900123' },
  { id: 'telegram',   label: 'Telegram',       color: '#229ED9', textColor: '#fff', abbr: 'TG',  hint: 'e.g. @username' },
  { id: 'instagram',  label: 'Instagram DM',   color: '#C13584', textColor: '#fff', abbr: 'IG',  hint: 'e.g. @yourbrand' },
  { id: 'wechat',     label: 'WeChat',         color: '#07C160', textColor: '#fff', abbr: 'WC',  hint: 'e.g. WeChat ID' },
  { id: 'imessage',   label: 'iMessage',       color: '#34AADC', textColor: '#fff', abbr: 'iM',  hint: 'e.g. +44 7700 900123 or Apple ID' },
  { id: 'signal',     label: 'Signal',         color: '#3A76F0', textColor: '#fff', abbr: 'SG',  hint: 'e.g. +44 7700 900123' },
  { id: 'viber',      label: 'Viber',          color: '#7360F2', textColor: '#fff', abbr: 'VB',  hint: 'e.g. +44 7700 900123' },
  { id: 'line',       label: 'Line',           color: '#00B900', textColor: '#fff', abbr: 'LN',  hint: 'e.g. Line ID' },
  { id: 'messenger',  label: 'FB Messenger',   color: '#0084FF', textColor: '#fff', abbr: 'FM',  hint: 'e.g. facebook.com/yourbrand' },
  { id: 'snapchat',   label: 'Snapchat',       color: '#FFFC00', textColor: '#000', abbr: 'SC',  hint: 'e.g. @username' },
  { id: 'discord',    label: 'Discord',        color: '#5865F2', textColor: '#fff', abbr: 'DC',  hint: 'e.g. username#1234 or server link' },
  { id: 'skype',      label: 'Skype',          color: '#00AFF0', textColor: '#fff', abbr: 'SK',  hint: 'e.g. Skype name' },
  { id: 'zoom',       label: 'Zoom',           color: '#2D8CFF', textColor: '#fff', abbr: 'ZM',  hint: 'e.g. meeting ID' },
  { id: 'meet',       label: 'Google Meet',    color: '#34A853', textColor: '#fff', abbr: 'GM',  hint: 'e.g. meet.google.com/xxx' },
  { id: 'teams',      label: 'Teams',          color: '#6264A7', textColor: '#fff', abbr: 'TM',  hint: 'e.g. email or meeting link' },
  { id: 'kakao',      label: 'KakaoTalk',      color: '#FEE500', textColor: '#000', abbr: 'KK',  hint: 'e.g. KakaoTalk ID' },
  { id: 'zalo',       label: 'Zalo',           color: '#0068FF', textColor: '#fff', abbr: 'ZL',  hint: 'e.g. phone number or Zalo ID' },
  { id: 'kik',        label: 'Kik',            color: '#82BC23', textColor: '#fff', abbr: 'KI',  hint: 'e.g. @username' },
  { id: 'threema',    label: 'Threema',        color: '#555',    textColor: '#fff', abbr: 'TH',  hint: 'e.g. Threema ID (8 characters)' },
  { id: 'wire',       label: 'Wire',           color: '#1D1D1B', textColor: '#fff', abbr: 'WR',  hint: 'e.g. @username' },
  { id: 'dust',       label: 'Dust',           color: '#1C8FFF', textColor: '#fff', abbr: 'DU',  hint: 'e.g. @username' },
  { id: 'wickr',      label: 'Wickr',          color: '#E84C1E', textColor: '#fff', abbr: 'WK',  hint: 'e.g. Wickr ID' },
  { id: 'textnow',    label: 'TextNow',        color: '#00C853', textColor: '#fff', abbr: 'TN',  hint: 'e.g. TextNow number' },
  { id: 'gchat',      label: 'Google Chat',    color: '#1AA260', textColor: '#fff', abbr: 'GC',  hint: 'e.g. Gmail address' },
  { id: 'slack',      label: 'Slack',          color: '#4A154B', textColor: '#fff', abbr: 'SL',  hint: 'e.g. workspace invite link' },
  { id: 'linkedin',   label: 'LinkedIn',       color: '#0077B5', textColor: '#fff', abbr: 'LI',  hint: 'e.g. linkedin.com/in/yourname' },
  { id: 'twitter',    label: 'Twitter / X',    color: '#14171A', textColor: '#fff', abbr: 'X',   hint: 'e.g. @handle' },
  { id: 'tiktok',     label: 'TikTok',         color: '#FF0050', textColor: '#fff', abbr: 'TT',  hint: 'e.g. @yourbrand' },
  { id: 'bereal',     label: 'BeReal',         color: '#222',    textColor: '#fff', abbr: 'BR',  hint: 'e.g. username' },
  { id: 'bumble',     label: 'Bumble Bizz',    color: '#F7B731', textColor: '#000', abbr: 'BB',  hint: 'e.g. profile link' },
  { id: 'phone',      label: 'Phone Call',     color: '#4CAF50', textColor: '#fff', abbr: '☎',   hint: 'e.g. +44 7700 900123' },
  { id: 'sms',        label: 'SMS / Text',     color: '#607D8B', textColor: '#fff', abbr: 'SMS', hint: 'e.g. +44 7700 900123' },
]

export function getPlatform(id) {
  return PLATFORMS.find(p => p.id === id) ?? null
}

/**
 * Returns a deep-link URL for the given platform + contact number/handle.
 * Falls back to null for platforms without standard deep links.
 */
export function getPlatformLink(platformId, contactNumber) {
  if (!contactNumber) return null
  const clean  = contactNumber.replace(/[^\d+]/g, '')
  const handle = contactNumber.trim().replace(/^@/, '')
  const links = {
    whatsapp:  `https://wa.me/${clean.replace('+', '')}`,
    telegram:  `https://t.me/${handle}`,
    instagram: `https://ig.me/m/${handle}`,
    signal:    `https://signal.me/#p/${clean}`,
    skype:     `skype:${handle}?call`,
    discord:   `https://discord.gg/${handle}`,
    linkedin:  `https://linkedin.com/in/${handle}`,
    twitter:   `https://twitter.com/${handle}`,
    tiktok:    `https://tiktok.com/@${handle}`,
    line:      `https://line.me/ti/p/${handle}`,
    messenger: `https://m.me/${handle}`,
    phone:     `tel:${clean}`,
    sms:       `sms:${clean}`,
    zoom:      `https://zoom.us/j/${handle}`,
    meet:      `https://meet.google.com/${handle}`,
    kik:       `https://kik.me/${handle}`,
    snapchat:  `https://snapchat.com/add/${handle}`,
  }
  return links[platformId] ?? null
}
