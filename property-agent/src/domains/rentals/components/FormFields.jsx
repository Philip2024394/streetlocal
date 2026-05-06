/**
 * Shared form field components for rental listing forms.
 */
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import ImageEditPopup from './ImageEditPopup'
import styles from '../rentalFormStyles.module.css'

const ACCEPTED_FORMATS = '.jpg,.jpeg,.png,.webp,.heic'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function uploadImage(file) {
  // Validate
  if (file.size > MAX_FILE_SIZE) { alert('File too large. Max 5MB.'); return null }

  // Create local preview immediately
  const localUrl = URL.createObjectURL(file)

  // If Supabase is available, upload to storage
  if (supabase) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `rentals/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { data, error } = await supabase.storage.from('images').upload(path, file, { contentType: file.type })
    if (error) { console.error('Upload error:', error); return localUrl }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
    return urlData?.publicUrl || localUrl
  }

  // Demo mode — just use local blob URL
  return localUrl
}

export function TextField({ label, value, onChange, placeholder, required, hint, type = 'text', error }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label} {required && <span className={styles.required}>*</span>}</label>
      <input className={styles.input} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} />
      {hint && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

export function NumberField({ label, value, onChange, placeholder, required, hint, min, max }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label} {required && <span className={styles.required}>*</span>}</label>
      <input className={styles.input} value={value} onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))} placeholder={placeholder} type="text" inputMode="numeric" />
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function CurrencyField({ label, value, onChange, placeholder, required, hint }) {
  const display = value ? `Rp ${Number(value).toLocaleString('id-ID')}` : ''
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label} {required && <span className={styles.required}>*</span>}</label>
      <input className={styles.input} value={value} onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))} placeholder={placeholder} type="text" inputMode="numeric" />
      {value > 0 && <span className={styles.hint}>{display}</span>}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <textarea className={styles.textarea} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label} {required && <span className={styles.required}>*</span>}</label>
      <select className={styles.select} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

export function PillSelect({ label, value, onChange, options, required }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label} {required && <span className={styles.required}>*</span>}</label>
      <div className={styles.pillRow}>
        {options.map(o => {
          const val = o.value ?? o
          return <button key={val} className={`${styles.pill} ${value === val ? styles.pillActive : ''}`} onClick={() => onChange(val)}>{o.label ?? o}</button>
        })}
      </div>
    </div>
  )
}

export function ToggleField({ label, value, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <button className={`${styles.toggle} ${value ? styles.toggleOn : ''}`} onClick={() => onChange(!value)}>
        <span className={styles.toggleDot} />
      </button>
    </div>
  )
}

export function ChecklistField({ label, options, selected, onChange }) {
  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.checkGrid}>
        {options.map(o => {
          const val = o.value ?? o
          const active = selected.includes(val)
          return (
            <button key={val} className={`${styles.checkItem} ${active ? styles.checkItemActive : ''}`} onClick={() => toggle(val)}>
              <span className={`${styles.checkBox} ${active ? styles.checkBoxActive : ''}`}>{active ? '✓' : ''}</span>
              <span className={styles.checkLabel}>{o.label ?? o}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Row({ children }) {
  return <div className={styles.row}>{children}</div>
}

export function Section({ icon, title, sub, children }) {
  if (!children) {
    return (
      <div className={styles.section}>
        <span className={styles.sectionTitle}>{icon} {title}</span>
        {sub && <span className={styles.sectionSub}>{sub}</span>}
      </div>
    )
  }
  // Wrapped card mode — outer header + glass container
  return (
    <div style={{ marginTop: 12 }}>
      <div className={styles.section} style={{ marginTop: 0 }}>
        <span className={styles.sectionTitle}>{icon} {title}</span>
        {sub && <span className={styles.sectionSub}>{sub}</span>}
      </div>
      <div style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1.5px solid rgba(255,255,255,0.05)',
        borderRadius: 18,
        padding: '16px 14px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.15), transparent)',
          pointerEvents: 'none',
        }} />
        {children}
      </div>
    </div>
  )
}


export function ImageUploader({ mainImage, thumbImages, onSetMain, onAddThumb, onRemoveThumb, onRemoveMain }) {
  const [editingSrc, setEditingSrc] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const fileRef = useRef(null)

  // All images in one pool — main first, then thumbs
  const allImages = [mainImage, ...thumbImages].filter(Boolean)
  const coverIdx = mainImage ? 0 : -1

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (!url) return
    if (!mainImage) {
      // First image becomes cover
      onSetMain(url)
    } else {
      onAddThumb(url)
    }
    e.target.value = ''
  }

  const handleSetCover = (idx) => {
    const img = allImages[idx]
    if (!img || idx === coverIdx) return
    // Current cover goes to thumbs, selected becomes cover
    if (mainImage) {
      onAddThumb(mainImage) // old cover → thumbs
    }
    // Remove selected from thumbs
    const thumbIdx = idx - (mainImage ? 1 : 0)
    if (thumbIdx >= 0) onRemoveThumb(thumbIdx)
    onSetMain(img)
  }

  const handleRemove = (idx) => {
    if (idx === 0 && mainImage) {
      onRemoveMain()
      // Promote first thumb to cover if available
      if (thumbImages.length > 0) {
        onSetMain(thumbImages[0])
        onRemoveThumb(0)
      }
    } else {
      const thumbIdx = idx - (mainImage ? 1 : 0)
      onRemoveThumb(thumbIdx)
    }
  }

  const handleEditorSave = (result) => {
    if (result.croppedDataUrl && editingIdx !== null) {
      if (editingIdx === 0 && mainImage) {
        onSetMain(result.croppedDataUrl)
      } else {
        const thumbIdx = editingIdx - (mainImage ? 1 : 0)
        onRemoveThumb(thumbIdx)
        onAddThumb(result.croppedDataUrl)
      }
    }
    setEditingSrc(null)
    setEditingIdx(null)
  }

  const currentCover = mainImage || null

  return (
    <>
      {/* Image Editor Popup */}
      {editingSrc && (
        <ImageEditPopup
          src={editingSrc}
          onSave={handleEditorSave}
          onCancel={() => { setEditingSrc(null); setEditingIdx(null) }}
          isCover={editingIdx === 0 && !!mainImage}
        />
      )}

      {/* Format info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>JPG</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>PNG</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>WEBP</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>HEIC</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>Max 5MB · Up to 5 photos</span>
      </div>

      {/* Main preview — shows current cover image in 16:9 */}
      <div className={styles.mainImageWrap}>
        {currentCover ? (
          <div className={styles.mainImagePreview}>
            <img src={currentCover} alt="Cover" className={styles.mainImageImg} />
            <span className={styles.mainImageBadge}>COVER PHOTO</span>
            <button onClick={() => { setEditingSrc(currentCover); setEditingIdx(0) }} style={{ position: 'absolute', top: 10, left: 10, padding: '6px 14px', background: '#000', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', zIndex: 3, letterSpacing: '0.03em', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              ✎ Edit
            </button>
          </div>
        ) : (
          <button className={styles.mainImageAdd} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept={ACCEPTED_FORMATS} onChange={handleFileUpload} style={{ display: 'none' }} />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span className={styles.mainImageAddTitle}>Upload Photos</span>
            <span className={styles.mainImageAddSub}>First image becomes your cover photo (16:9)</span>
          </button>
        )}
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center', padding: '4px 0 2px', fontSize: 10, color: 'rgba(141,198,63,0.4)', fontWeight: 600, letterSpacing: '0.04em' }}>
        ↑ Rental card preview · Tap below to set cover
      </div>

      {/* All images row — tap to set cover (yellow frame), edit, remove */}
      <div className={styles.thumbRow}>
        {allImages.map((img, i) => {
          const isCover = i === coverIdx
          return (
            <div key={i} style={{
              position: 'relative', width: 80, height: 80, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              border: isCover ? '2.5px solid #FFD700' : '2px solid rgba(255,255,255,0.05)',
              boxShadow: isCover ? '0 0 12px rgba(255,215,0,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {/* Tap to set as cover */}
              <img src={img} alt="" className={styles.thumbImg} onClick={() => handleSetCover(i)} style={{ cursor: 'pointer' }} />
              {/* Cover badge */}
              {isCover && (
                <div style={{ position: 'absolute', top: 3, left: 3, padding: '2px 5px', background: '#FFD700', borderRadius: 4, fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: '0.04em' }}>COVER</div>
              )}
              {/* Remove */}
              <button onClick={(e) => { e.stopPropagation(); handleRemove(i) }} style={{
                position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%',
                background: '#EF4444', border: 'none', color: '#fff', fontSize: 9,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
              }}>✕</button>
            </div>
          )
        })}
        {allImages.length < 5 && (
          <button className={styles.thumbAdd} onClick={() => fileRef.current?.click()}>
            {!currentCover && <input ref={fileRef} type="file" accept={ACCEPTED_FORMATS} onChange={handleFileUpload} style={{ display: 'none' }} />}
            {currentCover && <input ref={fileRef} type="file" accept={ACCEPTED_FORMATS} onChange={handleFileUpload} style={{ display: 'none' }} />}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add</span>
          </button>
        )}
      </div>
    </>
  )
}

export function PriceFields({ daily, weekly, monthly, deposit, lateFee, onChange }) {
  return (
    <>
      <Section icon="💰" title="Pricing" sub="Set your rental rates" />
      <Row>
        <CurrencyField label="Daily Price" value={daily} onChange={v => onChange('daily', v)} placeholder="150000" required />
        <CurrencyField label="Weekly Price" value={weekly} onChange={v => onChange('weekly', v)} placeholder="900000" hint={daily && !weekly ? `Suggested: Rp ${Math.round(daily * 7 * 0.85).toLocaleString('id-ID')} (15% off)` : ''} />
      </Row>
      <Row>
        <CurrencyField label="Monthly Price" value={monthly} onChange={v => onChange('monthly', v)} placeholder="3000000" hint={daily && !monthly ? `Suggested: Rp ${Math.round(daily * 30 * 0.7).toLocaleString('id-ID')} (30% off)` : ''} />
        <CurrencyField label="Security Deposit" value={deposit} onChange={v => onChange('deposit', v)} placeholder="500000" required />
      </Row>
      <CurrencyField label="Late Return Fee" value={lateFee} onChange={v => onChange('lateFee', v)} placeholder="50000" required hint="Per day overdue" />
    </>
  )
}

export function PreviewCard({ title, city, category, subType, price, image, tags }) {
  return (
    <>
      <Section icon="👁" title="Preview" sub="How renters will see your listing" />
      <div className={styles.previewCard}>
        {image && <img src={image} alt="" className={styles.previewImg} />}
        <div className={styles.previewBody}>
          <span className={styles.previewTitle}>{title || 'Your listing title'}</span>
          <span className={styles.previewMeta}>{[subType, category, city].filter(Boolean).join(' · ') || 'Category · City'}</span>
          <span className={styles.previewPrice}>{price ? `Rp ${Number(price).toLocaleString('id-ID')}/day` : 'Rp —/day'}</span>
          {tags?.length > 0 && (
            <div className={styles.previewTags}>
              {tags.filter(Boolean).map(t => <span key={t} className={styles.previewTag}>{t}</span>)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function BuyNowFields({ enabled, onToggle, price, onPriceChange, negotiable, onNegotiableChange }) {
  return (
    <>
      <Section icon="💰" title="Also For Sale?" sub="Optional — add a buy now price to this listing" />
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${enabled ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: 14, transition: 'all 0.25s' }}>
        <ToggleField label="🛒 Available for Purchase" value={enabled} onChange={onToggle} />
        {enabled && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <CurrencyField label="Buy Now Price" value={price} onChange={onPriceChange} placeholder="12000000" required />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onNegotiableChange(true)} style={{ flex: 1, padding: '10px 14px', background: negotiable ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${negotiable ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: negotiable ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Negotiable</button>
              <button onClick={() => onNegotiableChange(false)} style={{ flex: 1, padding: '10px 14px', background: !negotiable ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${!negotiable ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: !negotiable ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Fixed Price</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function FormFooter({ step, onBack, onNext, onDraft, canNext, submitting, nextLabel }) {
  return (
    <div className={styles.footer}>
      {step > 1 && <button className={styles.draftBtn} onClick={onDraft}>Save Draft</button>}
      <button className={styles.nextBtn} onClick={onNext} disabled={!canNext || submitting}>
        {submitting ? 'Publishing...' : nextLabel ?? 'Next →'}
      </button>
    </div>
  )
}

export function ProgressBar({ current, total }) {
  return (
    <div className={styles.progress}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`${styles.progressDot} ${i < current ? styles.progressDotDone : ''} ${i === current ? styles.progressDotActive : ''}`} />
      ))}
    </div>
  )
}
