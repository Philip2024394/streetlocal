// Shared Worldpay (FIS) Online API helpers.
// Worldpay Online API (api.worldpay.com/v1) uses raw bearer-style auth:
//   Authorization: <serviceKey>      (NOT "Bearer <key>")
// clientKey is the per-vendor public key used by Worldpay.js for card
// tokenisation; serviceKey is the secret used for server-side calls.

export const WP_API = 'https://api.worldpay.com/v1'

// Worldpay sends webhook notifications with an X-Worldpay-Signature
// header containing an HMAC-SHA512 of the raw request body using the
// vendor's webhook signing secret (configured per-account, separate
// from the service key). We accept both hex- and base64-encoded
// signatures because Worldpay's docs differ across product lines.
async function hmacSha512(secret: string, payload: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  return await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

export async function verifyWorldpaySignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false
  const sig = await hmacSha512(secret, rawBody)
  const hex = bytesToHex(sig).toLowerCase()
  const b64 = bytesToBase64(sig)
  const incoming = signatureHeader.trim()
  return incoming.toLowerCase() === hex || incoming === b64
}
