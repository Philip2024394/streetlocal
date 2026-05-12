/**
 * KTPVerification — 4-step identity verification for sellers/drivers
 * Steps: Phone (done) → NIK + Name → Selfie with KTP → Bank name match
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { submitKTPVerification, getKTPStatus, validateNIK } from '@/services/ktpVerificationService'

const BANKS = [
  { code: 'BCA', name: 'BCA' },
  { code: 'BRI', name: 'BRI' },
  { code: 'MANDIRI', name: 'Mandiri' },
  { code: 'BNI', name: 'BNI' },
  { code: 'BSI', name: 'BSI' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'DANAMON', name: 'Danamon' },
  { code: 'PERMATA', name: 'Permata' },
  { code: 'OTHER', name: 'Other' },
]

export default function KTPVerification({ open, onClose, onVerified }) {
  const { user, userProfile } = useAuth()
  const [step, setStep] = useState(1) // 1: NIK, 2: KTP photo, 3: Selfie, 4: Bank
  const [nik, setNik] = useState('')
  const [ktpName, setKtpName] = useState(userProfile?.displayName ?? '')
  const [ktpPhoto, setKtpPhoto] = useState(null)
  const [ktpPhotoPreview, setKtpPhotoPreview] = useState(null)
  const [selfie, setSelfie] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [bankCode, setBankCode] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [currentStatus, setCurrentStatus] = useState(null)
  const ktpFileRef = useRef(null)
  const selfieFileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const uid = user?.id ?? user?.uid
    if (uid) getKTPStatus(uid).then(setCurrentStatus)
  }, [open, user])

  if (!open) return null

  // Already verified or pending
  if (currentStatus?.ktp_status === 'approved') {
    return createPortal(
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={titleStyle}>Identity Verified</h2>
          <p style={subStyle}>Your KTP has been verified by INDOO admin. You have full access to all seller features.</p>
          <span style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700 }}>{currentStatus.ktp_name} · NIK ****{currentStatus.ktp_nik?.slice(-4)}</span>
          <button onClick={onClose} style={btnStyle}>Done</button>
        </div>
      </div>,
      document.body
    )
  }

  if (currentStatus?.ktp_status === 'pending') {
    return createPortal(
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid #FACC15', borderTopColor: 'transparent', animation: 'spin 1.5s linear infinite', margin: '0 auto 16px' }} />
          <h2 style={titleStyle}>Verification In Progress</h2>
          <p style={subStyle}>Your KTP is being reviewed by our team. This usually takes 1-24 hours. We'll notify you when approved.</p>
          <button onClick={onClose} style={btnStyle}>Close</button>
        </div>
      </div>,
      document.body
    )
  }

  if (currentStatus?.ktp_status === 'rejected') {
    // Allow re-submission
    if (step === 0) setStep(1)
  }

  const nikValid = nik.replace(/\s/g, '').length === 16 && validateNIK(nik).valid

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const uid = user?.id ?? user?.uid
    const result = await submitKTPVerification(uid, {
      nik,
      ktpName,
      ktpPhotoFile: ktpPhoto,
      ktpSelfieFile: selfie,
      bankName,
      bankAccount,
      bankCode,
    })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setCurrentStatus({ ktp_status: 'pending' })
    onVerified?.()
  }

  return createPortal(
    <div style={overlayStyle}>
      <div style={{ ...cardStyle, maxHeight: '90vh', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ ...titleStyle, margin: 0, fontSize: 18 }}>Verify Your Identity</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>x</button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              width: s === step ? 24 : 8, height: 8, borderRadius: 4,
              background: s < step ? '#8DC63F' : s === step ? '#FACC15' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {currentStatus?.ktp_status === 'rejected' && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>Previous submission rejected: {currentStatus.ktp_rejected_reason ?? 'Please resubmit with clearer documents'}</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>{error}</span>
          </div>
        )}

        {/* ── Step 1: NIK + Name ── */}
        {step === 1 && (
          <>
            <p style={subStyle}>Enter your KTP (Kartu Tanda Penduduk) details</p>
            <label style={labelStyle}>NIK (16 digits)</label>
            <input
              value={nik}
              onChange={e => setNik(e.target.value.replace(/[^\d\s]/g, '').slice(0, 19))}
              placeholder="3201 0101 9001 0001"
              inputMode="numeric"
              maxLength={19}
              style={inputStyle}
            />
            {nik.length > 0 && !nikValid && <span style={{ fontSize: 10, color: '#EF4444', display: 'block', marginTop: 4 }}>Must be 16 digits with valid province code</span>}

            <label style={{ ...labelStyle, marginTop: 14 }}>Full name (exactly as on KTP)</label>
            <input
              value={ktpName}
              onChange={e => setKtpName(e.target.value)}
              placeholder="Full legal name"
              maxLength={100}
              style={inputStyle}
            />

            <button
              onClick={() => setStep(2)}
              disabled={!nikValid || !ktpName.trim()}
              style={{ ...btnStyle, opacity: nikValid && ktpName.trim() ? 1 : 0.4 }}
            >
              Next — Upload KTP Photo
            </button>
          </>
        )}

        {/* ── Step 2: KTP Photo ── */}
        {step === 2 && (
          <>
            <p style={subStyle}>Take a clear photo of your KTP card</p>
            <div
              onClick={() => ktpFileRef.current?.click()}
              style={{
                width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: ktpPhotoPreview ? 'none' : 'rgba(255,255,255,0.02)',
              }}
            >
              {ktpPhotoPreview ? (
                <img src={ktpPhotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="8.5" cy="10.5" r="2.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Tap to upload KTP photo</span>
                </div>
              )}
            </div>
            <input ref={ktpFileRef} type="file" accept="image/*" capture="environment" onChange={e => {
              const f = e.target.files?.[0]; if (f) { setKtpPhoto(f); setKtpPhotoPreview(URL.createObjectURL(f)) }
            }} style={{ display: 'none' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', marginTop: 8 }}>Make sure all text is readable and no glare</span>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep(1)} style={{ ...btnSecondary, flex: 1 }}>Back</button>
              <button onClick={() => setStep(3)} disabled={!ktpPhoto} style={{ ...btnStyle, flex: 2, opacity: ktpPhoto ? 1 : 0.4 }}>Next — Take Selfie</button>
            </div>
          </>
        )}

        {/* ── Step 3: Selfie holding KTP ── */}
        {step === 3 && (
          <>
            <p style={subStyle}>Take a selfie while holding your KTP card next to your face</p>
            <div
              onClick={() => selfieFileRef.current?.click()}
              style={{
                width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selfiePreview ? 'none' : 'rgba(255,255,255,0.02)',
              }}
            >
              {selfiePreview ? (
                <img src={selfiePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Tap to take selfie with KTP</span>
                </div>
              )}
            </div>
            <input ref={selfieFileRef} type="file" accept="image/*" capture="user" onChange={e => {
              const f = e.target.files?.[0]; if (f) { setSelfie(f); setSelfiePreview(URL.createObjectURL(f)) }
            }} style={{ display: 'none' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', marginTop: 8 }}>Face must be clearly visible alongside KTP</span>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep(2)} style={{ ...btnSecondary, flex: 1 }}>Back</button>
              <button onClick={() => setStep(4)} disabled={!selfie} style={{ ...btnStyle, flex: 2, opacity: selfie ? 1 : 0.4 }}>Next — Bank Details</button>
            </div>
          </>
        )}

        {/* ── Step 4: Bank account (name must match KTP) ── */}
        {step === 4 && (
          <>
            <p style={subStyle}>Bank account holder name must match your KTP name</p>

            <label style={labelStyle}>Bank</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {BANKS.map(b => (
                <button
                  key={b.code}
                  onClick={() => setBankCode(b.code)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: bankCode === b.code ? 'rgba(141,198,63,0.2)' : 'rgba(255,255,255,0.04)',
                    color: bankCode === b.code ? '#8DC63F' : 'rgba(255,255,255,0.4)',
                    fontSize: 11, fontWeight: 800, transition: 'all 0.15s',
                    outline: bankCode === b.code ? '1px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Account number</label>
            <input
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value.replace(/[^\d\s-]/g, ''))}
              placeholder="1234 5678 90"
              inputMode="numeric"
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: 14 }}>Account holder name</label>
            <input
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="Must match KTP name"
              style={inputStyle}
            />
            {bankName && ktpName && bankName.trim().toLowerCase() !== ktpName.trim().toLowerCase() && (
              <span style={{ fontSize: 10, color: '#FACC15', display: 'block', marginTop: 4 }}>Name doesn't match KTP — admin will review</span>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep(3)} style={{ ...btnSecondary, flex: 1 }}>Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !bankCode || !bankAccount.trim() || !bankName.trim()}
                style={{ ...btnStyle, flex: 2, opacity: bankCode && bankAccount.trim() && bankName.trim() ? 1 : 0.4 }}
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Shared styles ────────────────────────────────────────────────────────────
const overlayStyle = { position: 'fixed', inset: 0, zIndex: 10200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const cardStyle = { width: '100%', maxWidth: 380, background: '#111', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.06)' }
const titleStyle = { fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px', textAlign: 'center' }
const subStyle = { fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', lineHeight: 1.5 }
const labelStyle = { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }
const btnStyle = { marginTop: 16, width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#8DC63F', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }
const btnSecondary = { marginTop: 16, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }
