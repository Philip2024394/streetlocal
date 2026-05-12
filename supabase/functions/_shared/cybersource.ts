// Shared CyberSource (Visa Acceptance Solutions) helpers.
// Two distinct credential sets coexist:
//   1. Secure Acceptance Hosted Checkout — Profile ID + Access Key + Secret Key
//      Used for the customer-facing hosted payment page (HMAC-SHA256 signed form POST).
//   2. REST API — Merchant ID + API Key ID + Shared Secret
//      Used for refunds and back-office calls (HTTP Signature auth).

export const CS_SA_HOSTED_TEST = 'https://testsecureacceptance.cybersource.com/pay'
export const CS_SA_HOSTED_LIVE = 'https://secureacceptance.cybersource.com/pay'
export const CS_REST_TEST = 'apitest.cybersource.com'
export const CS_REST_LIVE = 'api.cybersource.com'

// ---------- Secure Acceptance signing ----------
// Sign comma-separated <field=value,...> string with secret_key (HMAC-SHA256, base64).
async function hmacSha256Base64(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function signSecureAcceptanceFields(fields: Record<string, string>, secretKey: string): Promise<string> {
  const signedNames = (fields.signed_field_names || '').split(',')
  const dataToSign = signedNames.map((n) => `${n}=${fields[n] ?? ''}`).join(',')
  return await hmacSha256Base64(secretKey, dataToSign)
}

export async function verifySecureAcceptanceFields(fields: Record<string, string>, secretKey: string): Promise<boolean> {
  const expected = await signSecureAcceptanceFields(fields, secretKey)
  return expected === fields.signature
}

// ---------- REST API HTTP Signature ----------
// Builds the headers required for CyberSource REST 6.0 / pts/v2:
//   Host, Date, Digest (SHA-256 of body, base64), v-c-merchant-id, Signature
// Returns a Record<string,string> ready to spread into fetch headers.
function rfc1123Date(d: Date): string {
  return d.toUTCString()
}

async function sha256Base64(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

async function hmacSha256Base64WithKeyBytes(keyBytes: Uint8Array, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function base64Decode(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export interface CsHttpSigArgs {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  resourcePath: string // e.g. "/pts/v2/payments/12345/refunds"
  host: string         // apitest.cybersource.com OR api.cybersource.com
  merchantId: string
  apiKeyId: string
  sharedSecret: string // base64-encoded
  body?: string        // raw JSON body (or '' for GETs)
}

export async function buildCsHttpSignatureHeaders(args: CsHttpSigArgs): Promise<Record<string, string>> {
  const date = rfc1123Date(new Date())
  const hasBody = args.method !== 'GET' && args.method !== 'DELETE' && !!args.body
  const digest = hasBody ? `SHA-256=${await sha256Base64(args.body || '')}` : ''

  const signedHeaders: Array<[string, string]> = [
    ['host', args.host],
    ['date', date],
  ]
  if (hasBody) signedHeaders.push(['digest', digest])
  signedHeaders.push([`(request-target)`, `${args.method.toLowerCase()} ${args.resourcePath}`])
  signedHeaders.push(['v-c-merchant-id', args.merchantId])

  const headerNames = signedHeaders.map(([n]) => n).join(' ')
  const signingString = signedHeaders.map(([n, v]) => `${n}: ${v}`).join('\n')

  const keyBytes = base64Decode(args.sharedSecret)
  const signature = await hmacSha256Base64WithKeyBytes(keyBytes, signingString)

  const sigHeader = `keyid="${args.apiKeyId}", algorithm="HmacSHA256", headers="${headerNames}", signature="${signature}"`

  const headers: Record<string, string> = {
    'v-c-merchant-id': args.merchantId,
    'Date': date,
    'Host': args.host,
    'Signature': sigHeader,
    'Accept': 'application/hal+json;charset=utf-8',
    'User-Agent': 'streetlocal/1.0',
  }
  if (hasBody) {
    headers['Digest'] = digest
    headers['Content-Type'] = 'application/json;charset=utf-8'
  }
  return headers
}
