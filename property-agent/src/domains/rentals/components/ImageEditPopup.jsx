import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './ImageEditPopup.module.css'

const MOVE_STEP = 10
const ZOOM_STEP = 0.1
const MAX_SCALE = 3
const DEFAULT_SCALE = 1

/**
 * ImageEditPopup — crop window with pan/zoom.
 *
 * Props:
 *   src        — image URL to edit
 *   onSave     — called with { croppedBlob, croppedDataUrl, position } on save
 *   onCancel   — called when user cancels (no changes)
 *   isCover    — optional, shows "Cover Photo" in header
 */
export default function ImageEditPopup({ src, onSave, onCancel, isCover }) {
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [imgRendered, setImgRendered] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Calculate rendered image size (object-fit: cover equivalent)
  const calcRendered = useCallback(() => {
    const frame = frameRef.current
    if (!frame || !imgNatural.w || !imgNatural.h) return
    const fw = frame.offsetWidth
    const fh = frame.offsetHeight
    const frameAR = fw / fh
    const imgAR = imgNatural.w / imgNatural.h

    let rw, rh
    if (imgAR > frameAR) {
      // Image wider than frame — fit height, overflow width
      rh = fh
      rw = fh * imgAR
    } else {
      // Image taller than frame — fit width, overflow height
      rw = fw
      rh = fw / imgAR
    }
    setImgRendered({ w: rw, h: rh })
  }, [imgNatural])

  useEffect(() => { calcRendered() }, [calcRendered])

  // Boundary detection — clamp position so image covers frame
  const clampPos = useCallback((x, y, s) => {
    const frame = frameRef.current
    if (!frame || !imgRendered.w) return { x, y }
    const fw = frame.offsetWidth
    const fh = frame.offsetHeight
    const scaledW = imgRendered.w * s
    const scaledH = imgRendered.h * s

    // Image is positioned from top-left, centered by default offset
    // Default offset centers the image in the frame
    const defaultX = (fw - imgRendered.w) / 2
    const defaultY = (fh - imgRendered.h) / 2

    // After scaling from origin 0,0:
    // Actual image left = defaultX * s + x, top = defaultY * s + y
    // We need: actualLeft <= 0 AND actualLeft + scaledW >= fw
    // And:     actualTop <= 0  AND actualTop + scaledH >= fh

    const minX = fw - (defaultX * s + scaledW)
    const maxX = -(defaultX * s)
    const minY = fh - (defaultY * s + scaledH)
    const maxY = -(defaultY * s)

    return {
      x: Math.max(Math.min(minX, maxX), Math.min(Math.max(minX, maxX), x)),
      y: Math.max(Math.min(minY, maxY), Math.min(Math.max(minY, maxY), y)),
    }
  }, [imgRendered])

  // Move handlers
  const moveUp = () => {
    const clamped = clampPos(pos.x, pos.y + MOVE_STEP, scale)
    setPos(clamped)
  }
  const moveDown = () => {
    const clamped = clampPos(pos.x, pos.y - MOVE_STEP, scale)
    setPos(clamped)
  }
  const moveLeft = () => {
    const clamped = clampPos(pos.x + MOVE_STEP, pos.y, scale)
    setPos(clamped)
  }
  const moveRight = () => {
    const clamped = clampPos(pos.x - MOVE_STEP, pos.y, scale)
    setPos(clamped)
  }

  const zoomIn = () => {
    const newScale = Math.min(MAX_SCALE, +(scale + ZOOM_STEP).toFixed(2))
    const clamped = clampPos(pos.x, pos.y, newScale)
    setScale(newScale)
    setPos(clamped)
  }
  const zoomOut = () => {
    // Min scale = 1.0 — image fully covers the frame, cannot zoom out past full image
    const newScale = Math.max(DEFAULT_SCALE, +(scale - ZOOM_STEP).toFixed(2))
    const clamped = clampPos(pos.x, pos.y, newScale)
    setScale(newScale)
    setPos(clamped)
  }

  const resetAll = () => {
    setPos({ x: 0, y: 0 })
    setScale(DEFAULT_SCALE)
  }

  // Mouse/touch drag
  const onDragStart = (clientX, clientY) => {
    setDragging(true)
    dragStart.current = { x: clientX, y: clientY, posX: pos.x, posY: pos.y }
  }
  const onDragMove = useCallback((clientX, clientY) => {
    if (!dragging) return
    const dx = clientX - dragStart.current.x
    const dy = clientY - dragStart.current.y
    const clamped = clampPos(dragStart.current.posX + dx, dragStart.current.posY + dy, scale)
    setPos(clamped)
  }, [dragging, scale, clampPos])
  const onDragEnd = () => setDragging(false)

  useEffect(() => {
    const handleMouseMove = (e) => onDragMove(e.clientX, e.clientY)
    const handleMouseUp = () => onDragEnd()
    const handleTouchMove = (e) => {
      e.preventDefault()
      onDragMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const handleTouchEnd = () => onDragEnd()

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, onDragMove])

  // Save — render visible frame area to canvas, return blob + dataUrl
  const handleSave = () => {
    const frame = frameRef.current
    const img = imgRef.current
    if (!frame || !img || !imgNatural.w) {
      onSave?.({ position: { ...pos, scale } })
      return
    }

    const fw = frame.offsetWidth
    const fh = frame.offsetHeight
    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = fw * 2   // 2x for quality
    canvas.height = fh * 2
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate where the image sits relative to the frame
    const defaultX = (fw - imgRendered.w) / 2
    const defaultY = (fh - imgRendered.h) / 2

    // Draw scaled
    const drawX = (defaultX * scale + pos.x) * 2
    const drawY = (defaultY * scale + pos.y) * 2
    const drawW = imgRendered.w * scale * 2
    const drawH = imgRendered.h * scale * 2

    ctx.drawImage(img, drawX, drawY, drawW, drawH)

    canvas.toBlob((blob) => {
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92)
      onSave?.({
        croppedBlob: blob,
        croppedDataUrl,
        position: { ...pos, scale },
      })
    }, 'image/jpeg', 0.92)
  }

  // Image position style
  const defaultX = imgRendered.w ? ((frameRef.current?.offsetWidth || 340) - imgRendered.w) / 2 : 0
  const defaultY = imgRendered.h ? ((frameRef.current?.offsetHeight || 191) - imgRendered.h) / 2 : 0

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.popup}>
        {/* Dark overlay over background image */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none', borderRadius: 20 }} />
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span style={{ fontSize: 22 }}>📷</span>
            <span className={styles.headerText}>Image Editor</span>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>

        {/* Frame — exact bike card size (16:9) */}
        <div className={styles.frameArea}>
          <div
            ref={frameRef}
            className={styles.frame}
            onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
            onTouchStart={e => { onDragStart(e.touches[0].clientX, e.touches[0].clientY) }}
          >
            <img
              ref={imgRef}
              src={src}
              alt=""
              crossOrigin="anonymous"
              className={styles.frameImage}
              onLoad={e => {
                setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })
              }}
              style={{
                width: imgRendered.w || '100%',
                height: imgRendered.h || '100%',
                transform: `translate(${defaultX * scale + pos.x}px, ${defaultY * scale + pos.y}px) scale(${scale})`,
              }}
            />
            <div className={styles.cornerTL} />
            <div className={styles.cornerTR} />
            <div className={styles.cornerBL} />
            <div className={styles.cornerBR} />
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.dirControls}>
            {/* D-pad */}
            <div className={styles.dpad}>
              <div />
              <button className={styles.dirBtn} onClick={moveUp}>↑</button>
              <div />
              <button className={styles.dirBtn} onClick={moveLeft}>←</button>
              <button className={styles.resetBtn} onClick={resetAll}>⟲</button>
              <button className={styles.dirBtn} onClick={moveRight}>→</button>
              <div />
              <button className={styles.dirBtn} onClick={moveDown}>↓</button>
              <div />
            </div>

            {/* Zoom */}
            <div className={styles.zoomBtns}>
              <button
                className={`${styles.zoomBtn} ${scale >= MAX_SCALE ? styles.zoomBtnDisabled : ''}`}
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
              >+</button>
              <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
              <button
                className={`${styles.zoomBtn} ${scale <= DEFAULT_SCALE ? styles.zoomBtnDisabled : ''}`}
                onClick={zoomOut}
                disabled={scale <= DEFAULT_SCALE}
              >−</button>
            </div>
          </div>

          {/* Position info */}
          <div className={styles.infoRow}>
            <span className={styles.infoItem}>X:<span className={styles.infoValue}>{pos.x}px</span></span>
            <span className={styles.infoItem}>Y:<span className={styles.infoValue}>{pos.y}px</span></span>
            <span className={styles.infoItem}>Zoom:<span className={styles.infoValue}>{Math.round(scale * 100)}%</span></span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6}}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Image</button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>,
    document.body
  )
}
