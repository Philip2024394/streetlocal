/**
 * PropertyManagementPage — Property management services for foreign owners.
 */

export default function PropertyManagementPage({ onBack, onNavigate }) {
  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="ws-container">
        {/* Header */}
        <button onClick={onBack} style={{ marginBottom: 24, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>

        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Property <span style={{ color: '#8DC63F' }}>Management</span></h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '0 0 48px', maxWidth: 620 }}>You invest. We manage. Receive monthly rental income without the hassle — wherever you are in the world.</p>

        {/* Who It's For */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Who This Is For</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 56 }}>
          {[
            { icon: '🌏', title: 'Overseas Investors', desc: 'You purchased property in Indonesia but live in Singapore, Australia, US, or Europe. You need a trusted local presence.' },
            { icon: '🏖️', title: 'Holiday Home Owners', desc: 'You visit your villa a few weeks per year. The rest of the time, it should be earning rental income for you.' },
            { icon: '📈', title: 'Portfolio Investors', desc: 'You own multiple properties across Indonesia. You need consolidated management and reporting in one place.' },
          ].map(item => (
            <div key={item.title} style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* What's Included */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>What's Included</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 56 }}>
          {[
            { title: 'Guest Management', desc: 'Full guest communication in English, check-in/check-out coordination, welcome packs, and 24/7 guest support for short-term rentals.', color: '#8DC63F' },
            { title: 'Airbnb & Booking Optimization', desc: 'Professional listing creation, photography coordination, dynamic pricing, review management, and calendar optimization to maximise occupancy.', color: '#60A5FA' },
            { title: 'Cleaning & Housekeeping', desc: 'Vetted cleaning teams, linen management, deep cleans between guests, regular inspections to maintain property standards.', color: '#FACC15' },
            { title: 'Maintenance & Repairs', desc: 'Preventative maintenance schedules, emergency repairs, pool and garden upkeep, contractor management, and quality checks.', color: '#A78BFA' },
            { title: 'Rental Income Collection', desc: 'Secure rent collection from tenants or booking platforms. Funds transferred to your account monthly with full transparency.', color: '#F472B6' },
            { title: 'Monthly Owner Reports', desc: 'Detailed financial reporting: income, expenses, occupancy rates, maintenance log, and upcoming recommendations. Delivered in English.', color: '#FB923C' },
            { title: 'Tenant Sourcing (Long-Term)', desc: 'Marketing, screening, reference checks, and lease management for long-term rental properties. Background verification included.', color: '#34D399' },
            { title: 'Compliance & Licensing', desc: 'Ensuring your rental meets local regulations, tourism permits (Pondok Wisata), and tax reporting obligations are maintained.', color: '#E879F9' },
          ].map(item => (
            <div key={item.title} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.8)', border: `1px solid ${item.color}22` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: item.color, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Coverage */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Coverage Across Indonesia</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 56 }}>
          {[
            { area: 'Bali', locations: 'Canggu, Seminyak, Uluwatu, Ubud, Nusa Dua', active: true },
            { area: 'Lombok', locations: 'Kuta, Senggigi, Gili Islands', active: true },
            { area: 'Yogyakarta', locations: 'City center, Kaliurang, Sleman', active: true },
            { area: 'Jakarta', locations: 'South Jakarta, CBD, Menteng', active: true },
          ].map(r => (
            <div key={r.area} style={{ padding: '20px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(141,198,63,0.12)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginBottom: 6 }}>{r.area}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{r.locations}</div>
            </div>
          ))}
        </div>

        {/* Fee Structure */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Transparent Fee Structure</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
          <div style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(141,198,63,0.15)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginBottom: 14 }}>Short-Term Rentals (Airbnb / Holiday)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Management Fee', '15-20% of rental income'],
                ['What\'s Covered', 'Guest management, cleaning, maintenance, listing optimization, reporting'],
                ['Billing', 'Deducted from rental income monthly — you receive net amount'],
                ['Minimum', 'No minimum contract — cancel anytime with 30 days notice'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(250,204,21,0.15)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', marginBottom: 14 }}>Long-Term Rentals (Monthly/Yearly)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Management Fee', '10-15% of rental income'],
                ['What\'s Covered', 'Tenant sourcing, rent collection, maintenance, inspections, reporting'],
                ['Billing', 'Invoiced monthly — transparent breakdown provided'],
                ['Minimum', 'Aligned with tenant lease period — typically 6-12 months'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 56 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            <strong style={{ color: '#fff' }}>No hidden fees.</strong> All maintenance and operational costs are transparently itemised in your monthly report. We never mark up third-party costs. You approve all expenditure above a pre-agreed threshold before work proceeds.
          </div>
        </div>

        {/* Why Us */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Why Choose INDOO Management</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 56 }}>
          {[
            { title: 'English-Speaking Team', desc: 'All communication with you in fluent English. Reports, invoices, and updates — no language barrier.', icon: '💬' },
            { title: 'Single Point of Contact', desc: 'One dedicated manager for your property. No call centres, no ticket systems — direct WhatsApp access.', icon: '📱' },
            { title: 'Full Transparency', desc: 'Real-time access to bookings, income, and expenses. Nothing hidden. Monthly detailed reporting.', icon: '📊' },
            { title: 'Already Your Investment Partner', desc: 'If we helped you buy the property, we already know it inside out. Seamless transition from purchase to management.', icon: '🤝' },
            { title: 'Local Presence, International Standards', desc: 'On-the-ground team across Indonesia applying international hospitality and property management standards.', icon: '🌐' },
            { title: 'Cancel Anytime', desc: 'No lock-in contracts for short-term management. We keep your business by delivering results, not by trapping you.', icon: '✓' },
          ].map(item => (
            <div key={item.title} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* How to Start */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Getting Started</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 56 }}>
          {[
            { step: '01', title: 'Contact Us', desc: 'Tell us about your property — location, type, current rental status', color: '#8DC63F' },
            { step: '02', title: 'Property Assessment', desc: 'We inspect the property and provide a rental income projection', color: '#60A5FA' },
            { step: '03', title: 'Agreement', desc: 'Simple management agreement — clear fees, clear responsibilities', color: '#FACC15' },
            { step: '04', title: 'We Take Over', desc: 'Listing setup, photography, first guests or tenants sourced', color: '#A78BFA' },
          ].map(s => (
            <div key={s.step} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '48px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Own Property in Indonesia?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>Let us manage it for you. Free property assessment and rental income projection — no obligations.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <a href="https://wa.me/6281573635143?text=I%20own%20property%20in%20Indonesia%20and%20would%20like%20to%20discuss%20management%20services" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 14, background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, textDecoration: 'none' }}>Discuss Management →</a>
            <a href="https://wa.me/6281573635143?text=I%20would%20like%20a%20free%20property%20assessment" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>Free Assessment →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
