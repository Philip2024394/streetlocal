/**
 * Shared payment gateway connection helpers.
 *
 * Canonical source for save / remove / load against vendor_payment_connections.
 * Used by all 4 apps so a vendor's keys persist across devices and the
 * customer-side edge functions can read them at charge time.
 *
 * Field shape (per row in vendor_payment_connections):
 *   vendor_id           bigint / uuid  (restaurants.id for food apps, vendor_accounts.id for products/services)
 *   gateway_id          text           ('midtrans' | 'stripe' | …)
 *   mode                text           ('test' | 'live')
 *   is_active           boolean
 *   server_key          text           (the secret / API key)
 *   client_key          text           (the publishable / public key)
 *   webhook_secret      text           (signing secret, if the gateway provides one)
 *   additional_config   jsonb          (gateway-specific extras: merchantAccount, country, etc.)
 *   escrow_enabled      boolean        (stripe-only, capture_method=manual)
 *   escrow_hold_days    int            (stripe-only)
 *
 * Gateway UI fields use vendor-friendly names ("secretKey", "publishableKey").
 * GATEWAY_FIELD_MAP translates those to the column names above. Anything not
 * in the map is preserved in additional_config jsonb so unusual fields don't
 * need schema changes.
 */

// Map UI field names → DB column names, per gateway.
export const GATEWAY_FIELD_MAP = {
  midtrans:        { server_key: 'server_key', client_key: 'client_key' },
  stripe:          { secretKey: 'server_key', publishableKey: 'client_key', webhookSecret: 'webhook_secret' },
  xendit:          { secretKey: 'server_key', publicKey: 'client_key', callbackToken: 'webhook_secret' },
  paypal:          { clientId: 'server_key', secret: 'client_key', webhookId: 'webhook_secret' },
  razorpay:        { keyId: 'server_key', keySecret: 'client_key', webhookSecret: 'webhook_secret' },
  braintree:       { publicKey: 'server_key', privateKey: 'client_key' },
  mollie:          { liveApiKey: 'server_key', testApiKey: 'client_key' },
  hitpay:          { apiKey: 'server_key', salt: 'webhook_secret' },
  adyen:           { apiKey: 'server_key', clientKey: 'client_key', hmacKey: 'webhook_secret' },
  rapyd:           { accessKey: 'server_key', secretKey: 'client_key' },
  'checkout-com':  { secretKey: 'server_key', publicKey: 'client_key', webhookSecret: 'webhook_secret' },
  'fomo-pay':      { apiKey: 'server_key', signKey: 'webhook_secret' },
  'authorize-net': { apiLoginId: 'server_key', transactionKey: 'client_key', signatureKey: 'webhook_secret' },
  '2checkout':     { merchantCode: 'server_key', secretKey: 'client_key', secretWord: 'webhook_secret' },
  cybersource:     { merchantId: 'server_key', apiKeyId: 'client_key', sharedSecret: 'webhook_secret' },
  worldpay:        { serviceKey: 'server_key', clientKey: 'client_key', webhookSecret: 'webhook_secret' },
}

const KNOWN_COLS = new Set(['server_key', 'client_key', 'webhook_secret'])
// Escrow toggle is Stripe-only — capture_method=manual + hold N days then release.
const ESCROW_COLS = new Set(['escrow_enabled', 'escrow_hold_days'])

/**
 * Upsert a vendor's gateway credentials.
 *  - supabase    Supabase client (or null in demo mode)
 *  - vendorId    restaurant.id or vendor_accounts.id
 *  - gatewayId   'midtrans' | 'stripe' | …
 *  - config      object from the form ({ mode, serverKey, secretKey, ... })
 * Returns the upserted row, or null on demo / error.
 */
export async function saveGatewayConnection(supabase, vendorId, gatewayId, config) {
  if (!supabase || !vendorId) return null
  const map = GATEWAY_FIELD_MAP[gatewayId] || {}
  const row = {
    vendor_id: vendorId,
    gateway_id: gatewayId,
    mode: config.mode || 'test',
    is_active: true,
    server_key: null, client_key: null, webhook_secret: null,
    additional_config: {},
  }
  for (const [k, v] of Object.entries(config)) {
    if (k === 'mode' || k === 'connected' || k === 'connectedAt') continue
    if (ESCROW_COLS.has(k)) {
      if (gatewayId === 'stripe') row[k] = v
      continue
    }
    const mapped = map[k] || k
    if (KNOWN_COLS.has(mapped)) row[mapped] = v
    else row.additional_config[k] = v
  }
  try {
    const { data, error } = await supabase
      .from('vendor_payment_connections')
      .upsert(row, { onConflict: 'vendor_id,gateway_id' })
      .select().single()
    if (error) { console.warn('gateway save failed', error); return null }
    return data
  } catch (e) {
    console.warn('gateway save threw', e); return null
  }
}

/** Delete a vendor's gateway connection row. */
export async function removeGatewayConnection(supabase, vendorId, gatewayId) {
  if (!supabase || !vendorId) return false
  try {
    const { error } = await supabase
      .from('vendor_payment_connections').delete()
      .eq('vendor_id', vendorId).eq('gateway_id', gatewayId)
    if (error) { console.warn('gateway remove failed', error); return false }
    return true
  } catch (e) {
    console.warn('gateway remove threw', e); return false
  }
}

/**
 * Load all of a vendor's gateway connections into the UI shape used by
 * the existing dashboard pages: { [gatewayId]: { connected, mode, ...fields } }.
 * Reverses the field map so the form re-shows what the vendor typed.
 */
export async function loadGatewayConnections(supabase, vendorId) {
  if (!supabase || !vendorId) return {}
  try {
    const { data, error } = await supabase
      .from('vendor_payment_connections').select('*')
      .eq('vendor_id', vendorId).eq('is_active', true)
    if (error) { console.warn('gateway load failed', error); return {} }
    const out = {}
    for (const row of data || []) {
      const map = GATEWAY_FIELD_MAP[row.gateway_id] || {}
      // Reverse-map column → UI field name
      const reverse = {}
      for (const [uiKey, col] of Object.entries(map)) reverse[col] = uiKey
      const entry = { connected: true, mode: row.mode || 'test' }
      if (row.server_key)     entry[reverse.server_key     || 'server_key']     = row.server_key
      if (row.client_key)     entry[reverse.client_key     || 'client_key']     = row.client_key
      if (row.webhook_secret) entry[reverse.webhook_secret || 'webhook_secret'] = row.webhook_secret
      Object.assign(entry, row.additional_config || {})
      if (row.escrow_enabled != null)   entry.escrow_enabled   = row.escrow_enabled
      if (row.escrow_hold_days != null) entry.escrow_hold_days = row.escrow_hold_days
      out[row.gateway_id] = entry
    }
    return out
  } catch (e) {
    console.warn('gateway load threw', e); return {}
  }
}
