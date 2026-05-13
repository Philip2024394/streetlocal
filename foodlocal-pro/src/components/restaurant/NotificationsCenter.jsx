// Notifications Center — per-event channel preferences + quiet hours.
// Persists to restaurants.notification_prefs (jsonb).
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'dark' }

const EVENTS = [
  { id: 'new_order',        label: 'New order',          desc: 'Customer just placed an order.' },
  { id: 'payment_paid',     label: 'Payment confirmed',  desc: 'Webhook says the order was paid.' },
  { id: 'payment_failed',   label: 'Payment failed',     desc: 'Customer\'s payment failed or expired.' },
  { id: 'refund_requested', label: 'Refund requested',   desc: 'Customer asked for a refund.' },
  { id: 'review_posted',    label: 'New review',         desc: 'Customer left a review.' },
  { id: 'low_stock',        label: 'Low stock alert',    desc: 'A menu item is running low (< 5 left).' },
  { id: 'subscription_renew',label: 'Subscription renew',desc: 'Your FoodLocal Pro plan is due for renewal.' },
]
const CHANNELS = [
  { id: 'sound',    label: '🔔', long: 'Sound' },
  { id: 'push',     label: '📲', long: 'Push' },
  { id: 'whatsapp', label: '💬', long: 'WhatsApp' },
  { id: 'email',    label: '✉️',  long: 'Email' },
]

const DEFAULT_PREFS = {
  new_order:        { sound: true,  push: true,  whatsapp: false, email: false },
  payment_paid:     { sound: false, push: true,  whatsapp: true,  email: false },
  payment_failed:   { sound: false, push: true,  whatsapp: false, email: false },
  refund_requested: { sound: false, push: true,  whatsapp: false, email: true  },
  review_posted:    { sound: false, push: false, whatsapp: false, email: true  },
  low_stock:        { sound: false, push: true,  whatsapp: false, email: false },
  subscription_renew:{ sound: false,push: true,  whatsapp: true,  email: true  },
  quiet_from: '',
  quiet_to:   '',
  wa_target:  '',
  email_target: '',
}

export default function NotificationsCenter({ restaurant, onBack }) {
  const [p, setP] = useState(DEFAULT_PREFS)
  const [msg, setMsg] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!supabase || !restaurant?.id) return
    let cancelled = false
    supabase.from('restaurants').select('notification_prefs, phone').eq('id', restaurant.id).single()
      .then(({ data }) => {
        if (cancelled || !data) return
        const merged = { ...DEFAULT_PREFS, ...(data.notification_prefs || {}) }
        if (!merged.wa_target && data.phone) merged.wa_target = data.phone
        setP(merged)
      }).catch(() => {})
    return () => { cancelled = true }
  }, [restaurant?.id])

  const setChannel = (event, channel, value) => {
    setP(prev => ({ ...prev, [event]: { ...prev[event], [channel]: value } }))
    setDirty(true)
  }
  const setField = (k, v) => { setP(prev => ({ ...prev, [k]: v })); setDirty(true) }

  const save = async () => {
    if (!supabase || !restaurant?.id) { setMsg('Saved locally.'); setTimeout(() => setMsg(''), 1500); return }
    setMsg('Saving…')
    const { error } = await supabase.from('restaurants').update({ notification_prefs: p }).eq('id', restaurant.id)
    setMsg(error ? `Save failed: ${error.message}` : 'Saved.')
    if (!error) setDirty(false)
    setTimeout(() => setMsg(''), 1800)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>Notifications</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>How you want to be notified</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Pick the channels per event. Quiet hours mute everything except <strong>new order</strong> and <strong>payment paid</strong>.</div>
      </div>

      {/* Event matrix */}
      {EVENTS.map(ev => (
        <div key={ev.id} style={card}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{ev.label}</span>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{ev.desc}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {CHANNELS.map(ch => {
              const active = !!p[ev.id]?.[ch.id]
              return (
                <button key={ch.id} onClick={() => setChannel(ev.id, ch.id, !active)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? BRAND.red : 'rgba(255,255,255,0.05)',
                  color: '#fff', fontSize: 11, fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                  <span style={{ fontSize: 16 }}>{ch.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.85 }}>{ch.long}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Targets + quiet hours */}
      <div style={card}>
        <span style={label}>WhatsApp target number</span>
        <input value={p.wa_target || ''} onChange={e => setField('wa_target', e.target.value)} placeholder="6281234567890" style={input} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>WhatsApp notifications go here. Defaults to your restaurant phone if empty.</div>

        <div style={{ height: 14 }} />
        <span style={label}>Email target</span>
        <input type="email" value={p.email_target || ''} onChange={e => setField('email_target', e.target.value)} placeholder="orders@yourshop.com" style={input} />
      </div>

      <div style={card}>
        <span style={label}>Quiet hours</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="time" value={p.quiet_from || ''} onChange={e => setField('quiet_from', e.target.value)} style={{ ...input, flex: 1 }} />
          <span style={{ color: 'rgba(255,255,255,0.45)' }}>→</span>
          <input type="time" value={p.quiet_to || ''} onChange={e => setField('quiet_to', e.target.value)} style={{ ...input, flex: 1 }} />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>During quiet hours we only ring for incoming orders and payment confirmations. Everything else is queued silently.</div>
      </div>

      {msg && <div style={{ padding: 10, borderRadius: 12, fontSize: 13, color: '#fff', textAlign: 'center', background: msg.toLowerCase().includes('fail') ? 'rgba(239,68,68,0.15)' : BRAND.redGlow, border: msg.toLowerCase().includes('fail') ? '1px solid rgba(239,68,68,0.3)' : `1px solid ${BRAND.redBorder}`, marginBottom: 12 }}>{msg}</div>}
      <button onClick={save} disabled={!dirty} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: BRAND.red, color: '#fff', fontSize: 15, fontWeight: 900, cursor: dirty ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.5 }}>{dirty ? 'Save Preferences' : 'No changes'}</button>
    </>
  )
}
