/**
 * LegalGuidePage — Foreign ownership legal guide for international investors.
 */

const STRUCTURES = [
  {
    title: 'Leasehold (Hak Sewa)',
    duration: '25-30 years + extensions',
    cost: 'Contract only',
    permit: 'No permit needed',
    use: 'Residential or Commercial',
    properties: 'Single or Multiple',
    best: 'Lifestyle buyers, budget under $200K',
    color: '#8DC63F',
  },
  {
    title: 'Hak Pakai (Right to Use)',
    duration: 'Up to 80 years',
    cost: 'Requires KITAS/KITAP',
    permit: 'Residency permit required',
    use: 'Personal residential only',
    properties: 'One property only',
    best: 'Retirees, single home owners',
    color: '#60A5FA',
  },
  {
    title: 'PT PMA (Foreign Company)',
    duration: 'Up to 80 years (HGB)',
    cost: '$150K capital + $3-8K setup',
    permit: 'No personal permit needed',
    use: 'Residential & Commercial',
    properties: 'Multiple properties',
    best: 'Investors, rental business, developers',
    color: '#FACC15',
  },
]

const MIN_PRICES = [
  { region: 'Jakarta', houses: '$620K', apartments: '$310K' },
  { region: 'Bali', houses: '$130K-$325K', apartments: '$130K' },
  { region: 'Other Provinces', houses: '$65K-$325K', apartments: '$65K-$195K' },
]

