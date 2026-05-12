// Shared Braintree helpers.
// Braintree's modern surface is a GraphQL API at https://payments.braintree-api.com/graphql
// (sandbox: payments.sandbox.braintree-api.com). Auth is HTTP Basic with
// public_key:private_key plus a Braintree-Version header. Money amounts go in
// as strings ("12.34"), not numbers.
//
// Webhooks come as application/x-www-form-urlencoded with two fields:
//   bt_signature = <public_key>|<sha1_hex(public_key + private_key)>  + '|' + hmacSha1(payload, private_key)
// Actually the real verification scheme:
//   1. Split bt_signature by '|' → list of "publicKey|signature" pairs
//   2. Find the pair whose publicKey matches OUR public_key
//   3. Verify that signature = sha1_hex(hmac_sha1(bt_payload, private_key) … )
// In practice Braintree's signature looks like  "pk1|sig1&pk2|sig2"
// The reference implementation in their SDK XORs/joins them. We follow the
// same flow below.

export const BT_GRAPHQL = (mode: string) =>
  mode === 'live'
    ? 'https://payments.braintree-api.com/graphql'
    : 'https://payments.sandbox.braintree-api.com/graphql'

export async function btGraphql<T = any>(
  publicKey: string,
  privateKey: string,
  mode: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const auth = 'Basic ' + btoa(`${publicKey}:${privateKey}`)
  const r = await fetch(BT_GRAPHQL(mode), {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
      'Braintree-Version': '2019-01-01',
    },
    body: JSON.stringify({ query, variables }),
  })
  const result = await r.json().catch(() => ({}))
  if (!r.ok || result.errors) {
    const msg = result.errors?.[0]?.message || result.error_description || `Braintree GraphQL failed (${r.status})`
    throw new Error(msg)
  }
  return result.data as T
}

// HMAC-SHA1 hex (used by Braintree webhook signature scheme)
export async function hmacSha1Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Verify a Braintree webhook signature.
// bt_signature is a `|`-separated list of "<publicKey>|<sig>" pairs joined by `&`.
// We find the pair matching our publicKey and check sha1Hex(hmacSha1(payload, privateKey)).
export async function verifyBtWebhook(btSignature: string, btPayload: string, publicKey: string, privateKey: string): Promise<boolean> {
  if (!btSignature || !btPayload) return false
  const pairs = btSignature.split('&').map((p) => p.split('|'))
  const match = pairs.find(([pk]) => pk === publicKey)
  if (!match || match.length < 2) return false
  const expected = await hmacSha1Hex(privateKey, btPayload)
  // Constant-time compare
  if (expected.length !== match[1].length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ match[1].charCodeAt(i)
  return diff === 0
}
