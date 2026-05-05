import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LOOKING_FOR_GROUPS, LOOKING_FOR_OPTIONS, SUB_CATEGORIES } from '@/utils/lookingForLabels'
import styles from './LookingForSheet.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// Two-step category picker
// Step 1: main category list (one long scrollable list with group headers)
// Step 2: sub-category sheet slides up when a category has sub-options
// onChange(mainValue, subValue) — subValue is null when skipped
// ─────────────────────────────────────────────────────────────────────────────

export default function LookingForSheet({ open, value, subValue, onChange, onClose }) {
  const [step,        setStep]        = useState('main') // 'main' | 'sub'
  const [pendingMain, setPendingMain] = useState(null)

  const sheetRef    = useRef(null)
  const subSheetRef = useRef(null)
  const listRef     = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  // Reset to main step whenever sheet is opened
  useEffect(() => {
    if (open) { setStep('main'); setPendingMain(null) }
  }, [open])

  // Scroll selected item into view when on main step
  useEffect(() => {
    if (!open || step !== 'main' || !listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    if (selected) selected.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [open, step])

  // Swipe-down-to-close for main sheet
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open || step !== 'main') return
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
  }, [open, step, onClose])

  // Swipe-down-to-close for sub sheet
  useEffect(() => {
    const sheet = subSheetRef.current
    if (!sheet || step !== 'sub') return
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
      if (currentYRef.current > 80) setStep('main')
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
  }, [step])

  if (!open) return null

  const firstValue = LOOKING_FOR_OPTIONS[0].value

  // ── Handle main category tap ─────────────────────────────────────────────
  function handleMainSelect(mainVal) {
    if (SUB_CATEGORIES[mainVal]?.length > 0) {
      setPendingMain(mainVal)
      setStep('sub')
    } else {
      onChange(mainVal, null)
      onClose()
    }
  }

  // ── Handle sub-category tap ──────────────────────────────────────────────
  function handleSubSelect(subVal) {
    onChange(pendingMain, subVal)
    onClose()
  }

  // ── Skip sub-category ────────────────────────────────────────────────────
  function handleSubSkip() {
    onChange(pendingMain, null)
    onClose()
  }

  // ── Sub-category sheet ───────────────────────────────────────────────────
  const pendingOpt  = pendingMain ? LOOKING_FOR_OPTIONS.find(o => o.value === pendingMain) : null
  const subOptions  = pendingMain ? (SUB_CATEGORIES[pendingMain] ?? []) : []

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={step === 'sub' ? () => setStep('main') : onClose} />

      {/* ── MAIN SHEET ─────────────────────────────────────────────────── */}
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={step === 'sub' ? { transform: 'translateY(40px)', pointerEvents: 'none', filter: 'brightness(0.55)' } : {}}
      >
        {/* Drag handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>I joined the app for</span>
            <span className={styles.headerSub}>Select one category from directory</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* One long list with group headers */}
        <div className={styles.list} ref={listRef}>
          {LOOKING_FOR_GROUPS.map(group => {
            const opts = LOOKING_FOR_OPTIONS.filter(o => o.group === group.key)
            return (
              <div key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupLabel}>{group.label}</span>
                  <div className={styles.groupLine} />
                </div>
                {opts.map(opt => {
                  const selected    = opt.value === value
                  const isFirstHint = !value && opt.value === firstValue
                  const hasSubs     = !!(SUB_CATEGORIES[opt.value]?.length)
                  return (
                    <button
                      key={opt.value}
                      data-selected={selected ? 'true' : 'false'}
                      className={`${styles.option} ${selected ? styles.optionSelected : ''} ${isFirstHint ? styles.optionHint : ''}`}
                      onClick={() => handleMainSelect(opt.value)}
                    >
                      {opt.img
                        ? <img src={opt.img} alt={opt.label} className={styles.optionImg} />
                        : <span className={styles.optionEmoji}>{opt.emoji}</span>
                      }
                      <span className={styles.optionLabel}>{opt.label}</span>
                      {hasSubs && (
                        <span className={styles.optionArrow}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </span>
                      )}
                      {(selected || isFirstHint) && !hasSubs && (
                        <span className={`${styles.optionCheck} ${isFirstHint && !selected ? styles.optionCheckHint : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selected ? '#8DC63F' : 'rgba(141,198,63,0.4)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SUB-CATEGORY SHEET ─────────────────────────────────────────── */}
      {step === 'sub' && (
        <div ref={subSheetRef} className={`${styles.sheet} ${styles.subSheet}`}>
          {/* Drag handle */}
          <div className={styles.handle} />

          {/* Sub header */}
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => setStep('main')} aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className={styles.headerText} style={{ flex: 1 }}>
              <span className={styles.headerTitle}>
                {pendingOpt?.emoji} {pendingOpt?.label}
              </span>
              <span className={styles.headerSub}>Select your specific role</span>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Sub options list */}
          <div className={styles.list}>
            {subOptions.map(sub => {
              const selected = sub.value === subValue && pendingMain === value
              return (
                <button
                  key={sub.value}
                  className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                  onClick={() => handleSubSelect(sub.value)}
                >
                  <span className={styles.optionEmoji}>{sub.emoji}</span>
                  <span className={styles.optionLabel}>{sub.label}</span>
                  {selected && (
                    <span className={styles.optionCheck}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}

            {/* Skip / General option */}
            <button
              className={`${styles.option} ${styles.optionSkip}`}
              onClick={handleSubSkip}
            >
              <span className={styles.optionEmoji}>⬆️</span>
              <span className={styles.optionLabel}>Use General — "{pendingOpt?.label}"</span>
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
