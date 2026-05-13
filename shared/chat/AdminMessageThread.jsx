/**
 * AdminMessageThread — two-way thread between StreetLocal admin (2bee)
 * and a vendor in one of the 4 React apps. Mirrors OrderChatThread.jsx
 * but is keyed on vendor_id and uses its own table
 * `admin_vendor_messages` (one row per message).
 *
 * Realtime via Supabase postgres_changes on the table, filtered by
 * vendor_id. Each side flags read state on the messages it observes
 * (admin marks `read_by_admin=true` for inbound vendor messages, and
 * vice versa) as soon as the thread is mounted.
 *
 * Props:
 *   - supabase   Supabase client (required; falls back to local-only otherwise)
 *   - vendorId   uuid of vendor_accounts.id
 *   - role       'admin' | 'vendor'
 *   - vendorName header label (optional)
 *   - onClose    close handler
 *   - accent     brand color (default '#FFD700' — StreetLocal gold)
 */
import React, { useEffect, useRef, useState } from 'react'

export default function AdminMessageThread({
  supabase, vendorId, role, vendorName, onClose, accent = '#FFD700',
}) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)
  const localOnly = !supabase || !vendorId || String(vendorId).startsWith('local')

  // Mark inbound messages as read for whichever side just opened the thread.
  const markRead = async (rows) => {
    if (localOnly || !Array.isArray(rows) || rows.length === 0) return
    try {
      if (role === 'admin') {
        const ids = rows.filter(m => m.sender === 'vendor' && !m.read_by_admin).map(m => m.id)
        if (ids.length) await supabase.from('admin_vendor_messages').update({ read_by_admin: true }).in('id', ids)
      } else {
        const ids = rows.filter(m => m.sender === 'admin' && !m.read_by_vendor).map(m => m.id)
        if (ids.length) await supabase.from('admin_vendor_messages').update({ read_by_vendor: true }).in('id', ids)
      }
    } catch (e) { /* best-effort */ }
  }

  const fetchMessages = async () => {
    if (localOnly) { setLoading(false); return }
    const { data } = await supabase
      .from('admin_vendor_messages')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: true })
    const rows = Array.isArray(data) ? data : []
    setMessages(rows)
    setLoading(false)
    markRead(rows)
  }

  useEffect(() => { fetchMessages() }, [vendorId])

  useEffect(() => {
    if (localOnly) return
    const ch = supabase.channel(`admin-vendor-chat:${vendorId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'admin_vendor_messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, payload => {
        const row = payload?.new
        if (!row) return
        setMessages(prev => {
          if (prev.some(m => m.id === row.id)) return prev
          return [...prev, row]
        })
        // If a message from the other side arrives while we're looking, mark
        // it read right away so the badge clears.
        markRead([row])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'admin_vendor_messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, payload => {
        const row = payload?.new
        if (!row) return
        setMessages(prev => prev.map(m => m.id === row.id ? row : m))
      })
      .subscribe()
    channelRef.current = ch
    return () => { try { supabase.removeChannel(ch) } catch {} }
  }, [vendorId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    // optimistic
    const tempId = `tmp-${Date.now()}`
    const optimistic = {
      id: tempId, vendor_id: vendorId, sender: role, body,
      read_by_vendor: role === 'vendor',
      read_by_admin:  role === 'admin',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    if (!localOnly) {
      try {
        const { data, error } = await supabase
          .from('admin_vendor_messages')
          .insert({
            vendor_id: vendorId,
            sender: role,
            body,
            // inbound message is unread for the other side
            read_by_admin: role === 'admin',
            read_by_vendor: role === 'vendor',
          })
          .select('*')
          .single()
        if (error) throw error
        // swap optimistic with real row
        setMessages(prev => prev.map(m => m.id === tempId ? data : m))
      } catch (e) {
        console.warn('admin chat send failed', e)
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setText(body)
      }
    }
    setSending(false)
  }

  const header = vendorName || (role === 'admin' ? 'Vendor' : 'StreetLocal Admin')
  const subline = role === 'admin'
    ? 'Two-way chat with the vendor (replaces WhatsApp)'
    : 'Chat with StreetLocal support'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10020,
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
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{subline}</div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: accent, boxShadow: `0 0 8px ${accent}`,
        }} title="Live" />
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
            {role === 'admin'
              ? 'Start the conversation. Vendors see this in their app inbox the moment you send.'
              : 'Send a message to StreetLocal support — we usually reply within a few hours.'}
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.sender === role
          return (
            <div key={m.id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                background: mine ? accent : 'rgba(255,255,255,0.08)',
                color: mine ? '#1a1a1a' : '#fff', fontSize: 14, lineHeight: 1.45,
                borderBottomRightRadius: mine ? 4 : 16,
                borderBottomLeftRadius:  mine ? 16 : 4,
                fontWeight: mine ? 600 : 500,
              }}>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                <div style={{ fontSize: 10, color: mine ? 'rgba(26,26,26,0.6)' : 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          placeholder={role === 'admin' ? 'Message vendor…' : 'Message StreetLocal…'}
          style={{
            flex: 1, padding: '12px 14px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
            color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{
          width: 44, height: 44, borderRadius: 22, border: 'none',
          background: accent, color: '#1a1a1a', fontSize: 18, fontWeight: 900, cursor: 'pointer',
          opacity: text.trim() ? 1 : 0.5,
        }}>›</button>
      </div>
    </div>
  )
}
