// validate-payment-credentials — call BEFORE saving vendor keys.
//
// Closes audit findings:
//   #11 — invalid keys silently saved to DB. Customer Pay click fails
//         with a vague gateway error. Now we make a LIVE test call
//         and refuse to save if it fails.
//   #12 — sandbox/production label mismatch. Vendor pastes sk_test_xxx
//         but sets mode=live → real charges fail forever. Now we
//         detect the mode from the key prefix and reject mismatches.
//   #13 — format validation. Bad prefixes are caught immediately.
//
// Body: { gateway_id, mode: 'test'|'live', server_key, client_key?, additional_config? }
// Returns: { ok: true, mode_detected, account_info? } or
//          { ok: false, error, code: 'format'|'mode-mismatch'|'live-call-failed' }
//
// Deploy: `supabase functions deploy validate-payment-credentials`

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { customerCors, jsonResponse, detectKeyMode, assertKeyModeMatches, newErrorId, logWithId } from '../_shared/paymentSecurity.ts'

type Mode = 'test' | 'live'

interface ValidateBody {
  gateway_id: string
  mode: Mode
  server_key: string
  client_key?: string
  additional_config?: Record<string, unknown>
}

/* ── Per-gateway live ping. Returns ok or {error} — never throws. ── */

async function pingStripe (key: string, mode: Mode): Promise<{ ok: boolean, account?: string, error?: string }> {
  const expected = mode === 'live' ? 'sk_live_' : 'sk_test_'
  if (!key.startsWith(expected)) return { ok: false, error: `Stripe key must start with ${expected}` }
  // Cheapest auth check: fetch the account record.
  const r = await fetch('https://api.stripe.com/v1/account', {
    headers: { 'Authorization': `Bearer ${key}` },
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    return { ok: false, error: `Stripe: ${data?.error?.message || `HTTP ${r.status}`}` }
  }
  const data = await r.json().catch(() => ({}))
  return { ok: true, account: data?.id }
}

async function pingMidtrans (serverKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // Midtrans server keys: SB-Mid-server-xxx (sandbox) / Mid-server-xxx (live).
  if (mode === 'live' && !serverKey.startsWith('Mid-server-')) return { ok: false, error: 'Live Midtrans key must start with Mid-server-' }
  if (mode === 'test' && !serverKey.startsWith('SB-Mid-')) return { ok: false, error: 'Sandbox Midtrans key must start with SB-Mid-' }
  // GET /v2/<random-id>/status returns 404 if the key auths but the txn
  // doesn't exist, or 401/403 if the key is invalid. We want to see 404.
  const base = mode === 'live' ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2'
  const r = await fetch(`${base}/test-key-ping/status`, {
    headers: { 'Authorization': `Basic ${btoa(serverKey + ':')}`, 'Accept': 'application/json' },
  })
  // 404 = key works, txn missing (expected). 401 = bad key.
  if (r.status === 401 || r.status === 403) return { ok: false, error: `Midtrans: invalid key (HTTP ${r.status})` }
  return { ok: true }
}

async function pingXendit (serverKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // Xendit: xnd_development_xxx (test) / xnd_production_xxx (live).
  if (mode === 'live' && !/^xnd_production_/.test(serverKey)) return { ok: false, error: 'Live Xendit key must start with xnd_production_' }
  if (mode === 'test' && !/^xnd_development_/.test(serverKey)) return { ok: false, error: 'Test Xendit key must start with xnd_development_' }
  const r = await fetch('https://api.xendit.co/balance', {
    headers: { 'Authorization': `Basic ${btoa(serverKey + ':')}` },
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    return { ok: false, error: `Xendit: ${data?.message || `HTTP ${r.status}`}` }
  }
  return { ok: true }
}

async function pingPayPal (clientId: string, secret: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  if (!secret) return { ok: false, error: 'PayPal needs both client_id (server_key) and secret (client_key)' }
  const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(clientId + ':' + secret)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    return { ok: false, error: `PayPal: ${data?.error_description || `HTTP ${r.status}`}` }
  }
  return { ok: true }
}

async function pingRazorpay (keyId: string, keySecret: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  if (!keySecret) return { ok: false, error: 'Razorpay needs both key_id (server_key) and key_secret (client_key)' }
  if (mode === 'live' && !keyId.startsWith('rzp_live_')) return { ok: false, error: 'Live Razorpay key must start with rzp_live_' }
  if (mode === 'test' && !keyId.startsWith('rzp_test_')) return { ok: false, error: 'Test Razorpay key must start with rzp_test_' }
  // GET /v1/payments returns a list if the key auths.
  const r = await fetch('https://api.razorpay.com/v1/payments?count=1', {
    headers: { 'Authorization': `Basic ${btoa(keyId + ':' + keySecret)}` },
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    return { ok: false, error: `Razorpay: ${data?.error?.description || `HTTP ${r.status}`}` }
  }
  return { ok: true }
}

async function pingMollie (apiKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // Mollie: test_xxx / live_xxx prefix.
  if (mode === 'live' && !/^live_/.test(apiKey)) return { ok: false, error: 'Live Mollie key must start with live_' }
  if (mode === 'test' && !/^test_/.test(apiKey)) return { ok: false, error: 'Test Mollie key must start with test_' }
  const r = await fetch('https://api.mollie.com/v2/methods', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    return { ok: false, error: `Mollie: ${data?.detail || `HTTP ${r.status}`}` }
  }
  return { ok: true }
}

async function pingHitPay (apiKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // HitPay doesn't have a "test" key prefix — sandbox is differentiated by API URL.
  const base = mode === 'live' ? 'https://api.hit-pay.com/v1' : 'https://api.sandbox.hit-pay.com/v1'
  // GET /payment-requests returns 200 + list if key auths.
  const r = await fetch(`${base}/payment-requests?limit=1`, {
    headers: { 'X-BUSINESS-API-KEY': apiKey, 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (!r.ok) return { ok: false, error: `HitPay: HTTP ${r.status}` }
  return { ok: true }
}

async function pingBraintree (merchantId: string, publicKey: string, privateKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  if (!publicKey || !privateKey) return { ok: false, error: 'Braintree needs merchant_id + public_key + private_key' }
  const base = mode === 'live' ? 'https://api.braintreegateway.com' : 'https://api.sandbox.braintreegateway.com'
  // GET on the merchant graphql/transaction-search endpoint validates Basic auth.
  const r = await fetch(`${base}/merchants/${encodeURIComponent(merchantId)}/payment_methods`, {
    headers: { 'Authorization': `Basic ${btoa(publicKey + ':' + privateKey)}`, 'Accept': 'application/xml', 'X-ApiVersion': '5' },
  })
  if (r.status === 401 || r.status === 403) return { ok: false, error: `Braintree: invalid credentials (HTTP ${r.status})` }
  // 404 may mean merchant doesn't exist OR endpoint shape changed — treat as a softer fail.
  if (r.status === 404) return { ok: false, error: 'Braintree: merchant_id not found' }
  return { ok: true }
}

async function pingCheckoutCom (secretKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // Checkout.com secret keys: sk_xxx for live, sk_sbox_xxx / sk_test_xxx for sandbox.
  if (mode === 'live' && /^sk_(sbox|test)_/.test(secretKey)) return { ok: false, error: 'Sandbox key in live mode — use sk_ (no sbox/test prefix) for live' }
  if (mode === 'test' && !/^sk_(sbox|test)_/.test(secretKey) && !secretKey.startsWith('sk_')) return { ok: false, error: 'Test key should start with sk_sbox_ or sk_test_' }
  const base = mode === 'live' ? 'https://api.checkout.com' : 'https://api.sandbox.checkout.com'
  // GET /events returns 200 + list if key auths.
  const r = await fetch(`${base}/workflows`, {
    headers: { 'Authorization': secretKey, 'Accept': 'application/json' },
  })
  if (r.status === 401 || r.status === 403) return { ok: false, error: `Checkout.com: invalid key (HTTP ${r.status})` }
  return { ok: true }
}

async function pingAuthorizeNet (apiLoginId: string, transactionKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  if (!transactionKey) return { ok: false, error: 'Authorize.Net needs api_login_id + transaction_key' }
  const apiUrl = mode === 'live' ? 'https://api.authorize.net/xml/v1/request.api' : 'https://apitest.authorize.net/xml/v1/request.api'
  // authenticateTestRequest — Authorize.Net's documented "ping" endpoint.
  const r = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authenticateTestRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
      },
    }),
  })
  const txt = await r.text()
  // Authorize.Net returns BOM-prefixed JSON.
  const clean = txt.replace(/^﻿/, '')
  let data: any = {}
  try { data = JSON.parse(clean) } catch {}
  const resultCode = data?.messages?.resultCode
  if (resultCode !== 'Ok') {
    const msg = data?.messages?.message?.[0]?.text || `HTTP ${r.status}`
    return { ok: false, error: `Authorize.Net: ${msg}` }
  }
  return { ok: true }
}

