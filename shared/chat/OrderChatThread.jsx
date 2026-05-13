/**
 * OrderChatThread — minimal customer ↔ vendor thread keyed on an order row.
 *
 * Messages are persisted as a JSONB array on vendor_orders.chat_messages
 * (one source of truth, no extra table). Realtime via Supabase
 * postgres_changes on the row.
 *
 * Both sides (customer + vendor dashboard) mount this with the same
 * orderId; sender_role tells the bubbles apart.
 *
 * Props:
 *   - supabase       Supabase client (required for live mode; falls back to local-only otherwise)
 *   - orderId        uuid of the vendor_orders row
 *   - orderTable     'vendor_orders' | 'food_orders' (defaults to vendor_orders)
 *   - role           'customer' | 'vendor'
 *   - shopName       header label when role='customer'
 *   - customerName   header label when role='vendor'
 *   - onClose        close handler
 *   - accent         brand color (default '#DC2626')
 */
import React, { useEffect, useRef, useState } from 'react'

export default function OrderChatThread({
  supabase, orderId, orderTable = 'vendor_orders', role,
  shopName, customerName, onClose, accent = '#DC2626',
}) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)
  const localOnly = !supabase || !orderId || String(orderId).startsWith('local')

  const fetchMessages = async () => {
    if (localOnly) { setLoading(false); return }
    const { data } = await supabase.from(orderTable).select('chat_messages').eq('id', orderId).single()
    setMessages(Array.isArray(data?.chat_messages) ? data.chat_messages : [])
    setLoading(false)
  }

  useEffect(() => { fetchMessages() }, [orderId])

  useEffect(() => {
    if (localOnly) return
    const ch = supabase.channel(`order-chat:${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: orderTable, filter: `id=eq.${orderId}` }, payload => {
        const next = payload?.new?.chat_messages
        if (Array.isArray(next)) setMessages(next)
      })
      .subscribe()
    channelRef.current = ch
    return () => { try { supabase.removeChannel(ch) } catch {} }
  }, [orderId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    const newMsg = { role, body, at: new Date().toISOString() }
    const next = [...messages, newMsg]
    setMessages(next)
    setText('')
    if (!localOnly) {
      try {
        await supabase.from(orderTable).update({ chat_messages: next }).eq('id', orderId)
      } catch (e) {
        console.warn('chat send failed', e)
        setMessages(messages) // revert
      }
    }
    setSending(false)
  }

  const header = role === 'customer'
    ? (shopName || 'Vendor')
    : (customerName || 'Customer')
  const subline = role === 'customer'
    ? 'Chat with the vendor about your order'
    : 'Chat with the customer'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10015,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px calc(14px + env(safe-area-inset-top, 0px)) 16px',
        background: '#111', borderBottom: `1px solid ${accent}33`,
      }}>
        <button onClick={onClose} style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#fff', fontSize: 18, cursor: 'pointer',
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{header}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{subline} · #{String(orderId).slice(-6)}</div>
        </div>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {loading && <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13, marginTop: 30 }}>Loading…</div>}
        {!loading && messages.length === 0 && (
          <div style={{
            padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)',
            border: '1px dashed rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)',
            fontSize: 13, textAlign: 'center', lineHeight: 1.5, marginTop: 30,
          }}>
            {role === 'customer'
              ? 'Send the vendor a message about your order — delivery time, instructions, anything.'
              : 'Reply to the customer here. They\'ll see it the moment you send.'}
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.role === role
          return (
            <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                background: mine ? accent : 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 14, lineHeight: 1.45,
                borderBottomRightRadius: mine ? 4 : 16,
                borderBottomLeftRadius:  mine ? 16 : 4,
              }}>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                <div style={{ fontSize: 10, color: mine ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' }}>
                  {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
        background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Type a message"
          style={{
            flex: 1, padding: '12px 14px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
            color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{
          width: 44, height: 44, borderRadius: 22, border: 'none',
          background: accent, color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer',
          opacity: text.trim() ? 1 : 0.5,
        }}>›</button>
      </div>
    </div>
  )
}
