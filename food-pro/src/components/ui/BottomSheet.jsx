import { useEffect, useRef } from 'react'
import styles from './BottomSheet.module.css'

/**
 * Reusable bottom sheet with swipe-to-dismiss support.
 */
export default function BottomSheet({ open, onClose, children, title, borderColor }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const currentYRef = useRef(0)

  // Swipe to dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const onTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY
    }

    const onTouchMove = (e) => {
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
      if (currentYRef.current > 120) {
        onClose()
      } else {
        sheet.style.transform = ''
      }
      startYRef.current = null
      currentYRef.current = 0
    }

    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove', onTouchMove, { passive: true })
    sheet.addEventListener('touchend', onTouchEnd)

    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove', onTouchMove)
      sheet.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet} style={borderColor ? { borderTopColor: borderColor } : undefined}>
        <div className={styles.handle} onClick={onClose} style={borderColor ? { background: borderColor } : undefined} />
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}
