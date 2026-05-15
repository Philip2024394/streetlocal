import React from 'react'
import SLLayout from '../SLLayout.jsx'

export default function Privacy () {
  const lastUpdated = '2026-05-15'
  return (
    <SLLayout
      kicker="Legal"
      title="Privacy policy."
      lede={`Last updated ${lastUpdated}. The short version: we collect what we need to run your shop, we don't sell anything, and we use technical controls (RLS, JWT, encrypted secrets) to make sure no shop can read another shop's data.`}
    >
      <section className="sl-container" style={{ paddingBottom: 80 }}>
        <div className="sl-prose">
          <h2 className="sl-h2">Who we are</h2>
          <p>
            <strong>StreetLocal</strong>, operated from Yogyakarta, Indonesia. Contact: <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a>. We are the data controller for vendor accounts and the data processor for customer order data (the vendor is the controller for their own customer list).
          </p>

          <h2 className="sl-h2">What we collect</h2>
          <p><strong>For vendors:</strong></p>
          <ul>
            <li>Phone number and a password hash (the actual password is never stored)</li>
            <li>Shop name, address, hours, social-media handles you choose to publish</li>
            <li>API keys for the payment gateways you connect (stored encrypted at rest; only accessible to your own JWT-authenticated session and to Supabase service_role on Edge Functions that act on your behalf)</li>
            <li>Country code (auto-detected at signup via IP + browser timezone for pricing localisation)</li>
            <li>Sales records, order history, and operational telemetry (vendor_health_logs)</li>
          </ul>
          <p><strong>For customers (of vendor shops):</strong></p>
          <ul>
            <li>Phone number — used as the customer's identity in chat and order history</li>
            <li>Name (optional, what they typed at checkout)</li>
            <li>Delivery address if they enter one</li>
            <li>Order items + amount + payment status</li>
          </ul>
          <p><strong>We never collect:</strong></p>
          <ul>
            <li>Credit card numbers, CVV, or any payment card data — these are entered directly on the gateway's hosted checkout (Stripe / Midtrans / etc.) and never touch StreetLocal infrastructure</li>
            <li>Government ID numbers</li>
            <li>Browsing or ad-network identifiers (we don't run any retargeting pixels, Facebook Pixel, or Google AdSense on vendor shop pages)</li>
            <li>Biometrics or location beyond the customer's checkout-time delivery address</li>
          </ul>

          <h2 className="sl-h2">How we use it</h2>
          <ul>
            <li><strong>To run your shop.</strong> Menu items, themes, orders, chat threads, loyalty stamps, marketing banners — all stored only to be served back to you and your customers.</li>
            <li><strong>To process payments.</strong> We pass non-card-data fields (vendor id, order id, amount, items) to your connected gateway. Card details bypass us entirely.</li>
            <li><strong>To prevent fraud.</strong> We log signature verification failures, amount-tampering attempts, and IP/VPN-flagged signups so we can investigate abuse.</li>
            <li><strong>To improve the product.</strong> Aggregated telemetry (which features are used, error rates, performance) — never tied to identifiable customers.</li>
          </ul>
          <p><strong>We do not:</strong></p>
          <ul>
            <li>Sell your data to anyone</li>
            <li>Share your customer list with other vendors</li>
            <li>Use your customer data to train AI models or for any purpose other than running your shop</li>
            <li>Run advertising on vendor shop pages</li>
          </ul>

          <h2 className="sl-h2">Who can see what</h2>
          <p>
            Every vendor table in our database has <strong>Row-Level Security</strong> policies that require a verified vendor JWT (carrying your <code>vendor_id</code> in <code>app_metadata</code>) for any write or sensitive read. This means:
          </p>
          <ul>
            <li>Another vendor signed into their own shop cannot read your menu, customer list, promo codes, marketing banners, staff PINs, or payment gateway API keys.</li>
            <li>An anonymous visitor with the public API key cannot write to your shop or read your sensitive tables.</li>
            <li>Even StreetLocal staff cannot read your payment API keys through the normal application — service_role access is used only by Edge Functions for processing your orders, and access is audit-logged.</li>
          </ul>

          <h2 className="sl-h2">Cookies & local storage</h2>
          <p>
            We use <strong>localStorage</strong> on vendor and customer devices to remember session state (vendor login token, customer's loyalty stamp count, last-used theme, country detection cache). We do not use third-party tracking cookies. We do not have a "cookie banner" because we don't set tracking cookies — no ad networks, no analytics SDKs that fingerprint visitors.
          </p>

          <h2 className="sl-h2">Your rights</h2>
          <p>Depending on your country, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of all data we hold on you</li>
            <li><strong>Correct</strong> — fix anything wrong</li>
            <li><strong>Delete</strong> — close your account (vendors) or have your customer-side data removed</li>
            <li><strong>Export</strong> — get your data in a portable JSON format (Pro+ vendors have this built into Settings → Backup &amp; Restore)</li>
          </ul>
          <p>
            To exercise any of these, email <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a>. We respond within 30 days (usually one business day).
          </p>

          <h2 className="sl-h2">Children</h2>
          <p>
            StreetLocal is for businesses. We don't knowingly collect data from children under 13. If you believe a child has signed up as a vendor, email us and we'll close the account immediately.
          </p>

          <h2 className="sl-h2">Where data is stored</h2>
          <p>
            On <strong>Supabase</strong> (managed PostgreSQL + edge runtime), with database hosted in their default region. CDN assets (images, themes) are served from ImageKit. Email goes through Resend. All providers are SOC 2 / ISO 27001 compliant.
          </p>

          <h2 className="sl-h2">Changes to this policy</h2>
          <p>
            We email all active vendors at least 14 days before any material change. The "last updated" date at the top reflects the most recent revision.
          </p>

          <p style={{ marginTop: 30, fontSize: 13, color: 'var(--sl-gray-500)' }}>
            Questions or want to exercise your rights? <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a>.
          </p>
        </div>
      </section>
    </SLLayout>
  )
}
