import React from 'react'
import SLLayout from '../SLLayout.jsx'

export default function About () {
  return (
    <SLLayout
      kicker="About StreetLocal"
      title="Software for businesses that prefer their own customers."
      lede="StreetLocal builds premium mobile apps for local businesses worldwide. We are a small software company in Yogyakarta, Indonesia. We don't run a marketplace, we don't take commissions, and we don't sell your data."
    >
      <section className="sl-container" style={{ paddingBottom: 80 }}>
        <div className="sl-prose">
          <h2 className="sl-h2">What we make</h2>
          <p>
            A platform of premium Progressive Web Apps (PWAs) for local businesses — bakeries, donut shops,
            restaurants, cafes, retail, salons, services. One platform, one codebase, many verticals — each
            customised for the trade it serves.
          </p>
          <p>
            A shop signs up, picks their app, customises their theme and menu, plugs in their own payment
            gateway, and shares a link. Customers tap the link, the app opens like a native installable
            shop, they order, the shop takes the payment directly. <strong>StreetLocal is never in the
            middle of the money.</strong>
          </p>

          <h2 className="sl-h2">How we operate</h2>
          <ul>
            <li><strong>Subscription, not commission.</strong> Vendors pay a flat monthly fee for their tier
              (Starter / Professional / Enterprise). We never take a cut of an order.</li>
            <li><strong>Vendor funds are vendor funds.</strong> Each shop connects their own Stripe, Midtrans,
              Xendit, PayPal, Razorpay, HitPay, Adyen, or any of our 15 supported gateways. Funds settle
              directly to the shop. We have no merchant account that could ever hold customer payments.</li>
            <li><strong>Vendor data is vendor data.</strong> We don't resell customer lists. We don't share
              order history with third parties. RLS policies in our database make it impossible for us to
              read another shop's API keys or customer database without explicit support consent.</li>
            <li><strong>Built in public, mostly.</strong> Our codebase is private but our security choices
              (Row-Level Security on every vendor table, server-side amount validation against tampering,
              JWT-based vendor sessions, idempotent webhook handling) are documented openly so vendors can
              evaluate them.</li>
          </ul>

          <h2 className="sl-h2">Where we are</h2>
          <p>
            Yogyakarta, Indonesia. The platform is built for SEA-first pricing (Rp 38k Starter in
            Indonesia, ฿599 in Thailand, ₱999 in the Philippines) but the architecture serves every
            market — vendors in the US, UK, EU, AU, NZ, Canada, Singapore and the Middle East all run on
            the same infrastructure with localised pricing.
          </p>

          <h2 className="sl-h2">Who we serve</h2>
          <p>
            Owner-operated local businesses, family-run shops, and small chains. Specifically NOT:
          </p>
          <ul>
            <li>National franchises (they have their own apps)</li>
            <li>Marketplaces (we're vendor infrastructure, not a competitor to vendors)</li>
            <li>Buy-now-pay-later schemes (we charge a monthly subscription, period)</li>
          </ul>

          <h2 className="sl-h2">What we don't do</h2>
          <ul>
            <li><strong>We don't process payments.</strong> Every charge is between the customer and the vendor's gateway. We never see card data.</li>
            <li><strong>We don't store customer card data.</strong> Card details are entered on the vendor's gateway-hosted checkout page (Stripe / Midtrans / Xendit / etc.) — never on streetlocal.live.</li>
            <li><strong>We don't sell ads.</strong> No banner ads, no Google AdSense, no retargeting pixels on vendor shop pages.</li>
            <li><strong>We don't have a public marketplace.</strong> No SEO-juiced category page where vendors compete for customers' attention. Each shop is its own URL, owned by the vendor.</li>
          </ul>

          <h2 className="sl-h2">Contact</h2>
          <p>
            Email <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a> — we answer within
            one business day. For security disclosures see <a href="/security">our security page</a>.
          </p>
        </div>
      </section>
    </SLLayout>
  )
}
