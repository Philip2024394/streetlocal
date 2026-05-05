import { useState, useRef } from 'react'
import styles from './ProductImageEditor.module.css'

const MAX_IMAGES = 5
const STEP = 5 // D-pad step percentage

export default function ProductImageEditor({ initialUrl = null, initialImages = [], onConfirm, onCancel }) {
  // Support multi-image: initialImages is array, initialUrl is legacy single
  const startImages = initialImages.length
    ? initialImages.map(url => ({ src: url, zoom: 100, offsetX: 50, offsetY: 50 }))
    : initialUrl
    ? [{ src: initialUrl, zoom: 100, offsetX: 50, offsetY: 50 }]
    : []

  const [images, setImages] = useState(startImages)
  const [activeIdx, setActiveIdx] = useState(0)
  const [watermark, setWatermark] = useState('')
  const [exporting, setExporting] = useState(false)
  const fileRef = useRef()
  const canvasRef = useRef()

  const active = images[activeIdx] ?? null

  function updateActive(patch) {
    setImages(prev => prev.map((img, i) => i === activeIdx ? { ...img, ...patch } : img))
  }

  function handleFile(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newImages = files.slice(0, MAX_IMAGES - images.length).map(f => ({
      src: URL.createObjectURL(f),
      file: f,
      zoom: 100,
      offsetX: 50,
      offsetY: 50,
    }))
    setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES))
    if (!active) setActiveIdx(0)
    e.target.value = ''
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx))
    if (activeIdx >= images.length - 1) setActiveIdx(Math.max(0, images.length - 2))
  }

  function moveImage(idx, dir) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= images.length) return
    setImages(prev => {
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
    setActiveIdx(newIdx)
  }

  async function exportCanvas(img) {
    const canvas = canvasRef.current
    const W = 900, H = 900 // 1:1 square (Shopee standard)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    const imgEl = new Image()
    await new Promise((res, rej) => {
      imgEl.onload = res; imgEl.onerror = rej; imgEl.src = img.src
    })

    const nat = imgEl.naturalWidth / imgEl.naturalHeight
    let drawW, drawH
    if (nat > 1) { drawH = H; drawW = H * nat }
    else { drawW = W; drawH = W / nat }

    drawW *= img.zoom / 100
    drawH *= img.zoom / 100
    const ox = -((drawW - W) * (img.offsetX / 100))
    const oy = -((drawH - H) * (img.offsetY / 100))

    ctx.drawImage(imgEl, ox, oy, drawW, drawH)

    if (watermark.trim()) {
      const angle = Math.atan2(-H, W)
      const fontSize = Math.round(Math.sqrt(W * W + H * H) * 0.038)
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate(angle)
      ctx.font = `900 ${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'
      ctx.lineWidth = fontSize * 0.06
      ctx.strokeText(watermark.toUpperCase(), 0, 0)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillText(watermark.toUpperCase(), 0, 0)
      ctx.restore()
    }

    return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
  }

  async function handleConfirm() {
    if (!images.length) { onConfirm(null, null, []); return }
    setExporting(true)
    try {
      const results = []
      for (const img of images) {
        const blob = await exportCanvas(img)
        results.push({ blob, url: URL.createObjectURL(blob) })
      }
      // Legacy: first image as primary
      onConfirm(results[0].blob, results[0].url, results.map(r => r.url))
    } catch {
      onConfirm(null, images[0]?.src ?? null, images.map(i => i.src))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        <div className={styles.header}>
          <span className={styles.title}>Product Photos ({images.length}/{MAX_IMAGES})</span>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        </div>

        {/* ── Preview ── */}
        <div
          className={styles.previewBox}
          onClick={() => !active && fileRef.current?.click()}
          style={{ aspectRatio: '1/1' }}
        >
          {active ? (
            <>
              <img
                src={active.src}
                alt="preview"
                className={styles.previewImg}
                style={{
                  objectPosition: `${active.offsetX}% ${active.offsetY}%`,
                  transform: `scale(${active.zoom / 100})`,
                  transformOrigin: `${active.offsetX}% ${active.offsetY}%`,
                }}
              />
              {watermark.trim() && (
                <div className={styles.wmOverlay}>
                  <span className={styles.wmText}>{watermark.toUpperCase()}</span>
                </div>
              )}
            </>
          ) : (
            <div className={styles.previewEmpty}>
              <span className={styles.previewIcon}>📷</span>
              <span className={styles.previewHint}>Tap to add photos (up to {MAX_IMAGES})</span>
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ── */}
        {images.length > 0 && (
          <div style={{ display:'flex', gap:6, padding:'10px 18px', overflowX:'auto' }}>
            {images.map((img, i) => (
              <div key={i} style={{ position:'relative', flexShrink:0 }}>
                <button
                  onClick={() => setActiveIdx(i)}
                  style={{
                    width:56, height:56, borderRadius:8, overflow:'hidden', padding:0,
                    border: i === activeIdx ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.1)',
                    cursor:'pointer', background:'#111',
                  }}
                >
                  <img src={img.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </button>
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:'50%',
                    background:'#ef4444', border:'1px solid #000', color:'#fff',
                    fontSize:10, fontWeight:900, cursor:'pointer', display:'flex',
                    alignItems:'center', justifyContent:'center', lineHeight:1,
                  }}
                >✕</button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width:56, height:56, borderRadius:8, flexShrink:0,
                  border:'2px dashed rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.03)',
                  color:'rgba(255,255,255,0.3)', fontSize:22, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >+</button>
            )}
          </div>
        )}

        {/* ── Reorder buttons ── */}
        {images.length > 1 && active && (
          <div style={{ display:'flex', gap:6, padding:'0 18px 8px' }}>
            <button onClick={() => moveImage(activeIdx, -1)} disabled={activeIdx === 0}
              style={{ padding:'4px 12px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color: activeIdx === 0 ? 'rgba(255,255,255,0.15)' : '#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              ◀ Move Left
            </button>
            <button onClick={() => moveImage(activeIdx, 1)} disabled={activeIdx === images.length - 1}
              style={{ padding:'4px 12px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color: activeIdx === images.length - 1 ? 'rgba(255,255,255,0.15)' : '#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Move Right ▶
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        {active && (
          <button className={styles.changeBtn} onClick={() => fileRef.current?.click()}>
            + Add more photos
          </button>
        )}

        {/* ── D-Pad Controls + Zoom ── */}
        {active && (
          <div style={{ padding:'12px 18px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>

            {/* Zoom controls */}
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>ZOOM</span>
              <button onClick={() => updateActive({ zoom: Math.max(100, active.zoom - 10) })}
                style={{ width:28, height:28, borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <input
                type="range" min={100} max={300} value={active.zoom}
                onChange={e => updateActive({ zoom: Number(e.target.value) })}
                className={styles.slider}
              />
              <button onClick={() => updateActive({ zoom: Math.min(300, active.zoom + 10) })}
                style={{ width:28, height:28, borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              <span className={styles.sliderVal}>{active.zoom}%</span>
            </div>

            {/* D-Pad arrow controls */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, margin:'12px 0 4px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 36px)', gridTemplateRows:'repeat(3, 36px)', gap:3 }}>
                <div />
                <button onClick={() => updateActive({ offsetY: Math.max(0, active.offsetY - STEP) })}
                  style={dpadStyle}>▲</button>
                <div />

                <button onClick={() => updateActive({ offsetX: Math.max(0, active.offsetX - STEP) })}
                  style={dpadStyle}>◀</button>
                <button onClick={() => updateActive({ offsetX: 50, offsetY: 50, zoom: 100 })}
                  style={{ ...dpadStyle, fontSize:9, fontWeight:800, color:'#8DC63F' }}>RST</button>
                <button onClick={() => updateActive({ offsetX: Math.min(100, active.offsetX + STEP) })}
                  style={dpadStyle}>▶</button>

                <div />
                <button onClick={() => updateActive({ offsetY: Math.min(100, active.offsetY + STEP) })}
                  style={dpadStyle}>▼</button>
                <div />
              </div>

              <div style={{ marginLeft:16, fontSize:10, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>
                <div>X: {active.offsetX}%</div>
                <div>Y: {active.offsetY}%</div>
                <div style={{ marginTop:4, color:'rgba(141,198,63,0.5)' }}>RST = reset</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Watermark ── */}
        <div className={styles.wmSection}>
          <label className={styles.wmLabel}>
            Watermark
            <span className={styles.wmOptional}> — optional, applied to all images</span>
          </label>
          <input
            className={styles.wmInput}
            placeholder="e.g. Luxe Leather Studio"
            value={watermark}
            onChange={e => setWatermark(e.target.value)}
            maxLength={40}
          />
          {watermark.trim() && (
            <p className={styles.wmHint}>
              Lightly stamped diagonally across each image.
            </p>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={exporting}
        >
          {exporting ? 'Processing…' : images.length ? `Use ${images.length} Photo${images.length > 1 ? 's' : ''}` : 'Skip Photos'}
        </button>
      </div>
    </div>
  )
}

const dpadStyle = {
  width: 36, height: 36, borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff', fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
}
