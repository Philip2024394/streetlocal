// sms-test-send
//
// Vendor-triggered Twilio SMS smoke test. Invoked from the Settings →
// SMS notifications page so the vendor can verify their credentials
// reach Twilio and that the From number is provisioned before turning
// on order-ready SMS for real customers.
//
// Body: {
//   vendor_id?: string,        // optional — only used for audit logging
//   account_sid: string,
//   auth_token:  string,
//   from_number: string,
//   to_number:   string,       // E.164, defaults to vendor.shop_phone in the UI
//   shop_name?:  string,
// }
//
// Mirrors order-sms-notify but takes credentials from the request body
// rather than vendor_accounts, because the vendor may still be typing
// them in. Returns { ok, sid } on success or { ok:false, error } on
// failure. The UI renders a green / red pill based on `ok`.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const account_sid = String(body.account_sid || '').trim()
    const auth_token  = String(body.auth_token  || '').trim()
    const from_number = String(body.from_number || '').trim()
    const to_number   = String(body.to_number   || '').trim()
    const shop_name   = String(body.shop_name   || 'StreetLocal').trim() || 'StreetLocal'

    if (!account_sid || !auth_token || !from_number || !to_number) {
      return new Response(JSON.stringify({ ok: false, error: 'account_sid, auth_token, from_number, to_number required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const text = `✅ StreetLocal SMS test from ${shop_name}`
    const auth = btoa(`${account_sid}:${auth_token}`)
    const params = new URLSearchParams({ From: from_number, To: to_number, Body: text })

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await resp.json().catch(() => ({} as Record<string, unknown>))
    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: (data as { message?: string })?.message || `Twilio HTTP ${resp.status}`, code: (data as { code?: number })?.code, status: resp.status }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ ok: true, sid: (data as { sid?: string })?.sid, to: to_number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
