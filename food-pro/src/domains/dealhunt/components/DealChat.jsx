/**
 * DealChat — Anonymous buyer-seller chat for Deal Hunt
 * Full-screen portal chat window. No personal details shared until buyer opts in.
 * Matches IndooChat glass bubble design with INDOO HQ system messages.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090'
const INDOO_LOGO = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2012_04_23%20PM.png'

function fmtRp(n) { return `Rp${(n ?? 0).toLocaleString('id-ID')}` }

function getUniqueUserId() {
  let uid = localStorage.getItem('indoo_deal_uid')
  if (!uid) {
    uid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('indoo_deal_uid', uid)
  }
  return uid
}

const SELLER_AUTO_REPLIES = [
  'Thanks for your interest!',
  'Yes this item is available',
  'Would you like to see more photos?',
  'Let me know if you have any questions',
  'I can offer free delivery for this deal',
  'This is our best seller!',
  'We can arrange pickup or delivery',
]

export default function DealChat({ deal, onClose }) {
  const uid = useRef(getUniqueUserId()).current
  const chatKey = `indoo_deal_chat_${deal.id}_${uid}`

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [contactShared, setContactShared] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showShareConfirm, setShowShareConfirm] = useState(false)
  const scrollRef = useRef(null)
  const replyIndexRef = useRef(0)
  const hasBothChatted = useRef(false)

  // Load messages from localStorage or init with system welcome
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(chatKey) || '[]')
    if (stored.length > 0) {
      setMessages(stored)
      // Check if contact was already shared
      const shared = stored.some(m => m.type === 'contact-shared')
      if (shared) setContactShared(true)
      // Check if both have chatted
      const buyerMsg = stored.some(m => m.from === 'buyer')
      const sellerMsg = stored.some(m => m.from === 'seller')
      hasBothChatted.current = buyerMsg && sellerMsg
    } else {
      const welcomeMsg = {
        id: Date.now(),
        from: 'system',
        type: 'welcome',
        text: `You've expressed interest in ${deal.title} at the locked price of ${fmtRp(deal.deal_price)}. The seller has been notified.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }
      const initial = [welcomeMsg]
      setMessages(initial)
      localStorage.setItem(chatKey, JSON.stringify(initial))
    }
  }, [chatKey, deal.title, deal.deal_price])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  // Send buyer message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return
    const msg = {
      id: Date.now(),
      from: 'buyer',
      text: input.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [...messages, msg]
    setMessages(updated)
    localStorage.setItem(chatKey, JSON.stringify(updated))
    setInput('')

    // Demo seller auto-reply after short delay
    const replyIdx = replyIndexRef.current
    replyIndexRef.current = (replyIdx + 1) % SELLER_AUTO_REPLIES.length
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        from: 'seller',
        text: SELLER_AUTO_REPLIES[replyIdx],
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }
      const withReply = [...updated, reply]
      setMessages(withReply)
      localStorage.setItem(chatKey, JSON.stringify(withReply))
      hasBothChatted.current = true
    }, 1200 + Math.random() * 1500)
  }, [input, messages, chatKey])

  // Share contact details
  const handleShareContact = useCallback(() => {
    const profile = JSON.parse(localStorage.getItem('indoo_demo_profile') || localStorage.getItem('indoo_profile') || '{}')
    const buyerName = profile.display_name || profile.name || 'Buyer'
    const phone = profile.phone || profile.whatsapp || '081234567890'

    const contactMsg = {
      id: Date.now(),
      from: 'system',
      type: 'contact-shared',
      text: `\ud83d\udcf1 ${buyerName} has shared their contact: ${phone}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [...messages, contactMsg]
    setMessages(updated)
    localStorage.setItem(chatKey, JSON.stringify(updated))
    setContactShared(true)
    setShowShareConfirm(false)
  }, [messages, chatKey])

  const discount = deal.original_price
    ? Math.round((1 - deal.deal_price / deal.original_price) * 100)
    : 0

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10020,
      backgroundColor: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Background image */}
      <img
        src={BG_IMG}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0, opacity: 0.6 }}
      />

      {/* ── Header ── */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, position: 'relative', zIndex: 1,
      }}>
        {/* Seller avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '2px solid #FACC15', overflow: 'hidden', flexShrink: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}>
          <img
            src={deal.seller_photo || `https://i.pravatar.cc/100?img=${(deal.seller_name ?? 'S').charCodeAt(0) % 50 + 1}`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Deal info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 15, fontWeight: 900, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {deal.title}
            </span>
            {discount > 0 && (
              <span style={{
                backgroundColor: '#FACC15', color: '#000',
                padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 900,
                flexShrink: 0,
              }}>
                -{discount}%
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>
            {fmtRp(deal.deal_price)}
          </span>
        </div>

        {/* Info icon */}
        <button
          onClick={() => setShowInfo(true)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            padding: '10px 18px', borderRadius: 12,
            background: '#8DC63F', border: 'none',
            color: '#000', fontSize: 14, fontWeight: 900,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          Close
        </button>
      </div>

      {/* Done Deal badge — shown when both parties chatted */}
      {hasBothChatted.current && (
        <div style={{
          background: 'rgba(141,198,63,0.08)',
          borderBottom: '1px solid rgba(141,198,63,0.15)',
          padding: '7px 16px', flexShrink: 0,
          position: 'relative', zIndex: 1, textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{
            fontSize: 12, fontWeight: 900, color: '#8DC63F',
            letterSpacing: '0.04em',
          }}>
            Done Deal — Discussing at locked price {fmtRp(deal.deal_price)}
          </span>
        </div>
      )}

      {/* Secured notice */}
      <div style={{
        background: 'rgba(141,198,63,0.06)',
        borderBottom: '1px solid rgba(141,198,63,0.1)',
        padding: '7px 16px', flexShrink: 0,
        position: 'relative', zIndex: 1, textAlign: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.5)' }}>
          Anonymous chat — your details are private until you share
        </span>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
          position: 'relative', zIndex: 1,
        }}
      >
        {messages.map(msg => {
          const isBuyer = msg.from === 'buyer'
          const isSystem = msg.from === 'system'
          const isSeller = msg.from === 'seller'
          const isContactMsg = msg.type === 'contact-shared'

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isBuyer ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: 6,
              }}
            >
              {/* Seller avatar */}
              {isSeller && (
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
                  flexShrink: 0, border: '1.5px solid rgba(250,204,21,0.4)',
                }}>
                  <img
                    src={deal.seller_photo || `https://i.pravatar.cc/60?img=${(deal.seller_name ?? 'S').charCodeAt(0) % 50 + 1}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* System/INDOO avatar */}
              {isSystem && (
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
                  flexShrink: 0, border: '1.5px solid rgba(141,198,63,0.4)',
                  background: '#111',
                }}>
                  <img src={INDOO_LOGO} alt="INDOO" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                background: isBuyer
                  ? '#8DC63F'
                  : isSystem
                    ? (isContactMsg ? 'rgba(250,204,21,0.1)' : 'rgba(141,198,63,0.08)')
                    : 'rgba(0,0,0,0.55)',
                border: isSystem
                  ? (isContactMsg ? '1px solid rgba(250,204,21,0.25)' : '1px solid rgba(141,198,63,0.15)')
                  : isSeller
                    ? '1px solid rgba(250,204,21,0.15)'
                    : 'none',
                borderBottomRightRadius: isBuyer ? 4 : 16,
                borderBottomLeftRadius: isBuyer ? 16 : 4,
              }}>
                {isSystem && (
                  <span style={{
                    fontSize: 10, fontWeight: 900,
                    color: isContactMsg ? '#FACC15' : '#8DC63F',
                    display: 'block', marginBottom: 4, letterSpacing: '0.05em',
                  }}>
                    {isContactMsg ? 'CONTACT SHARED' : 'INDOO HQ'}
                  </span>
                )}
                {isSeller && (
                  <span style={{
                    fontSize: 10, fontWeight: 900, color: '#FACC15',
                    display: 'block', marginBottom: 4, letterSpacing: '0.05em',
                  }}>
                    {deal.seller_name || 'SELLER'}
                  </span>
                )}
                <span style={{
                  fontSize: 14, display: 'block', lineHeight: 1.4,
                  color: isBuyer ? '#000' : '#fff',
                  whiteSpace: 'pre-line',
                }}>
                  {msg.text}
                </span>
                <span style={{
                  fontSize: 10, display: 'block', marginTop: 4, textAlign: 'right',
                  color: isBuyer ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
                }}>
                  {msg.time}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Share Contact + Input area ── */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        {/* Share Contact button (only shown if not yet shared) */}
        {!contactShared && (
          <div style={{
            padding: '8px 16px 0',
          }}>
            <button
              onClick={() => setShowShareConfirm(true)}
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 14,
                backgroundColor: 'rgba(141,198,63,0.12)',
                border: '1.5px solid rgba(141,198,63,0.3)',
                color: '#8DC63F', fontSize: 14, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Share My Contact Details
            </button>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 10,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 24,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: '#8DC63F', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Share Contact Confirmation Popup ── */}
      {showShareConfirm && (
        <div
          onClick={() => setShowShareConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10030,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 340,
              backgroundColor: 'rgba(20,20,20,0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: 24,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>{'\ud83d\udcf1'}</span>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
                Share Your Contact?
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                Share your WhatsApp number and name with the seller?
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowShareConfirm(false)}
                style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleShareContact}
                style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  backgroundColor: '#8DC63F', border: 'none',
                  color: '#000', fontSize: 14, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Info Popup — How Deal Hunt Works ── */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10030,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 360,
              backgroundColor: 'rgba(20,20,20,0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: 24,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{
              fontSize: 17, fontWeight: 900, color: '#fff',
              margin: '0 0 16px', textAlign: 'center',
            }}>
              How Deal Hunt Works
            </h3>

            {[
              { icon: '\ud83c\udfaf', title: 'Connect Locally', desc: 'Deal Hunt connects local businesses with buyers at locked discount prices.' },
              { icon: '\ud83d\udd12', title: 'Chat Anonymously', desc: 'Chat anonymously — no personal details are shared until you choose.' },
              { icon: '\ud83d\udcf1', title: 'Share When Ready', desc: "When you're confident, tap 'Share Contact' to exchange details with the seller." },
              { icon: '\u2705', title: 'Complete Off-App', desc: 'Complete your deal directly with the seller off the app.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 14,
                padding: '10px 12px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.2 }}>{item.icon}</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 2 }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowInfo(false)}
              style={{
                width: '100%', padding: 14, borderRadius: 14,
                backgroundColor: '#8DC63F', border: 'none',
                color: '#000', fontSize: 14, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', marginTop: 6,
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
