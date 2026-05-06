/**
 * OfferPanel — Seller/agent view for incoming offers on a listing.
 * Used in the dashboard to review, accept, counter, decline, or redirect offers.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  getOffersForListing,
  respondToOffer,
  fmtOffer,
  offerStrength,
  OFFER_STATUS,
} from '@/services/offerService'

// ── helpers ──

function maskPhone(phone) {
  if (!phone) return '—'
  const s = String(phone)
  if (s.length < 8) return s
  return s.slice(0, 4) + '****' + s.slice(-4)
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

function whatsAppUrl(phone, listingTitle) {
  const formatted = phone ? String(phone).replace(/^0/, '62').replace(/^\+/, '') : ''
  const msg = `Halo, penawaran Anda untuk ${listingTitle || 'properti ini'} telah diterima! Mari kita lanjutkan diskusi.`
  return `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`
}

// ── shared styles ──

const S = {
  panel: {
    width: '100%',
    maxWidth: 640,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  badge: {
    background: 'rgba(141,198,63,0.18)',
    color: '#8DC63F',
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 20,
    padding: '2px 10px',
    minWidth: 24,
    textAlign: 'center',
  },
  empty: {
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '40px 24px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 1.6,
  },
  card: {
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
  },
  buyerPhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'monospace',
  },
  offerAmount: {
    fontSize: 22,
    fontWeight: 800,
    margin: '12px 0 4px',
  },
  pctLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 8,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  message: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
    lineHeight: 1.5,
    margin: '8px 0',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    borderLeft: '3px solid rgba(255,255,255,0.12)',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  statusBadge: (color) => ({
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 700,
    color,
    background: color + '1A',
    borderRadius: 20,
    padding: '3px 12px',
  }),
  btnRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  btn: (bg, border) => ({
    flex: '1 1 auto',
    minWidth: 90,
    padding: '10px 14px',
    borderRadius: 10,
    border: border ? `1.5px solid ${border}` : 'none',
    background: bg || 'transparent',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'opacity 0.15s',
  }),
  inlineForm: {
    marginTop: 12,
    padding: 14,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  sellerNote: (color) => ({
    fontSize: 13,
    color,
    marginTop: 10,
    padding: '8px 12px',
    background: color + '12',
    borderRadius: 8,
    lineHeight: 1.5,
  }),
  waBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: '10px 18px',
    borderRadius: 10,
    background: '#25D366',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
  },
}

// ── sub-components ──

function StatusBadge({ status }) {
  const s = OFFER_STATUS[status] || OFFER_STATUS.pending
  return <span style={S.statusBadge(s.color)}>{s.label}</span>
}

function StrengthBar({ strength }) {
  const pct = Math.min(strength.pct, 100)
  return (
    <div style={S.barTrack}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        borderRadius: 3,
        background: strength.color,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

function CounterForm({ onSubmit, onCancel, loading }) {
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState('')

  return (
    <div style={S.inlineForm}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#60A5FA' }}>Counter Offer</div>
      <input
        style={S.input}
        type="number"
        placeholder="Counter amount (e.g. 2600000000)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <input
        style={S.input}
        placeholder="Message to buyer (optional)"
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={S.btn('#3B82F6')}
          disabled={!amount || loading}
          onClick={() => onSubmit(Number(amount), msg)}
        >
          {loading ? 'Sending...' : 'Send Counter'}
        </button>
        <button style={S.btn(null, 'rgba(255,255,255,0.15)')} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function DeclineForm({ onSubmit, onCancel, loading }) {
  const [msg, setMsg] = useState('')

  return (
    <div style={S.inlineForm}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444' }}>Decline Offer</div>
      <input
        style={S.input}
        placeholder="Reason / message (optional)"
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={S.btn('#EF4444')}
          disabled={loading}
          onClick={() => onSubmit(msg)}
        >
          {loading ? 'Declining...' : 'Confirm Decline'}
        </button>
        <button style={S.btn(null, 'rgba(255,255,255,0.15)')} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function RedirectForm({ onSubmit, onCancel, loading }) {
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')

  return (
    <div style={S.inlineForm}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>Redirect to Another Listing</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
        "I have something better for your budget"
      </div>
      <input
        style={S.input}
        placeholder="Listing title to redirect to"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        style={S.input}
        placeholder="Message to buyer (optional)"
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={S.btn('#8B5CF6')}
          disabled={!title || loading}
          onClick={() => onSubmit(title, msg)}
        >
          {loading ? 'Redirecting...' : 'Send Redirect'}
        </button>
        <button style={S.btn(null, 'rgba(255,255,255,0.15)')} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── OfferCard ──

function OfferCard({ offer, listingTitle, listingPrice, onRespond }) {
  const [activeForm, setActiveForm] = useState(null) // 'counter' | 'decline' | 'redirect'
  const [loading, setLoading] = useState(false)
  const strength = offerStrength(offer.offer_amount, listingPrice)
  const isPending = offer.status === 'pending'

  const handleRespond = useCallback(async (response) => {
    setLoading(true)
    try {
      await onRespond(offer.id, response)
      setActiveForm(null)
    } finally {
      setLoading(false)
    }
  }, [offer.id, onRespond])

  return (
    <div style={S.card}>
      {/* buyer info + status */}
      <div style={S.row}>
        <div>
          <span style={S.buyerName}>{offer.buyer_name || 'Buyer'}</span>
          <span style={{ ...S.buyerPhone, marginLeft: 10 }}>{maskPhone(offer.buyer_phone)}</span>
        </div>
        <StatusBadge status={offer.status} />
      </div>

      {/* offer amount */}
      <div style={{ ...S.offerAmount, color: strength.color }}>
        {fmtOffer(offer.offer_amount)}
      </div>

      {/* pct label + strength bar */}
      <div style={S.pctLabel}>
        {strength.pct}% of asking price &middot; {strength.label}
      </div>
      <StrengthBar strength={strength} />

      {/* buyer message */}
      {offer.message && (
        <div style={S.message}>"{offer.message}"</div>
      )}

      {/* time */}
      <div style={S.time}>{timeAgo(offer.created_at)}</div>

      {/* countered info */}
      {offer.status === 'countered' && (
        <div style={S.sellerNote('#60A5FA')}>
          <strong>Counter: {fmtOffer(offer.counter_amount)}</strong>
          {offer.seller_message && <div style={{ marginTop: 4 }}>{offer.seller_message}</div>}
        </div>
      )}

      {/* redirected info */}
      {offer.status === 'redirected' && (
        <div style={S.sellerNote('#A78BFA')}>
          <strong>Redirected to: {offer.redirect_listing_title || '—'}</strong>
          {offer.seller_message && <div style={{ marginTop: 4 }}>{offer.seller_message}</div>}
        </div>
      )}

      {/* accepted — WhatsApp contact */}
      {offer.status === 'accepted' && (
        <a
          href={whatsAppUrl(offer.buyer_phone, listingTitle)}
          target="_blank"
          rel="noopener noreferrer"
          style={S.waBtn}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat on WhatsApp
        </a>
      )}

      {/* action buttons for pending */}
      {isPending && !activeForm && (
        <div style={S.btnRow}>
          <button style={S.btn('#16A34A')} onClick={() => handleRespond({ status: 'accepted' })}>
            {loading ? 'Accepting...' : 'Accept'}
          </button>
          <button style={S.btn('#3B82F6')} onClick={() => setActiveForm('counter')}>
            Counter
          </button>
          <button style={S.btn(null, '#EF4444')} onClick={() => setActiveForm('decline')}>
            Decline
          </button>
          <button style={S.btn('#7C3AED')} onClick={() => setActiveForm('redirect')}>
            Redirect
          </button>
        </div>
      )}

      {/* inline forms */}
      {activeForm === 'counter' && (
        <CounterForm
          loading={loading}
          onCancel={() => setActiveForm(null)}
          onSubmit={(amount, msg) => handleRespond({
            status: 'countered',
            counter_amount: amount,
            seller_message: msg || null,
          })}
        />
      )}
      {activeForm === 'decline' && (
        <DeclineForm
          loading={loading}
          onCancel={() => setActiveForm(null)}
          onSubmit={(msg) => handleRespond({
            status: 'rejected',
            seller_message: msg || null,
          })}
        />
      )}
      {activeForm === 'redirect' && (
        <RedirectForm
          loading={loading}
          onCancel={() => setActiveForm(null)}
          onSubmit={(title, msg) => handleRespond({
            status: 'redirected',
            redirect_listing_title: title,
            seller_message: msg || null,
          })}
        />
      )}
    </div>
  )
}

