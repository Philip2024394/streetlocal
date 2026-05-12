import { useRef, useEffect } from 'react'
import styles from './ShopTypeSheet.module.css'

export const SHOP_TYPE_OPTIONS = [
  {
    value: 'shop',
    emoji: '🛍️',
    label: 'Products / Shop',
    sub: 'Physical or digital items for sale — prints, goods, stock',
  },
  {
    value: 'services',
    emoji: '🗒️',
    label: 'Services',
    sub: 'What you offer — packages, bookings, pricing & availability',
  },
  {
    value: 'menu',
    emoji: '📋',
    label: 'Menu',
    sub: 'Food, drink or hospitality — dishes, drinks, set menus',
  },
]

export default function ShopTypeSheet({ open, value, onChange, onClose }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const currentYRef = useRef(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) { currentYRef.current = delta; sheet.style.transform = `translateY(${delta}px)`; sheet.style.transition = 'none' }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 80) onClose()
      else sheet.style.transform = ''
      startYRef.current = null; currentYRef.current = 0
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

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>Page Type</span>
            <span className={styles.headerSub}>Choose what your profile tab shows to visitors</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.list}>
          {SHOP_TYPE_OPTIONS.map((opt) => {
            const isActive = value === opt.value
            return (
              <button
                key={opt.value}
                className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                onClick={() => { onChange(opt.value); onClose() }}
              >
                <span className={styles.cardEmoji}>{opt.emoji}</span>
                <div className={styles.cardText}>
                  <span className={styles.cardLabel}>{opt.label}</span>
                  <span className={styles.cardSub}>{opt.sub}</span>
                </div>
                {isActive && (
                  <svg className={styles.cardCheck} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
