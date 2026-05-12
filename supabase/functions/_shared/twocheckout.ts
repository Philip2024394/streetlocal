// Shared 2Checkout / Verifone helpers.
// 2Checkout has two API generations: legacy (md5 hashes, buy links) and
// modern (REST 6.0 with X-Avangate-Authentication header).  We use the
// Buy Link approach for hosted checkout (no auth needed beyond merchant
// code) and REST 6.0 for refunds.

export const TC_BUY_URL = 'https://secure.2checkout.com/checkout/buy'
export const TC_REST = 'https://api.2checkout.com/rest/6.0'

// Build the X-Avangate-Authentication header value for REST 6.0 calls.
// Format: code="MERCH" date="YYYY-MM-DD HH:MM:SS" hash="<HMAC>" algo="HMAC_SHA256"
// hash = HMAC-SHA256 of `<len(MERCH)><MERCH><len(DATE)><DATE>` using secretKey
export async function buildAvangateAuth(merchantCode: string, secretKey: string): Promise<string> {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`
  const message = `${merchantCode.length}${merchantCode}${dateStr.length}${dateStr}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const hashHex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `code="${merchantCode}" date="${dateStr}" hash="${hashHex}" algo="HMAC_SHA256"`
}

// 2Checkout IPN HMAC-SHA256 verification.
// Modern scheme (default in dashboard since 2020-ish):
//   message = concat each IPN parameter as <length><value>, in alphabetical order of key,
//   excluding 'SIGNATURE' / 'HASH_SHA256_*' fields. Then HMAC-SHA256 with secretWord.
// Legacy MD5 scheme uses md5(SECRET_WORD + IPN_PID_1 + ...) — we support both.
function lenPrefixConcat(values: string[]): string {
  return values.map((v) => `${v.length}${v}`).join('')
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyTwoCheckoutIPN(fields: Record<string, string>, secretWord: string): Promise<boolean> {
  // Modern scheme: HASH_SHA256_SIGNATURE
  const hashSha = fields.HASH_SHA256_SIGNATURE || fields.SIGNATURE_SHA2_256 || fields.SIGNATURE
  if (hashSha) {
    const sortedKeys = Object.keys(fields).filter((k) => !/^(HASH|SIGNATURE)/i.test(k)).sort()
    const values = sortedKeys.map((k) => fields[k] ?? '')
    const message = lenPrefixConcat(values)
    const expected = await hmacSha256Hex(secretWord, message)
    return expected.toLowerCase() === hashSha.toLowerCase()
  }
  // Legacy MD5 not supported (Deno Web Crypto lacks MD5). Surface that as a verification failure.
  return false
}
