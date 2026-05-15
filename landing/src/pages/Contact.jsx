import React from 'react'
import SLLayout from '../SLLayout.jsx'

export default function Contact () {
  return (
    <SLLayout
      kicker="Get in touch"
      title="Contact StreetLocal."
      lede="Small team, one inbox, one promise: every email gets a real reply within one business day."
    >
      <section className="sl-container" style={{ paddingBottom: 80 }}>
        <div className="sl-prose">
          <p>
            For now we keep things simple — one email address, no support ticket form, no chatbot. Mail us
            at <a href="mailto:streetlocallive@gmail.com"><strong>streetlocallive@gmail.com</strong></a> and use a
            subject line that helps us route fast:
          </p>
          <ul>
            <li><strong>"SUPPORT"</strong> — you're a vendor and something's broken, or you need help with setup, billing, or a feature</li>
            <li><strong>"SECURITY"</strong> — you found a vulnerability or have a security concern. Responsible disclosure terms on the <a href="/security">security page</a></li>
            <li><strong>"PRESS"</strong> — you're a journalist or analyst writing about us</li>
            <li><strong>"PARTNERSHIPS"</strong> — gateway integrations, vertical-app collaborations, white-label discussions</li>
            <li><strong>"REFUND"</strong> — you need a refund on your subscription (we prorate fairly)</li>
            <li><strong>Anything else</strong> — just write what you need, no subject line needed</li>
          </ul>

          <h2 className="sl-h2">What we respond to</h2>
          <ul>
            <li><strong>Vendor support</strong> — within one business day, often within hours during business hours (Jakarta / Yogyakarta time)</li>
            <li><strong>Enterprise customers</strong> — same business day with priority routing</li>
            <li><strong>Security disclosures</strong> — acknowledged within 24 hours, 90 days to remediate</li>
            <li><strong>Press / analyst</strong> — within two business days</li>
          </ul>

          <h2 className="sl-h2">What we don't do</h2>
          <ul>
            <li>Take phone support calls (we're a small team — email keeps us efficient and gives you a written record)</li>
            <li>Run a 24/7 chat — our team needs to sleep</li>
            <li>Outsource support to a call centre — every email is answered by someone who can actually fix your problem</li>
          </ul>

          <h2 className="sl-h2">Looking for something specific?</h2>
          <ul>
            <li><a href="/faq">FAQ</a> — covers ~90% of common questions</li>
            <li><a href="/security">Security page</a> — for safety + responsible-disclosure terms</li>
            <li><a href="/terms">Terms</a> — for the full legal small print</li>
            <li><a href="/privacy">Privacy policy</a> — for what data we collect and how we use it</li>
            <li><a href="/food/chat/login">Vendor sign-in</a> — your dashboard URL</li>
          </ul>
        </div>
      </section>
    </SLLayout>
  )
}
