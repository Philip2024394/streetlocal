import { useState } from 'react'
import { createPortal } from 'react-dom'
import { checkSpam, recordStrike, isUserBanned, getWarningMessage } from '@/utils/spamFilter'
import { processCommission, COMMISSION_RATE } from '@/services/walletService'
import RentalCalendar from '@/components/calendar/RentalCalendar'

function fmtPrice(n) {
  if (!n) return '—'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

// Rental Chat Window
export function RentalChat({ listing, onClose, onBook }) {
  const refNum = `IND-${(listing?.id || 'XXX').toString().slice(-6).toUpperCase()}`
  const chatKey = `indoo_chat_${listing?.ref || listing?.id || 'default'}`
  const [whatsappShared, setWhatsappShared] = useState(false)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(chatKey) || '[]')
      if (saved.length) return saved.map(m => ({ ...m, time: new Date(m.time) }))
    } catch {}
    const priceInfo = listing?.buy_now
      ? `Sale Price: Rp ${(typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now || 0).toLocaleString('id-ID')}`
      : [
          listing?.price_day && `Daily: Rp ${listing.price_day.toLocaleString('id-ID')}`,
          listing?.price_week && `Weekly: Rp ${listing.price_week.toLocaleString('id-ID')}`,
          listing?.price_month && `Monthly: Rp ${listing.price_month.toLocaleString('id-ID')}`,
        ].filter(Boolean).join(' · ')
    return [
      { from: 'system', text: `📋 Listing: ${listing?.title}\nRef: ${refNum}\n${priceInfo}\nCity: ${listing?.city || 'Indonesia'}\n\n⚠️ Phone numbers, social links and contact details are blocked until WhatsApp is officially shared.`, time: new Date(), image: listing?.images?.[0] || null },
      { from: 'user', text: `Hi, I'm interested in "${listing?.title}" (Ref: ${refNum}). Is this still available?`, time: new Date() },
    ]
  })
  const [input, setInput] = useState('')
  const [spamWarning, setSpamWarning] = useState('')
  const [banned, setBanned] = useState(false)

  // Persist messages + save to chat history index
  const persistMessages = (msgs) => {
    try {
      localStorage.setItem(chatKey, JSON.stringify(msgs))
      // Update chat history index for Messages inbox
      const history = JSON.parse(localStorage.getItem('indoo_chat_history') || '[]')
      const existing = history.findIndex(h => h.listingId === (listing?.ref || listing?.id))
      const entry = {
        listingId: listing?.ref || listing?.id,
        title: listing?.title || 'Chat',
        image: listing?.images?.[0] || listing?.image || '',
        lastMessage: msgs[msgs.length - 1]?.text || '',
        lastTime: new Date().toISOString(),
        unread: false,
      }
      if (existing >= 0) history[existing] = entry
      else history.unshift(entry)
      localStorage.setItem('indoo_chat_history', JSON.stringify(history))
    } catch {}
  }

  const sendMessage = () => {
    if (!input.trim()) return
    if (isUserBanned()) { setBanned(true); return }
    const result = checkSpam(input)
    if (result.isSpam) {
      const strike = recordStrike()
      if (strike.banned) {
        setBanned(true)
        setSpamWarning(`Chat temporarily disabled for ${strike.minutesLeft} minutes due to repeated violations.`)
      } else {
        setSpamWarning(getWarningMessage(result.severity) + (strike.strikesLeft <= 1 ? ' ⚠️ Last warning before temporary ban.' : ` (${strike.strikesLeft} warning${strike.strikesLeft > 1 ? 's' : ''} left)`))
      }
      setTimeout(() => setSpamWarning(''), 5000)
      return
    }
    const newMsg = { from: 'user', text: input.trim(), time: new Date() }
    const updated = [...messages, newMsg]
    setMessages(updated)
    persistMessages(updated)
    setInput('')
    // Simulate owner reply
    setTimeout(() => {
      const replies = [
        'Yes, the bike is available! Would you like to book?',
        'Sure, I can deliver to your hotel. Just confirm the dates.',
        'The price includes 2 helmets and a raincoat.',
        'Yes, it\'s in great condition. Recently serviced.',
        'I can do a small discount for weekly rental.',
      ]
      const replyMsg = { from: 'owner', text: replies[Math.floor(Math.random() * replies.length)], time: new Date() }
      setMessages(prev => {
        const all = [...prev, replyMsg]
        persistMessages(all)
        return all
      })
    }, 1500)
  }

  if (!listing) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: "#000 url('https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledbbbcdfsdf.png') center / cover no-repeat", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Ref: {refNum} · {fmtPrice(listing.price_day || listing.buy_now || 0)}{listing.price_day ? '/day' : ''}</div>
        </div>
        <button
          onClick={() => {
            if (whatsappShared) return
            setWhatsappShared(true)
            const shareMsg = { from: 'system', text: `✅ WhatsApp shared! The seller's WhatsApp number is now available.\n\n📱 +62 812-XXXX-XXXX\n\n10% commission applies to this transaction.`, time: new Date() }
            setMessages(prev => { const all = [...prev, shareMsg]; persistMessages(all); return all })
          }}
          style={{ padding: '6px 10px', background: whatsappShared ? 'rgba(37,211,102,0.15)' : '#25D366', border: whatsappShared ? '1px solid rgba(37,211,102,0.3)' : 'none', borderRadius: 10, color: whatsappShared ? '#25D366' : '#fff', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          {whatsappShared ? 'Shared' : 'WhatsApp'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
              background: msg.from === 'system' ? 'rgba(141,198,63,0.08)' : msg.from === 'user' ? '#8DC63F' : 'rgba(255,255,255,0.06)',
              border: msg.from === 'system' ? '1px solid rgba(141,198,63,0.15)' : 'none',
              borderBottomRightRadius: msg.from === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.from === 'owner' ? 4 : 16,
            }}>
              {msg.image && <img src={msg.image} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />}
              {msg.from === 'owner' && <div style={{ fontSize: 9, fontWeight: 700, color: '#FFD700', marginBottom: 4 }}>Owner</div>}
              <div style={{ fontSize: 13, fontWeight: 500, color: msg.from === 'user' ? '#000' : msg.from === 'system' ? 'rgba(141,198,63,0.7)' : 'rgba(255,255,255,0.7)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{msg.text}</div>
              <div style={{ fontSize: 8, color: msg.from === 'user' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.15)', marginTop: 4, textAlign: 'right' }}>{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Spam warning */}
      {spamWarning && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{spamWarning}</span>
        </div>
      )}

      {/* Banned notice */}
      {banned && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', borderTop: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>Chat disabled — too many violations. Try again in 15 minutes.</span>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, flexShrink: 0 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={sendMessage} style={{ width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

// Booking Flow — professional form with live pricing
export function RentalBookingFlow({ listing, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [days, setDays] = useState(1)
  const [pickupDate, setPickupDate] = useState('')
  const [notes, setNotes] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [wantDelivery, setWantDelivery] = useState(false)
  const [wantAirport, setWantAirport] = useState(false)
  const [wantDriver, setWantDriver] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [step, setStep] = useState(0) // 0: form, 1: processing, 2: confirmed
  const [bookingRef] = useState(() => 'IND-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000))

  if (!listing) return null

  // Check if business is likely closed (after 9pm or before 7am)
  const hour = new Date().getHours()
  const isClosed = hour >= 21 || hour < 7

  const pricePerDay = Number(String(listing.price_day).replace(/\./g, '')) || 0
  const pricePerWeek = Number(String(listing.price_week).replace(/\./g, '')) || 0
  const pricePerMonth = Number(String(listing.price_month).replace(/\./g, '')) || 0
  const rentalTotal = days >= 30 && pricePerMonth ? Math.round(pricePerMonth * (days / 30)) : days >= 7 && pricePerWeek ? Math.round(pricePerWeek * (days / 7)) : pricePerDay * days
  const rateUsed = days >= 30 && pricePerMonth ? 'monthly' : days >= 7 && pricePerWeek ? 'weekly' : 'daily'
  const ef = listing.extra_fields || {}
  const hasDelivery = ef.delivery
  const hasAirport = ef.airportDropoff
  const hasDriver = ef.withDriver
  const deliveryPrice = ef.deliveryFee === 'Free' ? 0 : Number(String(ef.deliveryFee || '0').replace(/\./g, ''))
  const airportPrice = ef.airportFee === 'Free' ? 0 : Number(String(ef.airportFee || '0').replace(/\./g, ''))
  const driverPrice = Number(String(ef.driverFee || '0').replace(/\./g, '')) * days
  const addOnsTotal = (wantDelivery ? deliveryPrice : 0) + (wantAirport ? airportPrice : 0) + (wantDriver ? driverPrice : 0)
  const isBuyMode = !!listing._buyMode
  const buyPrice = typeof listing.buy_now === 'object' ? Number(String(listing.buy_now.price || '0').replace(/\./g, '')) : Number(String(listing.buy_now || '0').replace(/\./g, ''))
  const total = isBuyMode ? buyPrice : rentalTotal + addOnsTotal
  const canSubmit = name.trim() && whatsapp.trim() && (isBuyMode || pickupDate)
  const inputStyle = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsadasdadsaa.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 400, maxHeight: '92vh', overflowY: 'auto',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,215,0,0.15)', borderRadius: 22,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.08), 0 0 60px rgba(255,215,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
        scrollbarWidth: 'none', position: 'relative', zIndex: 1,
      }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', zIndex: 2, borderRadius: '22px 22px 0 0' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: isBuyMode ? '#FFD700' : '#fff' }}>{isBuyMode ? 'Purchase Inquiry' : 'Booking Request'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{isBuyMode ? 'Interested in buying this vehicle' : 'Complete your details to proceed'}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {step === 0 && (<>
        <div style={{ padding: '14px 16px 18px' }}>
          {/* Vehicle card */}
          <div style={{ display: 'flex', gap: 12, padding: '14px', background: 'rgba(141,198,63,0.03)', borderRadius: 16, border: '1px solid rgba(141,198,63,0.1)', marginBottom: 16 }}>
            {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>📍 {listing.city || 'Indonesia'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ padding: '2px 8px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{listing.sub_category || listing.category}</span>
                {listing.extra_fields?.withDriver && <span style={{ padding: '2px 8px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>🚗 Driver</span>}
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" style={{ ...inputStyle, borderColor: showErrors && !name.trim() ? '#EF4444' : 'rgba(255,255,255,0.08)' }} />
              {showErrors && !name.trim() && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, marginTop: 4, display: 'block' }}>Name is required</span>}
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>WhatsApp <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" type="tel" style={{ ...inputStyle, borderColor: showErrors && !whatsapp.trim() ? '#EF4444' : 'rgba(255,255,255,0.08)' }} />
              {showErrors && !whatsapp.trim() && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, marginTop: 4, display: 'block' }}>WhatsApp number is required</span>}
            </div>

            {/* Buy mode: show price */}
            {isBuyMode && (
              <div style={{ padding: '14px', background: 'rgba(255,215,0,0.04)', borderRadius: 14, border: '1px solid rgba(255,215,0,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.5)', marginBottom: 4 }}>ASKING PRICE</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#FFD700' }}>{fmtPrice(buyPrice)}</div>
                {typeof listing.buy_now === 'object' && listing.buy_now.negotiable && <div style={{ fontSize: 11, color: 'rgba(255,215,0,0.4)', marginTop: 4, fontWeight: 600 }}>Price is negotiable</div>}
              </div>
            )}

            {/* Rental fields — only in rent mode */}
            {!isBuyMode && <>
            {/* Pickup date — calendar */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Pickup Date <span style={{ color: '#EF4444' }}>*</span></label>
              <button onClick={() => setShowCalendar(true)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderColor: showErrors && !pickupDate ? '#EF4444' : 'rgba(255,255,255,0.08)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pickupDate ? '#8DC63F' : 'rgba(255,255,255,0.25)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{ color: pickupDate ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 14 }}>{pickupDate || 'Select date from calendar'}</span>
              </button>
              {showErrors && !pickupDate && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, marginTop: 4, display: 'block' }}>Pickup date is required</span>}
            </div>

            {/* Calendar popup */}
            <RentalCalendar
              open={showCalendar}
              onClose={() => setShowCalendar(false)}
              listingRef={listing.ref || listing.id}
              listingTitle={listing.title}
              mode="view"
              onSelectDate={(date) => { setPickupDate(date); setShowCalendar(false) }}
            />

            {/* Duration + live price */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Rental Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setDays(Math.max(1, days - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', minWidth: 30, textAlign: 'center' }}>{days}</span>
                <button onClick={() => setDays(days + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>day{days > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Add-on services */}
            {(hasDelivery || hasAirport || hasDriver) && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}>Additional Services</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {hasDelivery && (
                    <button onClick={() => setWantDelivery(!wantDelivery)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: wantDelivery ? 'rgba(141,198,63,0.06)' : 'rgba(255,255,255,0.02)', border: wantDelivery ? '1.5px solid rgba(141,198,63,0.2)' : '1.5px solid rgba(255,255,255,0.06)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🏨</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: wantDelivery ? '#fff' : 'rgba(255,255,255,0.5)' }}>Hotel / Villa Drop Off</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{deliveryPrice === 0 ? 'Free' : fmtPrice(deliveryPrice)}</div>
                        </div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: wantDelivery ? '#8DC63F' : 'transparent', border: wantDelivery ? 'none' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {wantDelivery && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </button>
                  )}
                  {hasAirport && (
                    <button onClick={() => setWantAirport(!wantAirport)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: wantAirport ? 'rgba(141,198,63,0.06)' : 'rgba(255,255,255,0.02)', border: wantAirport ? '1.5px solid rgba(141,198,63,0.2)' : '1.5px solid rgba(255,255,255,0.06)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>✈️</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: wantAirport ? '#fff' : 'rgba(255,255,255,0.5)' }}>Airport Drop Off</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{airportPrice === 0 ? 'Free' : fmtPrice(airportPrice)}</div>
                        </div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: wantAirport ? '#8DC63F' : 'transparent', border: wantAirport ? 'none' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {wantAirport && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </button>
                  )}
                  {hasDriver && (
                    <button onClick={() => setWantDriver(!wantDriver)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: wantDriver ? 'rgba(141,198,63,0.06)' : 'rgba(255,255,255,0.02)', border: wantDriver ? '1.5px solid rgba(141,198,63,0.2)' : '1.5px solid rgba(255,255,255,0.06)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🚗</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: wantDriver ? '#fff' : 'rgba(255,255,255,0.5)' }}>With Driver</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{fmtPrice(Number(String(ef.driverFee || '0').replace(/\./g, '')))}/day</div>
                        </div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: wantDriver ? '#8DC63F' : 'transparent', border: wantDriver ? 'none' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {wantDriver && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Included with rental */}
            {(ef.helmets && ef.helmets !== '0') && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.6)' }}>⛑️ {ef.helmets} Helmet{Number(ef.helmets) > 1 ? 's' : ''}</span>
                {ef.insurance && <span style={{ padding: '4px 10px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.6)' }}>🛡️ Insured</span>}
                {ef.phoneHolder && <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>📱 Phone Stand</span>}
                {ef.usbCharger && <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>🔌 USB</span>}
              </div>
            )}

            {/* Price breakdown */}
            <div style={{ padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: 14, border: '1px solid rgba(255,215,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Rental: {fmtPrice(pricePerDay)} × {days} day{days > 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{fmtPrice(rentalTotal)}</span>
              </div>
              {rateUsed !== 'daily' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.5)' }}>✓ {rateUsed} rate applied</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Save {fmtPrice(pricePerDay * days - rentalTotal)}</span>
                </div>
              )}
              {wantDelivery && deliveryPrice > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>🏨 Hotel Drop Off</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmtPrice(deliveryPrice)}</span>
                </div>
              )}
              {wantDelivery && deliveryPrice === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.5)' }}>🏨 Hotel Drop Off</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Free</span>
                </div>
              )}
              {wantAirport && airportPrice > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>✈️ Airport Drop Off</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmtPrice(airportPrice)}</span>
                </div>
              )}
              {wantAirport && airportPrice === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.5)' }}>✈️ Airport Drop Off</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Free</span>
                </div>
              )}
              {wantDriver && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>🚗 Driver × {days} day{days > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmtPrice(driverPrice)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'rgba(255,215,0,0.08)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Estimated Total</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#FFD700' }}>{fmtPrice(total)}</span>
              </div>
            </div>

            </>}

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>{isBuyMode ? 'Message to Seller' : 'Special Requests'} <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Pickup location, helmet size, delivery to hotel..." rows={3} style={{ ...inputStyle, resize: 'none', fontSize: 13 }} />
            </div>
          </div>

          {/* Info */}
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, margin: '14px 0', textAlign: 'center' }}>
            {isBuyMode ? 'Your purchase inquiry will be sent to the owner. They will contact you to discuss the sale.' : 'Your booking request will be sent to the rental company. They will contact you via chat to confirm availability and arrange your rental.'}
          </p>

          {/* Submit */}
          <button onClick={() => {
            if (!canSubmit) { setShowErrors(true); return }
            setStep(1)
            // Save booking
            try {
              const bookings = JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')
              bookings.push({ ref: bookingRef, listing_ref: listing.ref || listing.id, listing_title: listing.title, title: listing.title, image: listing.images?.[0] || listing.image || '', name, whatsapp, days, pickupDate, notes, total, totalPrice: total, status: 'pending', created_at: new Date().toISOString() })
              localStorage.setItem('indoo_rental_bookings', JSON.stringify(bookings))
              // Process commission via wallet
              processCommission('default', 'rentals', bookingRef, total).catch(() => {})
              // Auto-mark booked dates on calendar
              if (pickupDate && days) {
                try {
                  const calKey = `indoo_booked_dates_${listing.ref || listing.id}`
                  const booked = JSON.parse(localStorage.getItem(calKey) || '[]')
                  const start = new Date(pickupDate)
                  for (let d = 0; d < days; d++) {
                    const dt = new Date(start); dt.setDate(dt.getDate() + d)
                    const dateStr = dt.toISOString().split('T')[0]
                    if (!booked.includes(dateStr)) booked.push(dateStr)
                  }
                  localStorage.setItem(calKey, JSON.stringify(booked))
                } catch {}
              }
              // Save notification for seller
              try {
                const notifs = JSON.parse(localStorage.getItem('indoo_notifications') || '[]')
                notifs.unshift({ id: `notif_${Date.now()}`, type: 'booking', title: 'New Booking Request', message: `${name} wants to ${isBuyMode ? 'buy' : 'rent'} "${listing.title}"`, ref: bookingRef, read: false, created_at: new Date().toISOString() })
                localStorage.setItem('indoo_notifications', JSON.stringify(notifs))
              } catch {}
            } catch {}
            setTimeout(() => setStep(2), 4000)
          }} style={{ width: '100%', padding: '15px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isBuyMode ? 'Send Purchase Inquiry' : 'Send Booking Request'}
          </button>

          <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '11px 0', borderRadius: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
        </>)}

        {/* ═══ STEP 1: Processing ═══ */}
        {step === 1 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <style>{`@keyframes bookPing { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0; } 100% { transform: scale(1); opacity: 0; } } @keyframes bookDot { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #8DC63F', animation: 'bookPing 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.3)', animation: 'bookPing 2s ease-in-out infinite 0.5s' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📋</div>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Booking Processing</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>Please wait...</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: `bookDot 1.4s ease-in-out infinite ${i * 0.16}s` }} />)}
            </div>
            <p style={{ fontSize: 10, color: 'rgba(141,198,63,0.4)', marginTop: 16, fontWeight: 600 }}>REF: {bookingRef}</p>
          </div>
        )}

        {/* ═══ STEP 2: Confirmed ═══ */}
        {step === 2 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <style>{`@keyframes confirmIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
            <div style={{ animation: 'confirmIn 0.5s ease' }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(141,198,63,0.4)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Booking Request Sent</h2>

              {isClosed ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  The rental company is currently closed. Your booking has been received and they will contact you when the office reopens.
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Your booking has been sent to the rental company. They will be in contact shortly to confirm your rental.
                </p>
              )}

              {/* Booking summary */}
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#8DC63F', letterSpacing: '0.04em' }}>BOOKING REF</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#FFD700', letterSpacing: '0.02em' }}>{bookingRef}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '6px 0' }} />
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{listing.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>📍 {listing.city || 'Indonesia'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>📅 {pickupDate} · {days} day{days > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>👤 {name} · 📱 {whatsapp}</div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Estimated Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{fmtPrice(total)}</span>
                </div>
              </div>

              {isClosed && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700' }}>🕐 Office hours: 07:00 - 21:00</span>
                </div>
              )}

              <button onClick={() => { onConfirm?.({ ref: bookingRef, name, whatsapp, days, pickupDate, notes, total }); onClose() }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