// ── main component ──

export default function OfferPanel({ listingId, listingTitle, listingPrice, offers: offersProp }) {
  const [offers, setOffers] = useState(offersProp || [])
  const [loading, setLoading] = useState(!offersProp)

  useEffect(() => {
    if (offersProp) {
      setOffers(offersProp)
      return
    }
    if (!listingId) return
    let cancelled = false
    setLoading(true)
    getOffersForListing(listingId)
      .then(data => { if (!cancelled) setOffers(data || []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [listingId, offersProp])

  const handleRespond = useCallback(async (offerId, response) => {
    const updated = await respondToOffer(offerId, response)
    if (updated) {
      setOffers(prev => prev.map(o => (o.id === offerId ? { ...o, ...updated } : o)))
    }
  }, [])

  if (loading) {
    return (
      <div style={S.panel}>
        <div style={S.empty}>Loading offers...</div>
      </div>
    )
  }

  return (
    <div style={S.panel}>
      {/* header */}
      <div style={S.header}>
        <h3 style={S.headerTitle}>Offers Received</h3>
        <span style={S.badge}>{offers.length}</span>
      </div>

      {/* empty state */}
      {offers.length === 0 && (
        <div style={S.empty}>
          No offers yet — your listing is live and collecting interest
        </div>
      )}

      {/* offer cards */}
      {offers.map(offer => (
        <OfferCard
          key={offer.id}
          offer={offer}
          listingTitle={listingTitle}
          listingPrice={listingPrice}
          onRespond={handleRespond}
        />
      ))}
    </div>
  )
}
