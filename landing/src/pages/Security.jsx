import React from 'react'
import SLLayout from '../SLLayout.jsx'

export default function Security () {
  return (
    <SLLayout
      kicker="How we keep you safe"
      title="Security."
      lede="StreetLocal is software for local businesses, not a payment processor. We've designed the platform so that we couldn't compromise vendor funds or customer card data even if we wanted to. Here's exactly what that looks like."
    >
      <section className="sl-container" style={{ paddingBottom: 80 }}>
        <div className="sl-prose">
          <h2 className="sl-h2">Money never touches us</h2>
          <p>
            <strong>We have no merchant account.</strong> When a customer pays at one of our vendor shops, the card details go directly to the gateway's hosted checkout (Stripe Checkout, Midtrans Snap, Xendit Invoice, etc.) — never to a form on streetlocal.live. The gateway settles funds to the vendor's own bank account on the gateway's standard payout schedule. We literally don't have the legal capacity to hold someone else's payment.
          </p>
          <p>
            This is why we charge a subscription instead of a commission: it would be impossible for us to take a percentage of a sale we never see.
          </p>

          <h2 className="sl-h2">No card data on our servers</h2>
          <p>
            Because we route checkout to the gateway-hosted page, we are not exposed to PCI-DSS scope. We could not leak a card number in a breach because we have never had one in our database.
          </p>

          <h2 className="sl-h2">Row-Level Security on every vendor table</h2>
          <p>
            Our database (Supabase / PostgreSQL) uses RLS policies on every table that holds vendor or customer data. Every write requires a JWT carrying the vendor's <code>vendor_id</code> in <code>app_metadata</code> (a server-only-settable claim, not <code>user_metadata</code> which is user-modifiable). Even if a malicious user obtained the public anon key, they could not:
          </p>
          <ul>
            <li>Read another vendor's payment gateway API keys (these are anon-invisible)</li>
            <li>Read another vendor's customer phone list</li>
            <li>Update another vendor's menu, prices, promo codes, or staff PINs</li>
            <li>Refund another vendor's orders (refund endpoints check ownership server-side)</li>
          </ul>

          <h2 className="sl-h2">Webhook hardening</h2>
          <p>Every gateway webhook handler:</p>
          <ul>
            <li><strong>Verifies the signature</strong> with constant-time HMAC comparison — no timing side-channel</li>
            <li><strong>Is idempotent</strong> — duplicate webhook deliveries (Stripe and Midtrans retry up to 24h) don't double-process. We use a status-guard pattern in the SQL UPDATE so concurrent webhook arrivals can't race-corrupt order state</li>
            <li><strong>Has no permissive CORS</strong> — webhooks are server-to-server and intentionally do not allow browsers to POST</li>
            <li><strong>Handles refunds + chargebacks</strong> as terminal states that can't be un-done by a stale "paid" webhook</li>
          </ul>

          <h2 className="sl-h2">Server-side amount validation</h2>
          <p>
            Every payment-creation Edge Function re-computes the order total from the items + tax + delivery + promo discount before charging the gateway. A malicious customer who edits the cart total in DevTools to 1¢ is rejected with a "tampering detected" error — and we log it.
          </p>

          <h2 className="sl-h2">Geofence on pricing</h2>
          <p>
            Plan pricing is determined server-side from the visitor's IP, cross-checked against their browser timezone, and rejected if a VPN/proxy/Tor exit is detected. A US visitor on a VPN cannot fake their way to Indonesian pricing.
          </p>

          <h2 className="sl-h2">Credential validation before save</h2>
          <p>
            When a vendor enters their payment gateway keys (Stripe, Midtrans, etc.), we make a live test call to that gateway before persisting. Invalid keys, sandbox keys submitted in live mode, or expired credentials are rejected at save time with the gateway's actual error message — so vendors never discover mid-checkout that their keys are wrong.
          </p>

          <h2 className="sl-h2">Vendor session management</h2>
          <p>
            Vendor logins go through a custom Edge Function (<code>vendor-login</code>) that maps to a Supabase Auth user with <code>app_metadata.vendor_id</code> baked in. Sessions are issued with a 24-hour TTL and auto-refresh. Sign-out clears the local session token AND tells Supabase Auth to invalidate the refresh token.
          </p>

          <h2 className="sl-h2">Audit trail</h2>
          <p>
            Every payment-related Edge Function logs an 8-character error ID on any rejection (amount mismatch, signature failure, refund auth fail). Support staff can grep server logs by that ID without exposing the underlying detail to the caller — so we can debug an incident without leaking what triggered it.
          </p>

          <h2 className="sl-h2">What we don't do</h2>
          <ul>
            <li>We don't run third-party tracking scripts (no Google Analytics, no Facebook Pixel, no Hotjar)</li>
            <li>We don't sell vendor or customer data</li>
            <li>We don't pool vendor funds in any kind of platform account</li>
            <li>We don't have a "buy now, pay later" feature that defers vendor payouts</li>
          </ul>

          <h2 className="sl-h2">Reporting a vulnerability</h2>
          <p>
            Found something? Email <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a> with subject line <strong>"SECURITY"</strong>. We answer within one business day and won't sue researchers who follow basic responsible-disclosure practice (give us 90 days, don't access data that isn't yours, don't degrade service for real customers).
          </p>
        </div>
      </section>
    </SLLayout>
  )
}
