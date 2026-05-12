// Shared Adyen helpers.
// Adyen uses minor units (e.g., cents for EUR, paise for INR).
// Different currencies have different decimal counts.

const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])
const ZERO_DECIMAL = new Set([
  'BIF','BYR','CLP','DJF','GNF','ISK','JPY','KMF','KRW',
  'PYG','RWF','UGX','UYI','VND','VUV','XAF','XOF','XPF','IDR'
])

export function adyenMinorUnits(amount: number, currency: string): number {
  const cur = currency.toUpperCase()
  if (THREE_DECIMAL.has(cur)) return Math.round(amount * 1000)
  if (ZERO_DECIMAL.has(cur))  return Math.round(amount)
  return Math.round(amount * 100)
}

// Test environment is the same URL for all merchants.
// Live environment uses a merchant-specific prefix in the URL.
export function adyenApiBase(mode: string, liveUrlPrefix?: string | null): string {
  if (mode === 'live') {
    if (!liveUrlPrefix) {
      // Fall back to the generic checkout endpoint (works but lower throughput)
      return 'https://checkout-live.adyen.com/v71'
    }
    return `https://${liveUrlPrefix}-checkout-live.adyenpayments.com/checkout/v71`
  }
  return 'https://checkout-test.adyen.com/v71'
}

// Adyen HMAC signing (webhook verification).
// Signed string format:
//   <pspReference>:<originalReference>:<merchantAccountCode>:<merchantReference>:<value>:<currency>:<eventCode>:<success>
// Empty fields stay empty (no placeholder). Then HMAC-SHA256 with the hex-decoded HMAC key,
// base64-encode the result, compare to additionalData.hmacSignature.
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

export async function adyenHmacSign(dataString: string, hmacKeyHex: string): Promise<string> {
  const keyBytes = hexToBytes(hmacKeyHex)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataString))
  // base64 of the binary signature
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function adyenVerifyNotification(item: any, hmacKeyHex: string): Promise<boolean> {
  const expectedHmac = item?.NotificationRequestItem?.additionalData?.hmacSignature
  if (!expectedHmac) return false
  const i = item.NotificationRequestItem
  // Adyen escapes ':' and '\' in values for the signed string
  const esc = (s: any) => String(s ?? '').replace(/\\/g, '\\\\').replace(/:/g, '\\:')
  const dataString = [
    esc(i.pspReference),
    esc(i.originalReference || ''),
    esc(i.merchantAccountCode),
    esc(i.merchantReference),
    esc(i.amount?.value ?? ''),
    esc(i.amount?.currency ?? ''),
    esc(i.eventCode),
    esc(i.success),
  ].join(':')
  const computed = await adyenHmacSign(dataString, hmacKeyHex)
  // constant-time compare
  if (computed.length !== expectedHmac.length) return false
  let diff = 0
  for (let n = 0; n < computed.length; n++) diff |= computed.charCodeAt(n) ^ expectedHmac.charCodeAt(n)
  return diff === 0
}
