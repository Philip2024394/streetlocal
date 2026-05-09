/**
 * InvestorPage — International Investors section for the website.
 * Foreign-eligible listings, supervised transactions, legal guides, Global Agents.
 */
import { useState, useEffect } from 'react'
import { getInvestorListings, convertFromIDR, CURRENCIES, calculateInvestmentGrade, calculateRentalYield, isForeignEligible, FOREIGN_OWNERSHIP_GUIDE, INDONESIA_TAX_INFO, DEMO_GLOBAL_AGENTS, TRANSACTION_STEPS } from '@/services/investorService'
import CurrencyConverter from '@/components/property/CurrencyConverter'
import InvestmentCalculator from '@/components/property/InvestmentCalculator'
import InvestorListingCard from '@/components/property/InvestorListingCard'
import GlobalAgentBadge from '@/components/property/GlobalAgentBadge'
import { ScrollReveal } from '../hooks/useScrollReveal'

const glass = { background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

export default function InvestorPage({ onBack, onSelectListing }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')
  const [filterCity, setFilterCity] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [selectedListing, setSelectedListing] = useState(null)
  const [tab, setTab] = useState('listings') // listings, guide, agents, process

  useEffect(() => { loadListings() }, [filterCity, filterGrade])

  async function loadListings() {
    setLoading(true)
    const filters = {}
    if (filterCity) filters.city = filterCity
    if (filterGrade) filters.grade = filterGrade
    const data = await getInvestorListings(filters)
    setListings(data)
    setLoading(false)
  }

  const currObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[1]

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">

        {/* Hero */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', fontSize: 12, fontWeight: 800, color: '#FACC15', marginBottom: 12, letterSpacing: '0.08em' }}>GLOBAL INVEST</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Your Trusted Partner for Indonesian Property Investment</h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 720, margin: '0 auto 16px', lineHeight: 1.7 }}>INDOO is foreign-owned and operated with over 15 years of on-the-ground experience in Indonesia. We provide end-to-end guidance — from property sourcing and construction oversight to legal compliance, financial structuring, and company formation. Our native English-speaking team works alongside dedicated Indonesian staff to deliver the smoothest investment experience possible.</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>We bring deep market insight across every requirement that overseas investors typically overlook — the kind of knowledge that only comes from years of working within the Indonesian property landscape.</p>
          </div>
        </ScrollReveal>

        {/* Currency selector */}
        <ScrollReveal delay={0.05}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
            {CURRENCIES.filter(c => c.code !== 'IDR').map(c => (
              <button key={c.code} onClick={() => setCurrency(c.code)} style={{ padding: '8px 14px', borderRadius: 10, border: currency === c.code ? '1.5px solid #FACC15' : '1.5px solid rgba(255,255,255,0.06)', background: currency === c.code ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.02)', color: currency === c.code ? '#FACC15' : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{c.flag} {c.code}</button>
            ))}
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.08}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 28 }}>
            {[
              { id: 'listings', label: 'Investment Properties', icon: '🏠' },
              { id: 'guide', label: 'Legal Guide', icon: '📋' },
              { id: 'agents', label: 'Global Agents', icon: '🌏' },
              { id: 'process', label: 'How It Works', icon: '🔒' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 20px', borderRadius: 12, border: tab === t.id ? '1.5px solid #FACC15' : '1.5px solid rgba(255,255,255,0.04)', background: tab === t.id ? 'rgba(250,204,21,0.06)' : 'transparent', color: tab === t.id ? '#FACC15' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </ScrollReveal>

        {/* ═══ INVESTMENT PROPERTIES TAB ═══ */}
        {tab === 'listings' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <input value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="Filter by city..." style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none', minWidth: 160 }} />
              <div style={{ display: 'flex', gap: 4 }}>
                {['', 'A', 'B', 'C'].map(g => (
                  <button key={g} onClick={() => setFilterGrade(filterGrade === g ? '' : g)} style={{ padding: '8px 14px', borderRadius: 8, border: filterGrade === g ? '1px solid #FACC15' : '1px solid rgba(255,255,255,0.06)', background: filterGrade === g ? 'rgba(250,204,21,0.06)' : 'transparent', color: filterGrade === g ? '#FACC15' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{g || 'All'} {g ? 'Grade' : 'Grades'}</button>
                ))}
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.2)' }}>Loading investment properties...</div>
            ) : listings.length === 0 ? (
              <div style={{ ...glass, textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>No properties found</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Try adjusting your filters</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {listings.map(l => {
                  const grade = l.investment_grade ? { grade: l.investment_grade } : calculateInvestmentGrade(l)
                  const eligibility = isForeignEligible(l)
                  const buyPrice = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : 0
                  const yieldData = calculateRentalYield(buyPrice, l.price_month)
                  const priceIDR = Number(String(buyPrice || l.price_month || 0).replace(/\./g, ''))
                  const priceForeign = convertFromIDR(priceIDR, currency)

                  return (
                    <ScrollReveal key={l.id}>
                      <div style={{ ...glass, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} className="ws-card" onClick={() => onSelectListing?.(l)}>
                        {/* Image */}
                        <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                          {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏠</div>}
                          {/* Grade badge */}
                          <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 12px', borderRadius: 8, background: grade.grade === 'A' ? '#8DC63F' : grade.grade === 'B' ? '#FACC15' : grade.grade === 'C' ? '#F59E0B' : '#EF4444', fontSize: 12, fontWeight: 900, color: '#000' }}>Grade {grade.grade}</div>
                          {/* Badges row */}
                          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
                            {eligibility.eligible && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#8DC63F', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(141,198,63,0.3)' }}>FOREIGN ELIGIBLE</span>}
                            {l.supervised && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#FACC15', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(250,204,21,0.3)' }}>INDOO SUPERVISED</span>}
                          </div>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6))' }} />
                        </div>

                        {/* Info */}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>📍 {l.city} · {l.sub_category || l.extra_fields?.property_type}</div>

                          {/* Price dual */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(priceIDR)}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{currObj.symbol} {priceForeign.toLocaleString()}</div>
                          </div>

                          {/* Specs */}
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            {l.extra_fields?.bedrooms && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>🛏️ {l.extra_fields.bedrooms}</span>}
                            {l.extra_fields?.bathrooms && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>🚿 {l.extra_fields.bathrooms}</span>}
                            {(l.extra_fields?.land_area || l.extra_fields?.building_area) && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>📐 {l.extra_fields.land_area || l.extra_fields.building_area}</span>}
                            {l.extra_fields?.certificate && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', fontSize: 11, fontWeight: 700, color: '#8DC63F', border: '1px solid rgba(141,198,63,0.15)' }}>{l.extra_fields.certificate}</span>}
                          </div>

                          {/* Yield + Method */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {yieldData && <span style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>📈 {yieldData.grossYield}% yield</span>}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{eligibility.method}</span>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ LEGAL GUIDE TAB ═══ */}
        {tab === 'guide' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Ownership Methods */}
            <ScrollReveal>
              <div style={{ ...glass, padding: '24px' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Foreign Ownership Methods</h3>
                {FOREIGN_OWNERSHIP_GUIDE.map((g, i) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: i < FOREIGN_OWNERSHIP_GUIDE.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{g.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: g.title.includes('NOT') ? '#EF4444' : '#fff' }}>{g.title}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, paddingLeft: 30 }}>{g.desc}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Tax Information */}
            <ScrollReveal delay={0.1}>
              <div style={{ ...glass, padding: '24px' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Indonesian Property Tax Guide</h3>
                {INDONESIA_TAX_INFO.map((t, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < INDONESIA_TAX_INFO.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{t.desc}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', whiteSpace: 'nowrap' }}>{t.value}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Important Notice */}
            <div style={{ gridColumn: '1 / -1' }}>
              <ScrollReveal delay={0.15}>
                <div style={{ ...glass, background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.15)', padding: '20px 24px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>INDOO Guided Transactions</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Every international investment through INDOO is guided from start to finish. We verify legal status, coordinate with registered notaris, oversee construction where required, and ensure full compliance with Indonesian foreign ownership regulations. Each project is assessed individually — contact our team directly to discuss your specific investment goals and requirements.</div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}

        {/* ═══ GLOBAL AGENTS TAB ═══ */}
        {tab === 'agents' && (
          <>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Certified Global Agents</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>INDOO-certified agents qualified to handle international property transactions</p>
              </div>
            </ScrollReveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }}>
              {DEMO_GLOBAL_AGENTS.map(agent => (
                <ScrollReveal key={agent.id}>
                  <div style={{ ...glass, border: agent.certified ? '1px solid rgba(250,204,21,0.2)' : '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(250,204,21,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#FACC15', flexShrink: 0 }}>{agent.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{agent.name}</span>
                          {agent.certified && <span style={{ fontSize: 12, color: '#FACC15' }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>📍 {agent.city} · {agent.experience_years} years experience</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>⭐ {agent.rating}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{agent.deals_closed} deals</div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                      {agent.languages.map(l => (
                        <span key={l} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{l}</span>
                      ))}
                    </div>

                    {/* Specializations */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
                      {agent.specialization.map(s => (
                        <span key={s} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', fontSize: 11, fontWeight: 700, color: '#8DC63F', border: '1px solid rgba(141,198,63,0.15)' }}>{s}</span>
                      ))}
                    </div>

                    <button style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FACC15, #F59E0B)', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Contact Agent</button>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Become a Global Agent */}
            <ScrollReveal>
              <div style={{ ...glass, background: 'rgba(141,198,63,0.04)', border: '1px solid rgba(141,198,63,0.15)', padding: '28px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌏</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Become a Global Agent</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 16, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>Access high-value international deals, earn premium commissions, and build your portfolio with foreign investors.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', fontSize: 12, fontWeight: 700, color: '#8DC63F', border: '1px solid rgba(141,198,63,0.15)' }}>Verified Portfolio</span>
                  <span style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(250,204,21,0.08)', fontSize: 12, fontWeight: 700, color: '#FACC15', border: '1px solid rgba(250,204,21,0.15)' }}>INDOO Certified</span>
                  <span style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>International Network</span>
                </div>
                <button style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Apply for Certification</button>
              </div>
            </ScrollReveal>
          </>
        )}

        {/* ═══ HOW IT WORKS TAB ═══ */}
        {tab === 'process' && (
          <>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>How INDOO Guides Your Investment</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Every step managed by our experienced team — tailored to your project</p>
              </div>
            </ScrollReveal>

            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              {TRANSACTION_STEPS.map((step, i) => (
                <ScrollReveal key={step.id} delay={i * 0.05}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                    {/* Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: step.optional ? 'rgba(255,255,255,0.04)' : 'rgba(141,198,63,0.12)', border: step.optional ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: step.optional ? 'rgba(255,255,255,0.3)' : '#8DC63F' }}>{step.id}</div>
                      {i < TRANSACTION_STEPS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: 'rgba(141,198,63,0.15)' }} />}
                    </div>
                    {/* Content */}
                    <div style={{ ...glass, flex: 1, padding: '16px 20px', marginBottom: 12, opacity: step.optional ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{step.label}</span>
                        {step.optional && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>OPTIONAL</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Contact CTA */}
            <ScrollReveal delay={0.3}>
              <div style={{ ...glass, background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.15)', padding: '32px 24px', maxWidth: 700, margin: '24px auto 0', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Ready to Invest?</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20, maxWidth: 500, margin: '0 auto 20px' }}>Every investment is unique. Contact our team directly so we can evaluate your requirements, project scope, and deliver a tailored strategy built around your goals.</div>
                <a href="https://wa.me/6281234567890?text=Hello%20INDOO%2C%20I%27m%20interested%20in%20investing%20in%20Indonesian%20property.%20I%27d%20like%20to%20discuss%20my%20requirements." target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/dfggdfgees-removebg-preview.png" alt="Speak With Our Team" style={{ height: 52, objectFit: 'contain' }} /></a>
              </div>
            </ScrollReveal>
          </>
        )}

        {/* Back button */}
        {onBack && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button onClick={onBack} style={{ padding: '12px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Home</button>
          </div>
        )}
      </div>
    </div>
  )
}
