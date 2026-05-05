import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './TradeRoleSheet.module.css'

export const TRADE_ROLE_GROUPS = [
  {
    key: 'commerce',
    label: 'Commerce',
    options: [
      { value: 'selling',    emoji: '🏷️', label: 'Selling / Offering',       sub: 'Products, services or skills for sale' },
      { value: 'buying',     emoji: '🛍️', label: 'Buying / Looking to Buy',  sub: 'Sourcing products or services' },
      { value: 'both',       emoji: '🔄', label: 'Buying & Selling',          sub: 'Both sourcing and selling' },
    ],
  },
  {
    key: 'growth',
    label: 'Business Growth',
    options: [
      { value: 'leads',      emoji: '📊', label: 'Lead Generation',           sub: 'Finding new clients or customers' },
      { value: 'networking', emoji: '🤝', label: 'Networking / Contacts',     sub: 'Building professional relationships' },
      { value: 'collab',     emoji: '🔗', label: 'Collaboration',             sub: 'Partnerships and joint ventures' },
      { value: 'recruiting', emoji: '👥', label: 'Recruiting / Hiring',       sub: 'Finding staff or contractors' },
      { value: 'showcasing', emoji: '🎯', label: 'Showcasing / Portfolio',    sub: 'Displaying work to attract interest' },
      { value: 'investing',  emoji: '💰', label: 'Investing / Finding Deals', sub: 'Seeking investment opportunities' },
    ],
  },
  {
    key: 'social',
    label: 'Social & Community',
    options: [
      { value: 'socialising', emoji: '👋', label: 'Socialising',              sub: 'Meeting new people in person' },
      { value: 'community',   emoji: '🌍', label: 'Community / Following',    sub: 'Building an audience or community' },
      { value: 'events',      emoji: '🎉', label: 'Hosting Events',           sub: 'Organising gatherings or meetups' },
    ],
  },
]

export default function TradeRoleSheet({ open, value, onChange, onClose }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 80) onClose()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>I am here to…</span>
            <span className={styles.headerSub}>What best describes your purpose on the app?</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.list}>
          {TRADE_ROLE_GROUPS.map(group => (
            <div key={group.key} className={styles.group}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.options.map(opt => {
                const active = value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.item} ${active ? styles.itemActive : ''}`}
                    onClick={() => { onChange(opt.value); onClose() }}
                    data-selected={active}
                  >
                    <span className={styles.itemEmoji}>{opt.emoji}</span>
                    <div className={styles.itemText}>
                      <span className={styles.itemLabel}>{opt.label}</span>
                      <span className={styles.itemSub}>{opt.sub}</span>
                    </div>
                    {active && (
                      <svg className={styles.itemCheck} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
