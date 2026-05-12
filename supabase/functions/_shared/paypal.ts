// Shared PayPal helpers used by paypal-create-order, paypal-webhook, paypal-refund.
// PayPal uses OAuth 2.0 client_credentials — we exchange client_id+secret
// for a short-lived access_token before every API call (token cache could
// be added later; for now we just fetch fresh per call to keep stateless).

export const PAYPAL_API = (mode: string) =>
  mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

export async function paypalAccessToken(clientId: string, secret: string, mode: string): Promise<string> {
  const auth = 'Basic ' + btoa(`${clientId}:${secret}`)
  const r = await fetch(`${PAYPAL_API(mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: 'grant_type=client_credentials',
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'PayPal OAuth failed')
  }
  return data.access_token as string
}

// PayPal signs webhooks with a separate verify endpoint — we re-POST the
// notification headers + body + webhook_id to PayPal and they tell us if
// it's authentic. Cleaner than reimplementing their cert-chain HMAC.
export async function paypalVerifyWebhook(
  mode: string,
  accessToken: string,
  headers: Headers,
  rawBody: string,
  webhookId: string,
): Promise<boolean> {
  const verifyPayload = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  }
  const r = await fetch(`${PAYPAL_API(mode)}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload),
  })
  if (!r.ok) return false
  const result = await r.json().catch(() => ({}))
  return result.verification_status === 'SUCCESS'
}
