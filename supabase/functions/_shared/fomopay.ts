// FOMO Pay signing helpers.
// FOMO Pay (like many SEA / Chinese payment gateways) signs API requests
// and webhooks by:
//   1. Take all parameters except `sign` and `sign_type`
//   2. Sort by key alphabetically
//   3. Concatenate as key=value&key=value...
//   4. Append &key=<signKey> at the end
//   5. HMAC-SHA256 the resulting string using signKey, return UPPERCASE hex
//
// Some FOMO merchants use MD5 instead — we expose both via signType.

export const FOMO_API = (mode: string) =>
  mode === 'live' ? 'https://service.fomopay.com' : 'https://service-sandbox.fomopay.com'

function canonicalParamString(params: Record<string, unknown>): string {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== null && params[k] !== undefined && params[k] !== '')
    .sort()
  return keys.map((k) => `${k}=${params[k]}`).join('&')
}

async function hmacSha256HexUpper(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

async function md5HexUpper(payload: string): Promise<string> {
  // Deno's Web Crypto doesn't expose MD5 directly. FOMO merchants using
  // MD5 are increasingly rare; if needed we fall back to a tiny inline
  // implementation. For now we only support HMAC-SHA256 (the default).
  throw new Error('MD5 not supported — set signType=HMAC-SHA256 in your FOMO Pay account')
}

export async function fomoSign(params: Record<string, unknown>, signKey: string, signType = 'HMAC-SHA256'): Promise<string> {
  const base = canonicalParamString(params) + `&key=${signKey}`
  if (signType === 'MD5') return await md5HexUpper(base)
  return await hmacSha256HexUpper(signKey, base)
}

export async function fomoVerify(params: Record<string, unknown>, signKey: string, signType = 'HMAC-SHA256'): Promise<boolean> {
  const received = String(params.sign || '').toUpperCase()
  if (!received) return false
  const expected = await fomoSign(params, signKey, signType)
  if (expected.length !== received.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  return diff === 0
}
