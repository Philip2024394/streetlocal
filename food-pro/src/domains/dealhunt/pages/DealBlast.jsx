/**
 * DealBlast — Pay to blast your deal to users in your city
 * Notifications-style glass UI. Select banner → payment → screenshot → send to INDOO team
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const PACKAGES = [
  { id: 'starter',   users: 500,   price: 100000,  label: 'Starter',    icon: '🚀', desc: 'Perfect for testing the waters' },
  { id: 'boost',     users: 2000,  price: 350000,  label: 'Boost',      icon: '⚡', desc: 'Reach more buyers in your area' },
  { id: 'mega',      users: 5000,  price: 750000,  label: 'Mega',       icon: '🔥', desc: 'Maximum exposure for your deal' },
  { id: 'city',      users: 10000, price: 1200000, label: 'City Blast', icon: '💎', desc: 'Blast to entire city', badge: 'BEST VALUE' },
]

const CITIES = ['Yogyakarta', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang', 'Bali', 'Medan', 'Makassar']

const BANK_ACCOUNTS = [
  { bank: 'BCA', number: '8810 2233 4455', holder: 'PT INDOO Indonesia' },
  { bank: 'Mandiri', number: '1100 0098 7654', holder: 'PT INDOO Indonesia' },
  { bank: 'BRI', number: '0096 0100 8899', holder: 'PT INDOO Indonesia' },
]

const BLAST_STORAGE = 'indoo_deal_blasts'

function saveBlast(blast) {
  const blasts = JSON.parse(localStorage.getItem(BLAST_STORAGE) || '[]')
  blasts.unshift(blast)
  localStorage.setItem(BLAST_STORAGE, JSON.stringify(blasts))
}

export function getPendingBlasts() {
  return JSON.parse(localStorage.getItem(BLAST_STORAGE) || '[]').filter(b => b.status === 'pending')
}
export function approveBlast(blastId) {
  const blasts = JSON.parse(localStorage.getItem(BLAST_STORAGE) || '[]')
  localStorage.setItem(BLAST_STORAGE, JSON.stringify(blasts.map(b => b.id === blastId ? { ...b, status: 'sent', sent_at: new Date().toISOString() } : b)))
}
export function rejectBlast(blastId, reason) {
  const blasts = JSON.parse(localStorage.getItem(BLAST_STORAGE) || '[]')
  localStorage.setItem(BLAST_STORAGE, JSON.stringify(blasts.map(b => b.id === blastId ? { ...b, status: 'rejected', reject_reason: reason } : b)))
}

const glass = {
  backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
  borderRadius: 16, padding: 16,
}

export default function DealBlast({ open, onClose, deal }) {
  const [step, setStep] = useState('package') // package | banner | payment | submitted
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [city, setCity] = useState('Yogyakarta')
  const [bannerImage, setBannerImage] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [selectedBank, setSelectedBank] = useState(null)
  const [proofImage, setProofImage] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [copyMsg, setCopyMsg] = useState(false)
  const bannerRef = useRef(null)
  const proofRef = useRef(null)

  if (!open) return null

  const pkg = PACKAGES.find(p => p.id === selectedPkg)

  const handleSubmit = () => {
    if (!selectedPkg || !bannerPreview || !selectedBank || !proofPreview) return
    saveBlast({
      id: `BLAST-${Date.now().toString(36).toUpperCase()}`,
      deal_id: deal?.id ?? null, deal_title: deal?.title ?? 'General Promotion',
      package: pkg.label, users: pkg.users, price: pkg.price,
      city, banner_url: bannerPreview, payment_method: selectedBank.bank,
      proof_url: proofPreview, status: 'pending', created_at: new Date().toISOString(),
    })
    setStep('submitted')
  }

  const canProceed = step === 'package' ? !!selectedPkg : step === 'banner' ? !!bannerPreview : step === 'payment' ? (!!selectedBank && !!proofPreview) : false

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      backgroundColor: '#000',
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33.png?updatedAt=1775555797749)',
      backgroundSize: 'cover', backgroundPosition: 'center top',
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span style={{ fontSize: 28 }}>🚀</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>Deal Blast</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {step === 'package' ? 'Select your package' : step === 'banner' ? 'Upload your banner' : step === 'payment' ? 'Complete payment' : 'Done'}
          </span>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['package', 'banner', 'payment'].map((s, i) => (
            <div key={s} style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: ['package', 'banner', 'payment'].indexOf(step) >= i ? '#FACC15' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px', position: 'relative', zIndex: 1 }}>

        {/* ── STEP 1: Package ── */}
        {step === 'package' && (
          <>
            {/* City */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Target City</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CITIES.map(c => (
                  <button key={c} onClick={() => setCity(c)} style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: city === c ? 'rgba(250,204,21,0.15)' : 'rgba(0,0,0,0.3)', border: `1px solid ${city === c ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.08)'}`, color: city === c ? '#FACC15' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Packages */}
            {PACKAGES.map(p => (
              <div key={p.id} onClick={() => setSelectedPkg(p.id)} style={{ ...glass, marginBottom: 10, cursor: 'pointer', borderColor: selectedPkg === p.id ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
                {p.badge && <span style={{ position: 'absolute', top: 12, right: 12, padding: '3px 8px', borderRadius: 6, backgroundColor: '#FACC15', fontSize: 9, fontWeight: 900, color: '#000' }}>{p.badge}</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: selectedPkg === p.id ? 'rgba(250,204,21,0.15)' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{p.label}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.users.toLocaleString()} users · {p.desc}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(p.price)}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── STEP 2: Banner ── */}
        {step === 'banner' && (
          <>
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>🖼️</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Your Banner Ad</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>This image will be sent to {pkg?.users?.toLocaleString()} users. Make it count!</p>
              <button onClick={() => bannerRef.current?.click()} style={{ width: '100%', height: 180, borderRadius: 16, border: '1.5px dashed rgba(250,204,21,0.3)', backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {bannerPreview ? <img src={bannerPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📸</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Tap to upload banner</span>
                  </div>
                )}
              </button>
              <input ref={bannerRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setBannerImage(f); setBannerPreview(URL.createObjectURL(f)) } }} style={{ display: 'none' }} />
            </div>

            {/* Summary */}
            <div style={{ ...glass }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Blast Summary</span>
              </div>
              {[
                { label: 'Package', value: pkg?.label },
                { label: 'Users', value: `${pkg?.users?.toLocaleString()} in ${city}` },
                { label: 'Deal', value: deal?.title ?? 'General Promotion' },
                { label: 'Total', value: fmtRp(pkg?.price), highlight: true },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: r.highlight ? '#FACC15' : '#fff' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 'payment' && (
          <>
            {/* Amount */}
            <div style={{ ...glass, marginBottom: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block' }}>Amount to Pay</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 4 }}>{fmtRp(pkg?.price)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4 }}>{pkg?.label} · {pkg?.users?.toLocaleString()} users · {city}</span>
            </div>

            {/* Bank selection */}
            <div style={{ ...glass, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>🏦</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Transfer to</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BANK_ACCOUNTS.map(bank => (
                  <button key={bank.bank} onClick={() => setSelectedBank(bank)} style={{
                    padding: 14, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    backgroundColor: selectedBank?.bank === bank.bank ? 'rgba(141,198,63,0.1)' : 'rgba(0,0,0,0.3)',
                    border: `1.5px solid ${selectedBank?.bank === bank.bank ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block' }}>{bank.bank}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', letterSpacing: '0.04em', display: 'block', marginTop: 4 }}>{bank.number}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{bank.holder}</span>
                      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(bank.number); setCopyMsg(true); setTimeout(() => setCopyMsg(false), 2000) }} style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: copyMsg ? 'rgba(141,198,63,0.2)' : '#8DC63F', border: 'none', color: copyMsg ? '#8DC63F' : '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                        {copyMsg ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Screenshot upload */}
            <div style={{ ...glass }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📎</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Payment Proof</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>Upload screenshot of your bank transfer</p>
              <button onClick={() => proofRef.current?.click()} style={{ width: '100%', height: 140, borderRadius: 14, border: '1.5px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {proofPreview ? <img src={proofPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>📱</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Tap to upload screenshot</span>
                  </div>
                )}
              </button>
              <input ref={proofRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setProofImage(f); setProofPreview(URL.createObjectURL(f)) } }} style={{ display: 'none' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, display: 'block' }}>INDOO team will verify and activate your blast same day</span>
            </div>
          </>
        )}

        {/* ── SUBMITTED ── */}
        {step === 'submitted' && (
          <div style={{ ...glass, textAlign: 'center', marginTop: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(250,204,21,0.1)', border: '2px solid rgba(250,204,21,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: 32 }}>🚀</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Blast Submitted!</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Payment proof sent to INDOO team.</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>Your banner will be blasted to {pkg?.users?.toLocaleString()} users in {city} once verified.</span>
            <span style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700, display: 'block', marginBottom: 20 }}>Activation: Same day during business hours</span>
            <button onClick={onClose} style={{ padding: '14px 40px', borderRadius: 14, backgroundColor: '#FACC15', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Done</button>
          </div>
        )}
      </div>

      {/* Bottom button */}
      {step !== 'submitted' && (
        <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => { if (step === 'package') setStep('banner'); else if (step === 'banner') setStep('payment'); else if (step === 'payment') handleSubmit() }}
            disabled={!canProceed}
            style={{
              width: '100%', padding: 16, borderRadius: 16,
              backgroundColor: canProceed ? '#FACC15' : 'rgba(255,255,255,0.06)',
              border: 'none', color: canProceed ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 16, fontWeight: 900, cursor: canProceed ? 'pointer' : 'default', fontFamily: 'inherit',
            }}
          >
            {step === 'package' ? 'Next — Upload Banner' : step === 'banner' ? 'Next — Payment' : 'Send to INDOO Team'}
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