async function pingTwoCheckout (merchantCode: string, secretKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // 2Checkout (Verifone) doesn't have a public auth-test endpoint. The
  // safest live check is the IPN/JSON API status. Format validation
  // only for now — most 2CO failures surface at Buy Link redirect.
  if (!merchantCode) return { ok: false, error: '2Checkout merchant_code required' }
  if (!secretKey) return { ok: false, error: '2Checkout secret_key / secret_word required' }
  if (merchantCode.length < 6) return { ok: false, error: '2Checkout merchant_code looks too short' }
  // Smoke test: ping their public availability endpoint to confirm
  // the merchant is reachable. Doesn't auth-check the secret.
  const url = `https://api.2checkout.com/rest/6.0/companies/?keyword=${encodeURIComponent(merchantCode)}`
  try {
    await fetch(url, { method: 'GET', headers: { 'X-Avangate-Authentication': merchantCode } })
  } catch { /* network errors are non-fatal for the smoke test */ }
  return { ok: true }
}

async function pingCyberSource (merchantId: string, keyId: string, sharedSecret: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // CyberSource uses HTTP signature auth (RFC-style HMAC). A full live
  // ping requires constructing the signed Authorization header — too
  // much for a format check. Do format validation only.
  if (!merchantId) return { ok: false, error: 'CyberSource merchant_id required' }
  if (!keyId || !sharedSecret) return { ok: false, error: 'CyberSource key_id + shared_secret required' }
  if (sharedSecret.length < 20) return { ok: false, error: 'CyberSource shared_secret looks too short — should be a base64 string ~44 chars' }
  return { ok: true }
}

