import React from 'react'
import SLLayout from '../SLLayout.jsx'

const STYLE = `
  .faq-group { margin-bottom: 36px; }
  .faq-group__title { font-size: 13px; font-weight: 800; color: var(--sl-yellow-deep); text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 14px; }
  .faq-item { background: #fff; border: 1px solid var(--sl-gray-200); border-radius: 14px; margin-bottom: 10px; padding: 0; overflow: hidden; }
  .faq-item summary { padding: 16px 20px; cursor: pointer; font-size: 15px; font-weight: 700; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--sl-black); }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::after { content: '+'; color: var(--sl-yellow-deep); font-size: 22px; font-weight: 800; transition: transform 0.2s ease; flex-shrink: 0; }
  .faq-item[open] summary::after { transform: rotate(45deg); }
  .faq-item .faq-body { padding: 0 20px 18px; font-size: 14px; line-height: 1.6; color: var(--sl-gray-700); }
  .faq-item .faq-body p { margin: 0 0 10px; }
  .faq-item .faq-body p:last-child { margin-bottom: 0; }
  .faq-item .faq-body a { color: var(--sl-yellow-deep); text-decoration: underline; text-underline-offset: 3px; }
  .faq-item .faq-body strong { color: var(--sl-black); }
`

// Each group has a title + an array of [Q, A] tuples.
// Edit content here — section structure mirrors the user's questions on
// how the platform operates, security, and the new tiered pricing.
const FAQ_GROUPS = [
  {
    title: 'Pricing & plans',
    items: [
      ['What does StreetLocal cost?',
        <>
          <p>One flat monthly fee per shop, localised to your country. There are three tiers:</p>
          <ul style={{ paddingLeft: 22, margin: '6px 0 10px' }}>
            <li><strong>Starter</strong> — the basics. $19/mo in the US, Rp 38,000/mo in Indonesia, similar PPP-localised pricing elsewhere.</li>
            <li><strong>Professional</strong> — payment gateways, marketing, AI menu suggestions, custom domain, 5 staff. $49/mo US / Rp 199,000 Indonesia.</li>
            <li><strong>Enterprise</strong> — multi-location, unlimited staff, full domain management, white-label. $99/mo US / Rp 449,000 Indonesia.</li>
          </ul>
          <p>No setup fee. No commission on orders, ever. Cancel any time.</p>
        </>],
      ['Do you take a commission on my orders?',
        <p>No. Zero. Your customers pay you directly through your own payment gateway. We never see, hold, or take a cut of your money. The only thing you pay StreetLocal is the monthly subscription.</p>],
      ['Can I downgrade later?',
        <p>Downgrades are handled manually so we can prorate fairly. Email <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a> and we'll move you within one business day.</p>],
      ['Do you have a free trial?',
        <p>Not currently. Instead, the donut app is openly accessible as a fully-working demo at <a href="/donut">streetlocal.live/donut</a> — you can place a fake order, see the chat flow, browse the vendor admin. When you're ready, sign up and your shop is live in about five minutes.</p>],
    ],
  },
  {
    title: 'How the platform works',
    items: [
      ['Do my customers need to install an app?',
        <p>No. StreetLocal shops are PWAs — Progressive Web Apps. Customers tap your link, the shop opens like a native app instantly. They can optionally "Add to home screen" so it looks like a regular app icon on their phone, but they don't need to download anything from the App Store or Play Store.</p>],
      ['How long does it take to set up a shop?',
        <p>About 5 minutes. Sign up with your WhatsApp number, add a few menu items, pick a theme, share your link. Real shops have gone live in under 10 minutes from first visiting the home page.</p>],
      ['Multi-location? Multi-staff?',
        <p>Both supported. <strong>Multi-staff</strong> works on every tier (1 staff on Starter, 5 on Pro, unlimited on Enterprise) with role-based permissions: manager / cashier / kitchen. <strong>Multi-location</strong> is Enterprise-only — one account, multiple physical shops, separate staff per branch, centralised analytics.</p>],
      ['What about printing kitchen tickets?',
        <p>Pair any Bluetooth ESC/POS thermal printer in a few taps. Every incoming order can fire automatically to the printer. Pro and Enterprise tiers include this. Requires Chrome on Android or desktop — iOS Safari blocks the Web Bluetooth API so iPhone vendors print via paired Bluetooth from a different device.</p>],
      ['What about delivery?',
        <p>We support distance-based delivery fees out of the box — vendor sets a base fee, per-km rate, free-above threshold, max distance. The customer's address is calculated against the shop's coordinates at checkout. For actual courier dispatch, the vendor hires their own delivery person (motorcycle taxi, family member, Gojek/Grab) — we don't take over your logistics. A full driver app is on the roadmap for the food vertical.</p>],
    ],
  },
  {
    title: 'Payments & security',
    items: [
      ['Can I bring my own payment gateway?',
        <p><strong>Yes — that's the only way it works.</strong> Connect Stripe, Midtrans, Xendit, PayPal, Razorpay, HitPay, Adyen, Checkout.com, Mollie, Rapyd, Authorize.Net, 2Checkout, CyberSource, Worldpay, FOMO Pay, or Braintree. Funds settle to YOUR account. We never touch them.</p>],
      ['How do you protect my customer data?',
        <p>Every vendor table in our database has Row-Level Security policies that require a verified vendor JWT — no anonymous user can read your customer list, your menu prices, your payment API keys, or your order history. Your API keys are encrypted at rest in Supabase. We have no operational reason to read them and the RLS policies are auditable.</p>],
      ['How do you protect against fake orders / payment fraud?',
        <p>
          Every checkout amount is recalculated server-side from the cart items before we charge the gateway — a malicious customer who edits the total in DevTools to 1¢ is rejected with a "tampering detected" error.
          Refund endpoints require a vendor JWT and check that the order belongs to your shop before processing — competitors can't refund your customers.
          All webhook handlers verify the gateway's signature with constant-time comparison and use status-guard idempotency to prevent duplicate-delivery exploits.
        </p>],
      ['What happens if a customer abandons their payment?',
        <p>A background job runs every 10 minutes that scans for orders stuck in "redirecting" state for over 60 minutes. Those orders are marked "abandoned" and any stock that was reserved is restored automatically. No phantom orders, no leaked stock.</p>],
      ['Where is StreetLocal in the payment flow?',
        <p>We're <strong>not</strong> in the payment flow. The customer's card details go directly to the gateway's hosted checkout page (Stripe Checkout, Midtrans Snap, Xendit Invoice, etc.) — we don't have a payment form on streetlocal.live. We're never PCI-DSS-exposed because we never see card data.</p>],
    ],
  },
  {
    title: 'About us',
    items: [
      ['Who builds StreetLocal?',
        <p>A small software company in Yogyakarta, Indonesia. We build all the code ourselves — no white-labelled WordPress plugins, no Shopify reskin. See <a href="/about">/about</a> for who we are and how we operate.</p>],
      ['Where can I see the platform in action?',
        <p>Open the live demo at <a href="/donut">streetlocal.live/donut</a> — it's a real working donut shop with a seeded menu, animations, chat, loyalty card, and checkout. You can place a (test) order to see what your customers will see.</p>],
      ['Can I cancel any time?',
        <p>Yes. No long-term commitment. The day you cancel, your shop stays live until the end of the paid period. After that the URL stops resolving, but we keep your data for 30 days in case you want to reactivate.</p>],
      ['How do I get support?',
        <p>Email <a href="mailto:streetlocallive@gmail.com">streetlocallive@gmail.com</a>. We answer within one business day. Enterprise customers get priority support with same-business-day response.</p>],
    ],
  },
]

export default function Faq () {
  return (
    <SLLayout
      kicker="Frequently asked"
      title="The short version."
      lede="If you're evaluating StreetLocal as a software platform — pricing, how the app works, security, our operating model — the answers are here. Anything missing? Email streetlocallive@gmail.com."
    >
      <style>{STYLE}</style>
      <section className="sl-container" style={{ paddingBottom: 80 }}>
        {FAQ_GROUPS.map((grp) => (
          <div key={grp.title} className="faq-group">
            <div className="faq-group__title">{grp.title}</div>
            {grp.items.map(([q, a], i) => (
              <details key={i} className="faq-item" open={i === 0 && grp === FAQ_GROUPS[0]}>
                <summary>{q}</summary>
                <div className="faq-body">{a}</div>
              </details>
            ))}
          </div>
        ))}
      </section>
    </SLLayout>
  )
}
