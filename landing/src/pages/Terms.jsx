import React from 'react'
import SLLayout from '../SLLayout.jsx'

export default function Terms () {
  const lastUpdated = '2026-05-15'
  return (
    <SLLayout
      kicker="Legal"
      title="Terms of service."
      lede={`Last updated ${lastUpdated}. By using StreetLocal you agree to these terms. They cover what we provide, what you pay, and what neither party can do.`}
    >
      <section className="sl-container" style={{ paddingBottom: 80 }}>
        <div className="sl-prose">
          <h2 className="sl-h2">1 · What StreetLocal provides</h2>
          <p>
            StreetLocal (operated from Yogyakarta, Indonesia, contactable at <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a>) provides a
            software-as-a-service platform for local businesses to create, run, and accept orders through a branded mobile web app (PWA). The service includes
            menu management, customer chat, payment gateway integrations, marketing tools, sales analytics, and the supporting infrastructure (hosting, database,
            edge functions).
          </p>
          <p>
            <strong>StreetLocal is software, not a marketplace.</strong> We do not list shops in a directory, we do not match customers to shops, we do not promote
            one vendor over another, and we do not take any commission on orders. Each vendor is responsible for marketing their own shop link to their own customers.
          </p>

          <h2 className="sl-h2">2 · Your account</h2>
          <ul>
            <li>You must be at least 18 years old, or operating with verifiable consent of a parent or legal guardian.</li>
            <li>You're responsible for keeping your phone number and password confidential. Anyone with your credentials can access your shop.</li>
            <li>You're responsible for the legality of what you sell. We don't moderate menus, but we will remove shops that violate local law, sell prohibited goods, or facilitate fraud.</li>
            <li>One vendor account per business. Sub-accounts (staff) are included in your tier's staff cap.</li>
          </ul>

          <h2 className="sl-h2">3 · Pricing & billing</h2>
          <ul>
            <li>Three tiers: Starter, Professional, Enterprise. Localised to your country.</li>
            <li>Billed monthly in advance. The exact amount depends on your country and tier — see <a href="/#pricing">streetlocal.live/#pricing</a>.</li>
            <li>Payment is processed via Midtrans (Indonesia + SE Asia + India + MENA) or Stripe (US / UK / EU / AU / CA / NZ / SG). StreetLocal does not store your card details — they are held by the gateway.</li>
            <li>If a payment fails, your shop stays active for a 7-day grace period during which we'll email you. After 7 days the shop is suspended (the URL returns a "shop offline" message). After 30 days suspended without renewal, your data is deleted.</li>
            <li>You can cancel any time. The shop stays live until the end of the paid period. We don't auto-refund partial months.</li>
          </ul>

          <h2 className="sl-h2">4 · Money flow & funds custody</h2>
          <p>
            <strong>StreetLocal never holds your customer's money.</strong> Every order is charged via your own connected payment gateway (Stripe / Midtrans / Xendit / PayPal / etc.), and the gateway settles directly to your bank account on the gateway's standard payout schedule. StreetLocal has no merchant account capable of holding customer payments. This is by design — you keep 100% of the revenue, we charge only the monthly subscription.
          </p>
          <p>
            If you fail to pay your StreetLocal subscription, the platform suspends your shop's URL but does NOT touch any funds you've already collected through your gateway — those remain yours.
          </p>

          <h2 className="sl-h2">5 · What you cannot do</h2>
          <ul>
            <li>Resell StreetLocal as a white-label platform without a written Enterprise agreement.</li>
            <li>Reverse-engineer the platform to evade tier feature gates, signature checks, or amount validation.</li>
            <li>Use the platform to facilitate fraud — including phantom orders, fake promo redemptions, or payment chargeback abuse. We cooperate with law enforcement.</li>
            <li>Spam or harass other vendors or customers via the in-app chat.</li>
            <li>Bypass the country/currency geofence to obtain pricing not intended for your market.</li>
          </ul>

          <h2 className="sl-h2">6 · Data & privacy</h2>
          <p>
            See our <a href="/privacy">Privacy Policy</a> for full detail. Summary: you own your customer list and order history, we don't sell your data to anyone, and Row-Level Security on every vendor table makes it technically impossible for another shop to read your data.
          </p>

          <h2 className="sl-h2">7 · Liability & service availability</h2>
          <p>
            We aim for 99.9% uptime but make no contractual SLA except for Enterprise customers. If the platform is down, your shop is down — we're not liable for lost revenue. We are liable for not losing your data: nightly backups, regional replication on Supabase's infrastructure, and a 30-day export window on cancellation.
          </p>
          <p>
            We are not responsible for: chargebacks against your gateway, gateway downtime (Stripe/Midtrans/etc.), customer disputes, tax compliance in your country (you're responsible for collecting and remitting VAT/GST), or the legality of what you sell.
          </p>

          <h2 className="sl-h2">8 · Termination</h2>
          <p>
            You can cancel any time. We can terminate accounts that violate these terms — we'll give 7 days written notice for non-emergency terminations. We can terminate immediately for fraud, illegal activity, or repeated abuse complaints.
          </p>

          <h2 className="sl-h2">9 · Changes to these terms</h2>
          <p>
            We will email all active vendors at least 14 days before any material change to these terms. If you don't like the change, cancel before it takes effect. Continued use after the effective date is acceptance.
          </p>

          <h2 className="sl-h2">10 · Governing law</h2>
          <p>
            These terms are governed by the laws of Indonesia. Disputes that cannot be resolved through good-faith email exchange will be settled in the courts of Yogyakarta.
          </p>

          <p style={{ marginTop: 30, fontSize: 13, color: 'var(--sl-gray-500)' }}>
            Questions? <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a>. We answer within one business day.
          </p>
        </div>
      </section>
    </SLLayout>
  )
}
