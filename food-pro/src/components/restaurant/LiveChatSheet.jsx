/**
 * LiveChatSheet — INDOO Support chat window.
 * Same chat design as driver trip chat.
 * Opens directly to chat — no issue type badges.
 * Auto-greeting from INDOO Team.
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuthContext } from '@/contexts/AuthContext'

const CHAT_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090'
const TEAM_PHOTO = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2012_04_23%20PM.png?updatedAt=1777266283038'

function generateTicketNumber() {
  return Math.floor(Math.random() * 9000) + 1000
}

export default function LiveChatSheet({ order, onClose }) {
  const { user, userProfile } = useAuthContext()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [ticketNumber] = useState(() => generateTicketNumber())
  const [ticketOpened, setTicketOpened] = useState(false)
  const chatRef = useRef(null)
  const fileRef = useRef(null)
  const greetedRef = useRef(false)

  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const userName = userProfile?.display_name || user?.email?.split('@')[0] || 'User'
  const userPhoto = userProfile?.photo_url || null

  // Check if user is verified
  const isVerified = user && userProfile?.display_name && (userProfile?.ktp_status === 'approved' || userProfile?.email_verified || userProfile?.phone)
  const isGuest = !user

  // Verification gate
  if (isGuest || !isVerified) {
    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9950, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledfsdsss.png?updatedAt=1777336271626)', backgroundSize: 'cover', backgroundPosition: 'center' }} />

        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: '100%', maxWidth: 340, padding: 28, borderRadius: 20,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255,255,255,0.08)', textAlign: 'center',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(250,204,21,0.1)', border: '2px solid rgba(250,204,21,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
              🔒
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
              {isGuest ? 'Account Required' : 'Verification Required'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              {isGuest
                ? 'You need to create an account and complete verification to contact INDOO Support.'
                : 'Please complete your account verification to access INDOO Support. This helps us protect our community.'
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={onClose} style={{
                width: '100%', padding: 14, borderRadius: 12,
                background: '#8DC63F', border: 'none', color: '#000',
                fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {isGuest ? 'Create Account' : 'Complete Verification'}
              </button>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                fontSize: 13, cursor: 'pointer', padding: 8, fontFamily: 'inherit',
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, typing])

  // Auto-greet on open
  useEffect(() => {
    if (greetedRef.current) return
    greetedRef.current = true
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages([{
        id: Date.now(),
        from: 'bot',
        text: `Hi ${userName}! 👋 Welcome to INDOO Support. How can we help you today?`,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }])
    }, 800)
  }, [])

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }])
  }

  const handleSend = (quickText) => {
    const text = (quickText || input).trim()
    if (!text && !photoFile) return

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: text || '📷 Photo attached',
      photo: photoFile ? URL.createObjectURL(photoFile) : null,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setPhotoFile(null)

    // First user message — open ticket
    if (!ticketOpened) {
      setTicketOpened(true)
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        addBotMessage(`Thank you for your message. Your support ticket has been opened.\n\n🎫 Ticket #${ticketNumber}\n\nOur team has received your message and will reply soon. Please stay in this chat window.`)
      }, 1500)
      return
    }

    // Subsequent messages — acknowledge receipt
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      addBotMessage(`Your message has been added to Ticket #${ticketNumber}. Our team will review and respond shortly.`)
    }, 1200)
  }

  const botAvatar = (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
      background: '#1a1a1a', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid rgba(141,198,63,0.3)',
    }}>
      <img src={TEAM_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )

  const userAvatar = (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
      background: '#1a1a1a', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid rgba(250,204,21,0.3)',
    }}>
      {userPhoto
        ? <img src={userPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: 11, fontWeight: 800, color: '#FACC15' }}>{userName?.[0]?.toUpperCase() ?? 'U'}</span>
      }
    </div>
  )

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9950, display: 'flex', flexDirection: 'column',
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${CHAT_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)' }} />

      {/* Header — INDOO Team profile on left, close on right */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px',
        margin: '0 8px', marginTop: 8,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(141,198,63,0.3)',
        borderRadius: 18,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        position: 'relative', overflow: 'hidden', zIndex: 2,
      }}>
        {/* Green edge glow */}
        <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.8 }} />
        </div>

        {/* INDOO Team photo */}
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#1a1a1a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(141,198,63,0.4)', flexShrink: 0, position: 'relative' }}>
          <img src={TEAM_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: '#22C55E', border: '2px solid rgba(0,0,0,0.7)' }} />
        </div>

        {/* Name + status + time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>INDOO Team</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E' }}>Online</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{now}</span>
            {order && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>· Order #{order.id?.slice(-6)}</span>}
          </div>
        </div>

        {/* Close button — green */}
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', gap: 8,
            flexDirection: msg.from === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
          }}>
            {msg.from === 'user' ? userAvatar : botAvatar}
            <div style={{
              maxWidth: '72%',
              padding: '12px 16px', borderRadius: 18,
              background: msg.from === 'user' ? '#8DC63F' : 'rgba(0,0,0,0.55)',
              backdropFilter: msg.from === 'user' ? 'none' : 'blur(12px)',
              border: msg.from === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderBottomRightRadius: msg.from === 'user' ? 4 : 18,
              borderBottomLeftRadius: msg.from === 'bot' ? 4 : 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {msg.from === 'bot' && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#8DC63F', display: 'block', marginBottom: 4 }}>INDOO Team</span>
              )}
              {msg.photo && (
                <img src={msg.photo} alt="" style={{ width: '100%', maxWidth: 200, borderRadius: 12, marginBottom: 8, display: 'block' }} />
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: msg.from === 'user' ? '#000' : '#fff', lineHeight: 1.5 }}>{msg.text}</span>
              <span style={{ fontSize: 9, color: msg.from === 'user' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', display: 'block', marginTop: 4, textAlign: 'right' }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {botAvatar}
            <div style={{ padding: '12px 20px', borderRadius: 18, borderBottomLeftRadius: 4, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'dotDance 1.4s ease-in-out infinite' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'dotDance 1.4s ease-in-out 0.2s infinite' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'dotDance 1.4s ease-in-out 0.4s infinite' }} />
            </div>
          </div>
        )}
      </div>


      {/* Input bar */}
      <div style={{
        padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
        position: 'relative', zIndex: 2,
      }}>
        {/* Photo upload */}
        <button onClick={() => fileRef.current?.click()} style={{
          width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, position: 'relative',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          {photoFile && <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a' }} />}
        </button>
        <input type="file" ref={fileRef} accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="Type your message..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={() => handleSend()} style={{
          width: 44, height: 44, borderRadius: '50%', background: '#8DC63F',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      <style>{`
        @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
        @keyframes dotDance { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes ping { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
    </div>,
    document.body
  )
}
