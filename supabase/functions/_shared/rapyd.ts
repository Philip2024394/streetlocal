// Shared Rapyd helpers.
// Rapyd uses a custom signature scheme on every API call: HMAC-SHA256
// of (method + url_path + salt + timestamp + access_key + secret_key + body)
// using secret_key as the HMAC key. The HMAC is hex-encoded THEN
// base64-encoded for the `signature` header.
// Documented at: https://docs.rapyd.net/build-with-rapyd/reference/message-security

export const RAPYD_API = (mode: string) =>
  mode === 'live' ? 'https://api.rapyd.net' : 'https://sandboxapi.rapyd.net'

function randomSalt(len = 16): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Generic Rapyd-signed request helper.
// urlPath includes the leading slash (e.g., '/v1/checkout') and any query string.
// body is a JSON-serializable object or null for GET/DELETE.
export async function rapydRequest(
  accessKey: string,
  secretKey: string,
  mode: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  urlPath: string,
  body?: Record<string, unknown> | null,
): Promise<any> {
  const salt = randomSalt()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const bodyStr = body ? JSON.stringify(body) : ''
  // Rapyd quirk: if body is "{}" they want empty string instead
  const bodyForSign = bodyStr === '{}' ? '' : bodyStr

  const toSign = method.toLowerCase() + urlPath + salt + timestamp + accessKey + secretKey + bodyForSign
  const sigHex = await hmacSha256Hex(secretKey, toSign)
  const signature = btoa(sigHex)

  const r = await fetch(`${RAPYD_API(mode)}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_key': accessKey,
      'signature': signature,
      'salt': salt,
      'timestamp': timestamp,
    },
    body: method === 'GET' || method === 'DELETE' ? undefined : bodyStr,
  })
  const result = await r.json().catch(() => ({}))
  if (!r.ok || result.status?.status === 'ERROR' || result.status?.status === 'FAILURE') {
    const msg = result.status?.message || result.status?.error_code || `Rapyd ${urlPath} failed (${r.status})`
    const err = new Error(msg) as any
    err.detail = result
    throw err
  }
  return result.data
}

// Verify a Rapyd webhook signature.
// Webhook to_sign = absolute_url + salt + timestamp + access_key + secret_key + body
// where absolute_url is the FULL URL Rapyd POSTed to (we get it from headers).
export async function verifyRapydWebhook(
  fullUrl: string,
  rawBody: string,
  headers: Headers,
  accessKey: string,
  secretKey: string,
): Promise<boolean> {
  const sig = headers.get('signature') || ''
  const salt = headers.get('salt') || ''
  const timestamp = headers.get('timestamp') || ''
  const incomingAccessKey = headers.get('access_key') || ''
  if (!sig || !salt || !timestamp || incomingAccessKey !== accessKey) return false
  const bodyForSign = rawBody === '{}' ? '' : rawBody
  const toSign = fullUrl + salt + timestamp + accessKey + secretKey + bodyForSign
  const sigHex = await hmacSha256Hex(secretKey, toSign)
  const expected = btoa(sigHex)
  // constant-time compare
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}
