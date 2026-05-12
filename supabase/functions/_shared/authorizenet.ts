// Shared Authorize.net helpers.
// Authorize.net uses a single JSON API endpoint with the request type as
// the top-level key. Every request must include `merchantAuthentication`
// with the API login id + transaction key.

export const ANET_API = (mode: string) =>
  mode === 'live'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api'

export const ANET_HOSTED = (mode: string) =>
  mode === 'live'
    ? 'https://accept.authorize.net/payment/payment'
    : 'https://test.authorize.net/payment/payment'

export async function anetRequest(apiUrl: string, payload: Record<string, unknown>): Promise<any> {
  const r = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  // Authorize.net returns text/plain sometimes with a BOM. Read raw and parse.
  const text = await r.text()
  const clean = text.replace(/^﻿/, '')
  let result: any
  try { result = JSON.parse(clean) } catch { throw new Error('Authorize.net returned non-JSON: ' + clean.slice(0, 200)) }
  if (result?.messages?.resultCode && result.messages.resultCode !== 'Ok') {
    const msg = result.messages.message?.[0]?.text || 'Authorize.net error'
    const code = result.messages.message?.[0]?.code || ''
    const err = new Error(`${msg}${code ? ` (${code})` : ''}`) as any
    err.detail = result
    throw err
  }
  return result
}

// Authorize.net webhook signature: HMAC-SHA512 of the raw body using the
// Signature Key from Account → Settings → Signature Key. Sent in
// X-ANET-Signature header as "sha512=<hex_upper>".
export async function verifyAnetWebhook(rawBody: string, signatureHeader: string, signatureKey: string): Promise<boolean> {
  if (!signatureHeader || !signatureKey) return false
  // signatureKey is hex-encoded; we use it directly as a UTF-8 string for HMAC
  // (Authorize.net's spec: "Use the signature key as a key for the HMAC-SHA512 algorithm")
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(signatureKey), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expectedHex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  const expected = `sha512=${expectedHex}`
  // constant-time compare (case-insensitive on the hex portion)
  const got = signatureHeader.toUpperCase()
  if (got.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ got.charCodeAt(i)
  return diff === 0
}