export default function LegalGuidePage({ onBack, onNavigate }) {
  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="ws-container">
        {/* Header */}
        <button onClick={onBack} style={{ marginBottom: 24, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>

        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Legal Guide for <span style={{ color: '#8DC63F' }}>Foreign Investors</span></h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', margin: '0 0 48px', maxWidth: 600 }}>Everything you need to know about buying property in Indonesia as a foreigner.</p>

        {/* Ownership Structures */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Ownership Structures</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 56 }}>
          {STRUCTURES.map(s => (
            <div key={s.title} style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, marginBottom: 16 }}>{s.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Duration', s.duration],
                  ['Setup Cost', s.cost],
                  ['Permit', s.permit],
                  ['Use', s.use],
                  ['Properties', s.properties],
                  ['Best For', s.best],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Minimum Prices */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Minimum Price Requirements for Foreigners</h2>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 56 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(141,198,63,0.08)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Region</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Houses / Landed</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Apartments</th>
              </tr>
            </thead>
            <tbody>
              {MIN_PRICES.map(r => (
                <tr key={r.region} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#fff' }}>{r.region}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{r.houses}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{r.apartments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cannot Buy */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>What Foreigners Cannot Buy</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 56 }}>
          {[
            { title: 'Hak Milik (Freehold)', desc: 'Strictly reserved for Indonesian citizens only. No exceptions — not even through a PT PMA.', icon: '🚫' },
            { title: 'Agricultural Land', desc: 'Farming and plantation land is exclusively for Indonesian nationals.', icon: '🌾' },
            { title: 'Below Minimum Price', desc: 'Properties priced below regional thresholds are legally off-limits to foreigners.', icon: '💰' },
          ].map(item => (
            <div key={item.title} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Red Flags */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Red Flags — What to Avoid</h2>
        <div style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 56 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#EF4444', marginBottom: 12 }}>Nominee Arrangements are ILLEGAL</div>
          <ul style={{ margin: 0, padding: '0 0 0 20px', color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 2 }}>
            <li>Putting property in an Indonesian citizen's name = "legal smuggling"</li>
            <li>Supreme Court has ruled these contracts unenforceable</li>
            <li>You have ZERO legal protection if the nominee disappears</li>
            <li>~10,500 plots worth $10.4 billion held illegally via nominees</li>
            <li>Active government crackdown in 2025-2026</li>
          </ul>
        </div>

        {/* PT PMA Company Formation Service */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>PT PMA Company Formation</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 650 }}>We provide end-to-end company incorporation for foreign investors — from entity registration through to operational readiness.</p>

        <div style={{ padding: '32px 28px', borderRadius: 20, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(141,198,63,0.15)', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginBottom: 20 }}>Full-Service PT PMA Setup</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '0 0 24px' }}>
            INDOO facilitates the complete establishment of your foreign investment company (PT PMA) in Indonesia. Our team manages the entire process — from initial consultation and document preparation through to company registration, director appointments, corporate bank account opening, and regulatory compliance. You receive a fully operational Indonesian legal entity, ready to acquire and manage property assets.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { title: 'Company Registration', desc: 'Full PT PMA incorporation with the Ministry of Law & Human Rights, including deed of establishment, NIB, and NPWP registration via OSS.' },
              { title: 'Appointed Directors & Commissioners', desc: 'Qualified local directors and commissioners appointed to your board, fulfilling regulatory requirements while you retain full control via legal agreements.' },
              { title: 'Corporate Bank Account', desc: 'Business bank account opened at a reputable Indonesian bank, with all documentation prepared and appointment coordinated on your behalf.' },
              { title: 'Registered Business Address', desc: 'Compliant office address provided for company domicile registration, satisfying all government filing requirements.' },
              { title: 'Legal & Notarial Coordination', desc: 'Licensed Indonesian notary engaged for all deed execution. Legal review conducted by qualified advocates for full compliance.' },
              { title: 'Ongoing Compliance', desc: 'Annual BKPM investment activity reports, tax filings, and corporate secretarial obligations managed to keep your entity in good standing.' },
            ].map(item => (
              <div key={item.title} style={{ padding: '18px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(141,198,63,0.04)', border: '1px solid rgba(141,198,63,0.1)', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>What You Receive</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                'Deed of Establishment (Akta Pendirian)',
                'Ministry of Law approval (SK Kemenkumham)',
                'Business Identification Number (NIB)',
                'Tax Registration (NPWP)',
                'Appointed Director & Commissioner',
                'Corporate bank account (operational)',
                'Registered business address',
                'BKPM investment registration',
              ].map(item => (
                <div key={item} style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#8DC63F', fontSize: 14 }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="https://wa.me/6281573635143?text=I%20am%20interested%20in%20PT%20PMA%20company%20formation%20services" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: 'none' }}>Request a Consultation →</a>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Typical setup: 4-6 weeks from engagement</span>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.1)', marginBottom: 56 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            <strong style={{ color: '#60A5FA' }}>Note:</strong> All notarial acts are executed by licensed Indonesian notaries. Legal opinions and advisory provided by qualified Indonesian advocates. INDOO acts as your project facilitator and single point of contact throughout the process — coordinating all professional services on your behalf.
          </div>
        </div>

        {/* Build vs Buy Analysis */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Build vs Buy Analysis</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 650 }}>Should you purchase an existing property or build from scratch? Here's the data.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
          {/* Buy Existing Property */}
          <div style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#60A5FA', marginBottom: 16 }}>Buy Existing Property</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Timeline', '4-8 weeks (legal transfer)'],
                ['Risk', 'Low — you see what you get'],
                ['Rental Income', 'Immediate'],
                ['Cost', 'Market price ($100K-$700K typical)'],
                ['Best For', 'Investors wanting immediate yield'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Build New */}
          <div style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(250,204,21,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', marginBottom: 16 }}>Build New</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Timeline', '8-18 months (land + construction)'],
                ['Risk', 'Medium-High — permits, delays, contractor quality'],
                ['Rental Income', 'Delayed until completion'],
                ['Land Cost', '$30-$150/m\u00B2 (varies by area)'],
                ['Construction Cost', '$500-$1,200/m\u00B2 (depending on finish quality)'],
                ['Total Villa Build (200m\u00B2)', '$100K-$240K + land'],
                ['Best For', 'Investors wanting custom spec at lower total cost'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Construction Cost Guide */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Construction Cost Guide</div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(141,198,63,0.08)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Finish Level</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Cost per m²</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Example (200m² villa)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Basic', '$500-$700/m\u00B2', '$100K-$140K'],
                  ['Mid-range', '$700-$900/m\u00B2', '$140K-$180K'],
                  ['Luxury', '$900-$1,200/m\u00B2', '$180K-$240K'],
                ].map(([level, cost, example]) => (
                  <tr key={level} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#fff' }}>{level}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{cost}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.1)', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            <strong style={{ color: '#60A5FA' }}>Note:</strong> Land costs are separate. Bali land: $100-$500/m² depending on location. Jakarta land: $500-$3,000/m². All builds require IMB (building permit) — 4-8 week processing.
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 56 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            <strong style={{ color: '#EF4444' }}>Warning:</strong> Building carries risks: contractor disputes, permit delays, cost overruns of 10-20% are common. We recommend using INDOO-verified contractors only.
          </div>
        </div>

        {/* Foreign Financing Guide */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Financing Options for Foreign Investors</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 650 }}>Can foreigners get property loans in Indonesia? Here's the reality.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
          {/* Indonesian Mortgages */}
          <div style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#EF4444', marginBottom: 16 }}>Can Foreigners Get Indonesian Mortgages?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Short Answer', 'Extremely rare'],
                ['Reality', 'Most Indonesian banks do NOT lend to foreigners for property'],
                ['Exceptions', 'Bank Central Asia (BCA) and Bank Mandiri offer limited programs for KITAS holders'],
                ['Requirements', 'KITAS/KITAP, 2+ years Indonesian tax history, local income proof'],
                ['LTV Ratio', 'Typically 50-60% (vs 80%+ for Indonesians)'],
                ['Interest Rate', '8-12% per annum (significantly higher than Western rates)'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Realistic Alternatives */}
          <div style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(141,198,63,0.15)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginBottom: 16 }}>Realistic Financing Alternatives</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { num: '1', title: 'Developer Payment Plans', desc: 'Many projects offer 12-36 month installments (0% or low interest)' },
                { num: '2', title: 'Home Country Equity Release', desc: 'Remortgage in your country at 3-5%, invest in Indonesia at 10-15% yield' },
                { num: '3', title: 'Private Lending', desc: 'Available but higher rates (12-18%)' },
                { num: '4', title: 'Cash Purchase', desc: 'Most foreign investors pay cash (85%+ of transactions)' },
              ].map(item => (
                <div key={item.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{item.num}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INDOO Recommendation */}
        <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(141,198,63,0.04)', border: '1px solid rgba(141,198,63,0.12)', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', marginBottom: 8 }}>INDOO Recommendation</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontStyle: 'italic' }}>
            "For most foreign investors, cash purchase or developer installment plans provide the most straightforward path. If you require financing above $500K, we can connect you with international lenders who fund Indonesian property transactions."
          </div>
        </div>

        <div style={{ marginBottom: 56 }}>
          <a href="https://wa.me/6281573635143?text=I%20would%20like%20to%20discuss%20financing%20options%20for%20Indonesian%20property" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: 'none' }}>Discuss Financing Options →</a>
        </div>

        {/* Relocation & Turnkey Investment Package */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Turnkey Investment & Relocation Package</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 650 }}>One point of contact. Everything handled. From property selection to keys in hand — we manage every step of your Indonesia investment journey.</p>

        <div style={{ padding: '32px 28px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(250,204,21,0.03), rgba(0,0,0,0.5))', border: '1px solid rgba(250,204,21,0.15)', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', marginBottom: 8 }}>Complete Investor Concierge</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '0 0 28px' }}>
            Whether you are acquiring a single villa, establishing a rental portfolio, or relocating to Indonesia entirely — INDOO coordinates the full process under one engagement. We combine property acquisition, corporate structuring, immigration, banking, and property management into a seamless experience, eliminating the need to engage multiple disconnected service providers.
          </p>

          {/* Package Tiers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              {
                title: 'Investment Package',
                subtitle: 'Property + Legal Structure',
                color: '#8DC63F',
                items: [
                  'Property sourcing & due diligence',
                  'Legal structure recommendation',
                  'PT PMA formation (if required)',
                  'Title verification & transfer',
                  'Notarial deed execution',
                  'Corporate bank account',
                ],
              },
              {
                title: 'Relocation Package',
                subtitle: 'Investment + Live in Indonesia',
                color: '#FACC15',
                items: [
                  'Everything in Investment Package',
                  'KITAS/KITAP visa processing',
                  'Personal bank account setup',
                  'Tax registration (personal NPWP)',
                  'Utility connections & setup',
                  'Local orientation & support',
                ],
              },
              {
                title: 'Portfolio Package',
                subtitle: 'Multiple Properties + Management',
                color: '#A78BFA',
                items: [
                  'Everything in Relocation Package',
                  'Multi-property acquisition strategy',
                  'Property management coordination',
                  'Rental listing & tenant sourcing',
                  'Ongoing compliance & reporting',
                  'Annual portfolio performance review',
                ],
              },
            ].map(pkg => (
              <div key={pkg.title} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.75)', border: `1px solid ${pkg.color}22` }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: pkg.color, marginBottom: 4 }}>{pkg.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{pkg.subtitle}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pkg.items.map(item => (
                    <div key={item} style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: pkg.color, fontSize: 14, marginTop: 2 }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Services */}
          <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Services Available</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                'Golden Visa application ($350K+ property)',
                'Interior design & furnishing coordination',
                'Airbnb/booking platform setup',
                'Property insurance arrangement',
                'Staff recruitment (housekeeper, driver)',
                'Ongoing property maintenance oversight',
              ].map(item => (
                <div key={item} style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ color: '#60A5FA', fontSize: 14 }}>+</span> {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="https://wa.me/6281573635143?text=I%20am%20interested%20in%20your%20turnkey%20investment%20package" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #FACC15, #EAB308)', color: '#000', fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: 'none' }}>Enquire About Packages →</a>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Tailored to your investment goals</span>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(250,204,21,0.03)', border: '1px solid rgba(250,204,21,0.08)', marginBottom: 56 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            <strong style={{ color: '#FACC15' }}>How it works:</strong> Every engagement begins with a complimentary consultation to understand your objectives. We then provide a tailored proposal outlining scope, timeline, and transparent fee structure. No obligations until you approve. All services are coordinated through a single dedicated point of contact.
          </div>
        </div>

        {/* How It Works */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>How It Works with INDOO</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 56 }}>
          {[
            { step: '01', title: 'Free Consultation', desc: 'We assess your goals — investment, relocation, or portfolio building', color: '#8DC63F' },
            { step: '02', title: 'Tailored Proposal', desc: 'You receive a clear scope, timeline, and fee structure — no hidden costs', color: '#60A5FA' },
            { step: '03', title: 'We Execute', desc: 'Our team coordinates property, legal, banking, and visa — you approve decisions', color: '#FACC15' },
            { step: '04', title: 'Handover', desc: 'Keys, documents, accounts — everything delivered. Ongoing support available', color: '#A78BFA' },
          ].map(s => (
            <div key={s.step} style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Professional Network */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Our Professional Network</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 28px', maxWidth: 650 }}>INDOO works with licensed, verified professionals to ensure every transaction is handled with full legal compliance and the highest standard of service.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          {[
            {
              role: 'Licensed Notary (PPAT)',
              icon: '📜',
              color: '#8DC63F',
              services: [
                'Deed of establishment execution',
                'Property title transfer',
                'Land certificate verification',
                'HGB/Hak Pakai registration',
                'Power of attorney documents',
              ],
              note: 'All notaries in our network hold active PPAT (Land Deed Official) licenses issued by the Ministry of Agrarian Affairs.',
            },
            {
              role: 'Property & Investment Lawyer',
              icon: '⚖️',
              color: '#60A5FA',
              services: [
                'Foreign investment legal advisory',
                'PT PMA structuring & compliance',
                'Due diligence & title search',
                'Contract drafting & review',
                'Dispute resolution',
              ],
              note: 'Licensed advocates registered with PERADI (Indonesian Bar Association), specialising in property and foreign investment law.',
            },
            {
              role: 'Tax & Compliance Consultant',
              icon: '📊',
              color: '#FACC15',
              services: [
                'Foreign investor tax obligations',
                'Annual BKPM reporting',
                'NPWP registration (personal & corporate)',
                'Withholding tax advisory',
                'Cross-border tax planning',
              ],
              note: 'Certified tax consultants (Konsultan Pajak) registered with the Directorate General of Taxes.',
            },
          ].map(p => (
            <div key={p.role} style={{ padding: '28px 24px', borderRadius: 20, background: 'rgba(0,0,0,0.8)', border: `1px solid ${p.color}22` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: p.color, marginBottom: 14 }}>{p.role}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {p.services.map(s => (
                  <div key={s} style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: p.color, fontSize: 14 }}>✓</span> {s}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                {p.note}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 56 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            <strong style={{ color: '#fff' }}>How we assign professionals:</strong> Based on your transaction type, location, and requirements, we match you with the most suitable professionals from our verified network. All professionals carry active licenses, professional indemnity coverage, and are regularly reviewed for service quality. You deal with INDOO as your single point of contact — we coordinate all parties on your behalf.
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ textAlign: 'center', padding: '48px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Ready to Invest in Indonesia?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>Book a free consultation — no obligations. We'll assess your situation and recommend the best path forward.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <a href="https://wa.me/6281573635143" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 14, background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, textDecoration: 'none', boxShadow: 'none' }}>Book Free Consultation →</a>
            <a href="https://wa.me/6281573635143?text=I%20would%20like%20to%20discuss%20investment%20opportunities%20in%20Indonesia" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>Send Us a Message</a>
          </div>
        </div>
      </div>
    </div>
  )
}
