import { useState } from 'react'
import styles from './ContactShareSheet.module.css'

const CONTACT_OPTIONS = [
  { id: 'phone',     label: 'Phone Number', icon: '📱', placeholder: '+44 7700 900 000' },
  { id: 'instagram', label: 'Instagram',    icon: '📸', placeholder: '@username' },
  { id: 'snapchat',  label: 'Snapchat',     icon: '👻', placeholder: 'username' },
  { id: 'tiktok',    label: 'TikTok',       icon: '🎵', placeholder: '@username' },
  { id: 'facebook',  label: 'Facebook',     icon: '📘', placeholder: 'Name or profile URL' },
]

const FAQ_ITEMS = [
  {
    q: 'What happens after I share?',
    a: 'They receive your contact details. It\'s then entirely up to them whether they share theirs back — completely their choice, no obligation.',
  },
  {
    q: 'Is it safe to share my details?',
    a: 'You choose exactly what you share — phone, Instagram, Snapchat etc. Only share what you\'re comfortable with. You can always block them instantly if anything feels off.',
  },
  {
    q: 'How do I block someone?',
    a: 'Tap their name in any chat to open their profile, then tap Block. It takes seconds, is immediate, and they lose all access to your chat and profile.',
  },
  {
    q: 'What if I regret sharing?',
    a: 'Block them straight away. Once blocked they can no longer contact you through the app. For phone numbers, you can also block them directly in your contacts.',
  },
  {
    q: 'First meeting advice',
    a: 'Always meet in a busy public place with active foot traffic. Tell a friend where you\'re going. Trust your gut — if something feels wrong, leave. Your safety comes first, always.',
  },
  {
    q: 'Is sharing contact details free?',
    a: 'Yes — once the chat is unlocked, sharing your contact details costs nothing. The only charge is the one-time £1.99 unlock fee to open the conversation.',
  },
]

export default function ContactShareSheet({ open, onClose, onSend, contactUnlocked = false, unlockPrice = '£1.99', unlockingContact = false, onUnlockContact }) {
  const [selected, setSelected] = useState('phone')
  const [value, setValue]       = useState('')
  const [faqOpen, setFaqOpen]   = useState(false)

  const handleSend = () => {
    if (!value.trim()) return
    onSend({ contactType: selected, value: value.trim() })
    setValue('')
    setSelected('phone')
    onClose()
  }

  if (!open) return null

  const option = CONTACT_OPTIONS.find(o => o.id === selected)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* ── FAQ panel slides over sheet ── */}
        {faqOpen && (
          <div className={styles.faqPanel}>
            <div className={styles.faqHeader}>
              <span className={styles.faqTitle}>FAQs &amp; Advice</span>
              <button className={styles.faqClose} onClick={() => setFaqOpen(false)} aria-label="Close FAQ">✕</button>
            </div>
            <div className={styles.faqList}>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className={styles.faqItem}>
                  <span className={styles.faqQ}>{item.q}</span>
                  <p className={styles.faqA}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Unlock paywall (either side can pay) ── */}
        {!contactUnlocked && (
          <div className={styles.unlockScreen}>
            <span className={styles.unlockEmoji}>🔓</span>
            <h3 className={styles.unlockTitle}>Unlock Contact Sharing</h3>
            <p className={styles.unlockBody}>
              Chat is free — but to share personal contact details, one of you pays <strong>{unlockPrice}</strong> once.
              Either side can unlock. Once unlocked, sharing is <strong>free forever</strong> in this chat.
            </p>
            <div className={styles.unlockPerks}>
              <span>✓ Share phone, Instagram, Snapchat & more</span>
              <span>✓ Either side can pay — no pressure</span>
              <span>✓ One payment, permanent for both</span>
            </div>
            <button
              className={styles.unlockBtn}
              onClick={onUnlockContact}
              disabled={unlockingContact}
            >
              {unlockingContact ? 'Processing…' : `Unlock Contact Sharing · ${unlockPrice}`}
            </button>
            <p className={styles.unlockNote}>One-time · no subscription · instant</p>
          </div>
        )}

        {/* ── Share form (contact unlocked) ── */}
        {contactUnlocked && <>

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.title}>Share Contact</span>
            <span className={styles.slogan}>Take it offline — the real fun starts here 🔥</span>
          </div>
          <span className={styles.freeBadge}>Free</span>
        </div>

        {/* Contact type selector */}
        <div className={styles.optionRow}>
          {CONTACT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`${styles.optionBtn} ${selected === opt.id ? styles.optionBtnActive : ''}`}
              onClick={() => setSelected(opt.id)}
            >
              <span className={styles.optionIcon}>{opt.icon}</span>
              <span className={styles.optionLabel}>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Input + FAQ button */}
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}>{option.icon}</span>
          <input
            className={styles.input}
            type={selected === 'phone' ? 'tel' : 'text'}
            placeholder={option.placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            autoFocus
          />
          <button
            className={styles.faqBtn}
            onClick={() => setFaqOpen(true)}
            aria-label="FAQs and advice"
          >?</button>
        </div>

        {/* Safety warning */}
        <div className={styles.safetyNotice}>
          <span className={styles.safetyIcon}>⚠️</span>
          <p className={styles.safetyText}>
            <strong>Safety reminder:</strong> For your first meeting, always choose a busy public place with active foot traffic. Never meet somewhere private or isolated. Your safety is your responsibility — stay aware.
          </p>
        </div>

        {/* Send button — always free */}
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!value.trim()}
        >
          Send {option.label}
        </button>

        </>}

      </div>
    </div>
  )
}
