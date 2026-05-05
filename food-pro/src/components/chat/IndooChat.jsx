/**
 * IndooChat — Shared dispatch-style chat window
 * Used across: food delivery, bike rides, car rides, deals
 * Features: INDOO HQ ↔ Driver dispatch comms, customer can message
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090'
const INDOO_LOGO = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2012_04_23%20PM.png'
const BIKE_ICON = 'https://ik.imagekit.io/nepgaxllc/Untitleddsddaa-removebg-preview.png?updatedAt=1776781020066'

export default function IndooChat({ driverName, chatKey, initialMessages = [], onClose }) {
  const [messages, setMessages] = useState(initialMessages.length > 0 ? initialMessages : [])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  // Poll localStorage for new messages posted by journey auto-updates
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(chatKey) || '[]')
        if (stored.length > messages.length) setMessages(stored)
      } catch {}
    }, 1500)
    return () => clearInterval(id)
  }, [chatKey, messages.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const sendMessage = () => {
    if (!input.trim()) return
    const msg = { id: Date.now(), from: 'customer', text: input.trim(), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
    const updated = [...messages, msg]
    setMessages(updated)
    localStorage.setItem(chatKey, JSON.stringify(updated))
    setInput('')
    // Demo driver auto-reply
    setTimeout(() => {
      const replies = ['Siap, kak!', 'Oke, sedang menuju lokasi', 'Baik kak, sebentar lagi sampai', 'Sudah di depan, kak']
      const reply = { id: Date.now() + 1, from: 'driver', text: replies[Math.floor(Date.now() / 1000) % replies.length], time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
      const withReply = [...updated, reply]
      setMessages(withReply)
      localStorage.setItem(chatKey, JSON.stringify(withReply))
    }, 1500)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10010, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #8DC63F', overflow: 'hidden', flexShrink: 0 }}>
          <img src={`https://i.pravatar.cc/100?img=${(driverName ?? 'D').charCodeAt(0) % 50 + 1}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{driverName}</span>
          <span style={{ fontSize: 14, color: '#8DC63F' }}>Driver · Online</span>
        </div>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Close</button>
      </div>

      {/* Monitored notice */}
      <div style={{ background: 'rgba(141,198,63,0.06)', borderBottom: '1px solid rgba(141,198,63,0.1)', padding: '7px 16px', flexShrink: 0, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.5)' }}>🔒 Secured and monitored by INDOO Operations</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.4 }}>
            <span style={{ fontSize: 14, color: '#fff' }}>Dispatch channel loading...</span>
          </div>
        )}
        {messages.map(msg => {
          const isCustomer = msg.from === 'customer'
          const isSystem = msg.from === 'system' || msg.from === 'indoo'
          const isDriver = msg.from === 'driver'

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
              {/* Avatar */}
              {isDriver && (
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #991B1B' }}>
                  <img src={`https://i.pravatar.cc/60?img=${(driverName ?? 'D').charCodeAt(0) % 50 + 1}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {isSystem && (
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(141,198,63,0.4)', background: '#111' }}>
                  <img src={INDOO_LOGO} alt="INDOO" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {/* Bubble */}
              <div style={{
                maxWidth: '75%', padding: (msg.image || msg.imageLeft || msg.imageRight) ? '4px 4px 8px' : '10px 14px', borderRadius: 16,
                background: isCustomer ? '#8DC63F' : isSystem ? 'rgba(141,198,63,0.08)' : 'rgba(0,0,0,0.55)',
                border: isSystem ? '1px solid rgba(141,198,63,0.15)' : isDriver ? '1px solid rgba(153,27,27,0.25)' : 'none',
                borderBottomRightRadius: isCustomer ? 4 : 16,
                borderBottomLeftRadius: isCustomer ? 16 : 4,
              }}>
                {isSystem && <span style={{ fontSize: 10, fontWeight: 900, color: '#8DC63F', display: 'block', marginBottom: 4, letterSpacing: '0.05em', padding: (msg.image || msg.imageLeft || msg.imageRight) ? '6px 10px 0' : 0 }}>INDOO HQ</span>}
                {isDriver && <span style={{ fontSize: 10, fontWeight: 900, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, letterSpacing: '0.05em' }}><img src={BIKE_ICON} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> {msg.callsign ?? 'DRIVER'}</span>}
                {msg.image && (
                  <img src={msg.image} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 6 }} />
                )}
                {(msg.imageLeft || msg.imageRight) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
                    {msg.imageLeft && <img src={msg.imageLeft} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, color: '#fff', flex: 1, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{msg.text}</span>
                    {msg.imageRight && <img src={msg.imageRight} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />}
                  </div>
                ) : !msg.image && (
                  <span style={{ fontSize: 14, color: isCustomer ? '#000' : '#fff', display: 'block', lineHeight: 1.4, whiteSpace: 'pre-line', padding: msg.image ? '0 10px' : 0 }}>{msg.text}</span>
                )}
                <span style={{ fontSize: 10, color: isCustomer ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4, textAlign: 'right', padding: (msg.image || msg.imageLeft || msg.imageRight) ? '0 10px' : 0 }}>{msg.time}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} style={{
          width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>,
    document.body
  )
}
