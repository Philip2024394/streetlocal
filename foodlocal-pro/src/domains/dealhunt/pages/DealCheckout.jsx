/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DealCheckout — instant buy flow
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Payment model (same as marketplace + food):
 * - Buyer pays DIRECTLY to seller's bank account
 * - INDOO never touches the money
 * - INDOO records 10% commission on seller's wallet (7% if bank transfer — 3% discount to buyer)
 * - Seller owes INDOO commission (tracked via wallet/debt system)
 *
 * Flow: "Get This Deal" → see seller bank details → pay → enter ref code → confirmed
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { getLocalDefaultAddress } from '@/services/addressService'
import { claimDeal } from '@/services/dealService'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const BANK_DISCOUNT = 0.03
const INDOO_COMMISSION = 0.10

function generateQR(code) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INDOO-DEAL-${code}`
}

export default function DealCheckout({ deal, open, onClose, onSuccess }) {
  const { user } = useAuth()
  const [step, setStep] = useState('payment') // 'payment' | 'processing' | 'success'
  const [transactionCode, setTransactionCode] = useState('')
  const [dealType, setDealType] = useState(deal?.deal_type ?? 'delivery')
  const [address, setAddress] = useState(() => getLocalDefaultAddress())
  const [processing, setProcessing] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [copyMsg, setCopyMsg] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)

  // Countdown
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!deal?.end_time) return
    const id = setInterval(() => {
      const diff = new Date(deal.end_time).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(id)
  }, [deal?.end_time])

  useEffect(() => {
    if (open) {
      setStep('payment')
      setTransactionCode('')
      setDealType(deal?.deal_type ?? 'delivery')
      setAddress(getLocalDefaultAddress())
      setProcessing(false)
      setVoucherCode('')
      setProofFile(null)
      setProofPreview(null)
    }
  }, [open, deal?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !deal) return null

  // Price calculations
  const dealPrice = deal.deal_price ?? 0
  const originalPrice = deal.original_price ?? 0
  const discount = Math.round((1 - dealPrice / originalPrice) * 100)
  const deliveryFee = dealType === 'delivery' ? 12000 : 0
  const bankDiscount = Math.round(dealPrice * BANK_DISCOUNT)
  const customerPays = dealPrice - bankDiscount + deliveryFee
  const sellerGets = dealPrice - Math.round(dealPrice * INDOO_COMMISSION)
  const image = deal.images?.[0] ?? deal.image_url ?? ''
  const isDelivery = dealType === 'delivery'
  const urgent = remaining && !remaining.includes('h') && !remaining.includes('Expired')
  const bank = deal.bank ?? { name: 'BCA', account_number: '1234 5678 90', account_holder: deal.seller_name ?? 'Seller' }

  const handleProofUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopyMsg(true)
    setTimeout(() => setCopyMsg(false), 1500)
  }

  const handleConfirm = async () => {
    if (!transactionCode.trim()) return
    setProcessing(true)
    setStep('processing')

    const uid = user?.id ?? user?.uid
    const result = await claimDeal(deal.id, uid)
    const code = result.claim?.voucher_code ?? ('INDOO' + Math.random().toString(36).slice(2, 8).toUpperCase())
    setVoucherCode(code)
    setQrUrl(generateQR(code))

    // In production: save payment proof + transaction code to Supabase
    // Record 10% commission on seller's wallet (7% since bank transfer)
    setTimeout(() => {
      setProcessing(false)
      setStep('success')
      onSuccess?.({
        deal,
        claim: result.claim,
        transactionCode,
        dealType,
        address: isDelivery ? address : null,
        customerPaid: customerPays,
        sellerReceives: sellerGets,
        indooCommission: Math.round(dealPrice * 0.07), // 7% after 3% buyer discount
        deliveryFee,
        voucherCode: code,
      })
    }, 2000)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10100, background: '#0a0a0a', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>

      {/* ── STEP 1: Payment ── */}
      {step === 'payment' && (
        <>
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', flex: 1 }}>Pay Seller Directly</span>
            {remaining && (
              <span style={{ fontSize: 12, fontWeight: 800, color: urgent ? '#EF4444' : '#FACC15', animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none' }}>
                {remaining}
              </span>
            )}
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

            {/* Deal summary */}
            <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
              {image && <img src={image} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>{deal.title}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>{deal.seller_name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(dealPrice)}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(originalPrice)}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 4 }}>{discount}% OFF</span>
                </div>
              </div>
            </div>

            {/* Deal type toggle */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>How do you want it?</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['delivery', 'pickup', 'eat_in'].map(type => (
                  <button
                    key={type}
                    onClick={() => setDealType(type)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: dealType === type ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)',
                      color: dealType === type ? '#8DC63F' : 'rgba(255,255,255,0.35)',
                      fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                      outline: dealType === type ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {type === 'delivery' ? 'Delivery' : type === 'pickup' ? 'Pickup' : 'Eat In'}
                  </button>
                ))}
              </div>
            </div>

            {/* Address (delivery only) */}
            {isDelivery && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Delivery address</span>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, fontWeight: 600,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Seller's bank details — buyer pays directly */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Transfer to seller</span>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.05)', border: '1px solid rgba(141,198,63,0.15)' }}>
                {/* Bank QR if available */}
                {bank.qr_url && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                    <div style={{ padding: 8, borderRadius: 12, background: '#fff' }}>
                      <img src={bank.qr_url} alt="QR" style={{ width: 120, height: 120 }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>{bank.name}</span>
                  <button onClick={() => handleCopy(bank.account_number)} style={{ background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', borderRadius: 8, padding: '4px 10px', color: '#8DC63F', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                    {copyMsg ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', letterSpacing: '0.05em' }}>{bank.account_number}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 4 }}>{bank.account_holder}</span>

                {/* Amount to transfer */}
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Transfer amount</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(dealPrice - bankDiscount)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700 }}>You save {fmtRp(bankDiscount)} (3% bank transfer discount)</span>
                </div>
              </div>
            </div>

            {/* Transaction code + proof */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Confirm your payment</span>
              <input
                value={transactionCode}
                onChange={e => setTransactionCode(e.target.value)}
                placeholder="Enter transaction / reference code"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, fontWeight: 600,
                  outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                }}
              />

              {/* Payment proof upload */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
                border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer',
                background: proofPreview ? 'rgba(141,198,63,0.05)' : 'rgba(255,255,255,0.02)',
              }}>
                {proofPreview ? (
                  <img src={proofPreview} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: proofPreview ? '#8DC63F' : 'rgba(255,255,255,0.4)', display: 'block' }}>
                    {proofPreview ? 'Payment proof uploaded' : 'Upload payment screenshot (optional)'}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Helps seller confirm faster</span>
                </div>
                <input type="file" accept="image/*" onChange={handleProofUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Price breakdown */}
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Deal price</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{fmtRp(dealPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#8DC63F' }}>Bank transfer discount (3%)</span>
                <span style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700 }}>-{fmtRp(bankDiscount)}</span>
              </div>
              {isDelivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Delivery fee (pay driver)</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{fmtRp(deliveryFee)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>You pay</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(customerPays)}</span>
              </div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', display: 'block', marginTop: 4 }}>
                Payment goes directly to {deal.seller_name}. {isDelivery ? 'Delivery fee paid to driver on arrival.' : ''}
              </span>
            </div>
          </div>

          {/* Sticky confirm button */}
          <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <button
              onClick={handleConfirm}
              disabled={!transactionCode.trim() || (isDelivery && !address.trim())}
              style={{
                width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: transactionCode.trim() ? '#8DC63F' : '#222',
                color: transactionCode.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                fontSize: 16, fontWeight: 900, transition: 'all 0.2s',
                opacity: transactionCode.trim() ? 1 : 0.5,
              }}
            >
              {!transactionCode.trim() ? 'Enter transaction code to confirm' : `I've Paid ${fmtRp(dealPrice - bankDiscount)}`}
            </button>
          </div>
        </>
      )}

      {/* ── STEP 2: Processing ��─ */}
      {step === 'processing' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid #8DC63F', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Confirming with seller</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{deal.seller_name}</span>
        </div>
      )}

      {/* ── STEP 3: Success ── */}
      {step === 'success' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center' }}>
            {isDelivery ? 'Order Confirmed!' : 'Deal Purchased!'}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            {isDelivery ? 'Seller will prepare your order' : 'Show this code to redeem'}
          </span>

          {/* QR for pickup/eat-in */}
          {!isDelivery && qrUrl && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={qrUrl} alt="QR" style={{ width: 180, height: 180 }} />
            </div>
          )}

          {/* Voucher code */}
          <button
            onClick={() => handleCopy(voucherCode)}
            style={{
              marginTop: 8, padding: '12px 24px', borderRadius: 12,
              background: 'rgba(141,198,63,0.1)', border: '1.5px solid rgba(141,198,63,0.3)',
              color: '#8DC63F', fontSize: 20, fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer',
            }}
          >
            {voucherCode}
          </button>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{copyMsg ? 'Copied!' : 'Tap to copy code'}</span>

          {/* Receipt */}
          <div style={{ width: '100%', maxWidth: 300, marginTop: 16, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Paid to {deal.seller_name}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(dealPrice - bankDiscount)}</span>
            </div>
            {isDelivery && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Delivery (pay driver)</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{fmtRp(deliveryFee)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>You saved</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>{fmtRp(originalPrice - dealPrice + bankDiscount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Ref</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{transactionCode}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              marginTop: 20, padding: '14px 32px', borderRadius: 14, border: 'none',
              background: '#8DC63F', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