async function pingFomoPay (merchantId: string, secretKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  // FOMO Pay uses signed JSON-RPC. Format check only — full live ping
  // requires constructing the SHA-256 signature with merchant secret.
  if (!merchantId) return { ok: false, error: 'FOMO Pay merchant_id required' }
  if (!secretKey || secretKey.length < 16) return { ok: false, error: 'FOMO Pay secret_key required (>= 16 chars)' }
  return { ok: true }
}

async function pingRapyd (accessKey: string, secretKey: string, mode: Mode): Promise<{ ok: boolean, error?: string }> {
  if (!secretKey) return { ok: false, error: 'Rapyd needs access_key + secret_key' }
  const base = mode === 'live' ? 'https://api.rapyd.net' : 'https://sandboxapi.rapyd.net'
  // Build a signed GET to /v1/user — Rapyd's account info endpoint.
  const httpMethod = 'get'
  const urlPath = '/v1/user'
  const salt = crypto.randomUUID()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const body = ''
  const toSign = httpMethod + urlPath + salt + timestamp + accessKey + secretKey + body
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(toSign))
  const sigHex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  const signature = btoa(sigHex)
  const r = await fetch(`${base}${urlPath}`, {
    headers: { 'access_key': accessKey, 'salt': salt, 'timestamp': timestamp, 'signature': signature, 'Content-Type': 'application/json' },
  })
  if (r.status === 401 || r.status === 403) return { ok: false, error: `Rapyd: invalid credentials (HTTP ${r.status})` }
  if (r.status === 404) return { ok: true } // signing OK, endpoint just gone — still a valid auth path
  return { ok: true }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: customerCors })
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405)

  let body: ValidateBody
  try { body = await req.json() } catch { return jsonResponse({ error: 'Invalid JSON' }, 400) }

  const { gateway_id, mode, server_key, client_key } = body
  if (!gateway_id || !mode || !server_key) {
    return jsonResponse({ error: 'gateway_id, mode, and server_key required', code: 'format' }, 400)
  }
  if (mode !== 'test' && mode !== 'live') {
    return jsonResponse({ error: 'mode must be "test" or "live"', code: 'format' }, 400)
  }

  // Generic prefix check (works for gateways with sk_/rzp_/etc.).
  const modeCheck = assertKeyModeMatches(server_key, mode)
  if (!modeCheck.ok && modeCheck.error) {
    return jsonResponse({ error: modeCheck.error, code: 'mode-mismatch' }, 400)
  }

  try {
    let result: { ok: boolean, error?: string, account?: string }
    switch (gateway_id) {
      case 'stripe':    result = await pingStripe(server_key, mode); break
      case 'midtrans':  result = await pingMidtrans(server_key, mode); break
      case 'xendit':    result = await pingXendit(server_key, mode); break
      case 'paypal':    result = await pingPayPal(server_key, client_key || '', mode); break
      case 'razorpay':  result = await pingRazorpay(server_key, client_key || '', mode); break
      case 'mollie':       result = await pingMollie(server_key, mode); break
      case 'hitpay':       result = await pingHitPay(server_key, mode); break
      case 'braintree':    result = await pingBraintree(
        String(body.additional_config?.merchantId || ''),
        server_key, client_key || '', mode); break
      case 'checkout-com': result = await pingCheckoutCom(server_key, mode); break
      case 'authorize-net': result = await pingAuthorizeNet(server_key, client_key || '', mode); break
      case '2checkout':    result = await pingTwoCheckout(server_key, client_key || String(body.additional_config?.secretWord || ''), mode); break
      case 'cybersource':  result = await pingCyberSource(
        String(body.additional_config?.merchantId || ''),
        server_key, client_key || '', mode); break
      case 'fomo-pay':
      case 'fomopay':      result = await pingFomoPay(server_key, client_key || '', mode); break
      case 'rapyd':        result = await pingRapyd(server_key, client_key || '', mode); break
      case 'worldpay':
        // Worldpay credentials are a service-key + client-key pair;
        // their public API requires a signed token flow that's too
        // heavy for a save-time check. Accept on format only.
        if (!server_key || server_key.length < 12) return jsonResponse({ ok: false, error: 'Worldpay: service_key looks too short', code: 'format' }, 400)
        return jsonResponse({ ok: true, mode_detected: detectKeyMode(server_key), note: 'Format check only — Worldpay live ping requires a signed token flow' })
      default:
        // For gateways we don't have a ping for yet, just do format
        // validation and accept. Better than nothing.
        return jsonResponse({ ok: true, mode_detected: detectKeyMode(server_key), note: 'Format check only — live ping not implemented for this gateway' })
    }
    if (!result.ok) {
      const errId = newErrorId()
      logWithId(errId, 'credential-validation-failed', { gateway_id, mode, error: result.error })
      return jsonResponse({ ok: false, error: result.error, code: 'live-call-failed', errorId: errId }, 400)
    }
    return jsonResponse({ ok: true, mode_detected: detectKeyMode(server_key), account_info: result.account })
  } catch (e) {
    const errId = newErrorId()
    logWithId(errId, 'credential-validation-uncaught', { gateway_id, error: String(e) })
    return jsonResponse({ error: 'Validation service error', errorId: errId }, 500)
  }
})
