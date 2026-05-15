/* ─────────────────────────────────────────────────────────────
   ImagePickerModal — full-screen picker that pops over any
   image slot in the donut app. Three tabs:

     Library — vendor's past uploads, kind-filtered by default
               but they can flip the filter to "All kinds" to
               re-use an image across slots.
     Stock   — StreetLocal-curated artwork for this kind.
     Upload  — file input → uploads through the parent's
               onUpload callback → auto-records into the
               library → auto-selects.

   Premium UI matches the rest of the donut app:
     - Same donutLanding.bgImg backdrop with a 60% dark scrim
     - Dark-glass panels (rgba(0,0,0,0.55) + 14px blur)
     - Pink accent (donutLanding.pink)
     - 13px text floor, 44px tap targets

   Props:
     open       boolean — modal visibility
     kind       string  — semantic slot id (drives Stock + default filter)
     vendorId   string  — for library reads
     current    string  — currently-selected URL (renders a tick)
     bgImg      string  — donut theme bg for the backdrop
     accent     string  — pink accent for borders / CTAs
     onPick     (url) => void  — fires when vendor selects an image
     onClose    () => void
     onUpload   (file, kind) => Promise<string|null> — parent owns the upload
   ───────────────────────────────────────────────────────────── */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { listVendorImages, softDeleteVendorImage } from './lib/imageLibrary'
import { STREETLOCAL_STOCK, KIND_LABEL } from './imageStock'

const ALL_KINDS = ['logo','hero','bouncing','bottom_left','flavour_orb','bg','menu_item','donut_card','loyalty','banner','box','packet','letterhead','other']

export default function ImagePickerModal ({
  open,
  kind = 'other',
  vendorId,
  current = '',
  bgImg = '',
  accent = '#F472B6',
  cap = Infinity,
  tierLabel = '',
  onPick,
  onClose,
  onUpload,
}) {
  const [tab, setTab] = useState('library')
  const [filter, setFilter] = useState(kind)
  const [library, setLibrary] = useState([])
  const [loadingLib, setLoadingLib] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // library row id
  const [search, setSearch] = useState('')
  // libraryCount tracks the vendor's TOTAL library size (across all
  // kinds) so the quota chip stays accurate even when the visible
  // grid is filtered. Re-fetched whenever the modal opens.
  const [libraryCount, setLibraryCount] = useState(0)
  const fileRef = useRef(null)

  // Reload library whenever the modal opens or the filter flips.
  // `kind = null` in the filter dropdown means "All kinds".
  useEffect(() => {
    if (!open || !vendorId) return
    let cancelled = false
    setLoadingLib(true)
    listVendorImages(vendorId, filter === 'all' ? null : filter).then(rows => {
      if (!cancelled) {
        setLibrary(rows)
        setLoadingLib(false)
      }
    })
    return () => { cancelled = true }
  }, [open, vendorId, filter])

  // Track total library count (unfiltered) for the quota chip. Runs
  // once per open + after every delete / upload so the counter never
  // lies.
  useEffect(() => {
    if (!open || !vendorId) return
    let cancelled = false
    listVendorImages(vendorId, null, 1000).then(rows => {
      if (!cancelled) setLibraryCount(rows.length)
    })
    return () => { cancelled = true }
  }, [open, vendorId, library.length])

  // Reset the kind filter every time the picker re-opens — vendors
  // expect "show me images relevant to THIS slot" by default.
  useEffect(() => { if (open) setFilter(kind) }, [open, kind])

  // Sensible default tab: vendors with zero past uploads start on
  // Stock (so they see something instantly) — others on Library.
  useEffect(() => {
    if (!open) return
    setTab(library.length > 0 ? 'library' : 'stock')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const stockForKind = useMemo(() => STREETLOCAL_STOCK[kind] || [], [kind])

  const handlePick = (url) => {
    if (typeof onPick === 'function') onPick(url)
    if (typeof onClose === 'function') onClose()
  }

  const capReached = Number.isFinite(cap) && libraryCount >= cap

  const handleUploadInput = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || typeof onUpload !== 'function') return
    if (capReached) {
      alert(`You've hit the ${cap}-image cap on the ${tierLabel || 'Starter'} plan. Remove some images, or upgrade your plan to upload more.`)
      return
    }
    setUploading(true)
    try {
      const url = await onUpload(file, kind)
      if (url) handlePick(url)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await softDeleteVendorImage(id)
    if (ok) setLibrary(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
  }

  // Visible library after search-by-label. MUST stay above the
  // `if (!open) return null` early return — moving this useMemo
  // below the return triggers React's "Rendered more hooks than
  // during the previous render" error when `open` flips false→true.
  const filteredLibrary = useMemo(() => {
    if (!search.trim()) return library
    const s = search.trim().toLowerCase()
    return library.filter(r => (r.label || '').toLowerCase().includes(s) || (r.url || '').toLowerCase().includes(s))
  }, [library, search])

  if (!open) return null

  // ── Styles — kept inline so the picker doesn't depend on any
  //    external CSS module / Tailwind config (food-basic uses
  //    inline + <style> only). All colours derive from the accent
  //    prop so the picker re-skins for non-donut verticals.
  const sBackdrop = {
    position: 'fixed', inset: 0, zIndex: 320,
    background: '#0a0a0a',
    display: 'flex', flexDirection: 'column',
  }
  const sBgImg = {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', zIndex: 0,
    filter: 'brightness(0.4) saturate(0.85)',
  }
  const sScrim = {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    zIndex: 1,
  }
  const sWrap = {
    position: 'relative', zIndex: 2,
    flex: 1, display: 'flex', flexDirection: 'column',
    maxWidth: 720, width: '100%', margin: '0 auto',
    paddingBottom: 'env(safe-area-inset-bottom, 8px)',
  }
  const sHeader = {
    padding: '14px 16px 10px',
    display: 'flex', alignItems: 'center', gap: 10,
  }
  const sBackBtn = {
    width: 38, height: 38, borderRadius: 19,
    background: accent, border: 'none', color: '#fff',
    fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 38, minWidth: 38,
  }
  const sTitle = {
    fontSize: 16, fontWeight: 900, color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
    lineHeight: 1.2,
  }
  const sSubtitle = {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    marginTop: 2, lineHeight: 1.3,
  }
  const sTabBar = {
    margin: '0 16px 12px',
    padding: 4, borderRadius: 14,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
  }
  const sTab = (active) => ({
    padding: '10px 8px', borderRadius: 10, border: 'none',
    background: active ? accent : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
    fontSize: 13, fontWeight: 800, cursor: 'pointer',
    minHeight: 44, lineHeight: 1.1,
    transition: 'all 0.15s ease',
  })
  const sFilterRow = {
    margin: '0 16px 12px',
    display: 'flex', alignItems: 'center', gap: 8,
  }
  const sFilterSelect = {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 13, fontWeight: 700,
    outline: 'none', cursor: 'pointer',
    minHeight: 40,
    fontFamily: 'inherit',
  }
  const sFilterPill = (active) => ({
    padding: '9px 14px', borderRadius: 999,
    background: active ? accent : 'rgba(0,0,0,0.55)',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    minHeight: 40,
  })
  const sBody = {
    flex: 1, overflowY: 'auto',
    padding: '4px 16px 16px',
  }
  const sGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  }
  const sTile = (selected) => ({
    position: 'relative',
    aspectRatio: '1 / 1',
    borderRadius: 14,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: selected ? `2.5px solid ${accent}` : '1.5px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    boxShadow: selected ? `0 8px 24px ${accent}55` : 'none',
    transition: 'all 0.15s ease',
  })
  const sTileImg = {
    width: '100%', height: '100%', objectFit: 'cover',
    display: 'block',
  }
  const sTileTick = {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    background: accent, color: '#fff',
    fontSize: 14, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  }
  const sTileLabel = {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: '6px 8px',
    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)',
    color: '#fff', fontSize: 13, fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  }
  const sTileDelete = {
    position: 'absolute', top: 6, left: 6,
    width: 24, height: 24, borderRadius: 12,
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    fontSize: 16, lineHeight: 1, fontWeight: 700,
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const sEmpty = {
    margin: '32px 16px',
    padding: '32px 20px',
    borderRadius: 16,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: '1px dashed rgba(255,255,255,0.12)',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14, lineHeight: 1.55,
  }
  const sUploadBox = {
    margin: '12px 16px 0',
    padding: 24, borderRadius: 18,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: `2px dashed ${accent}66`,
    textAlign: 'center',
  }
  const sUploadBtn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '14px 28px', borderRadius: 12,
    background: accent, color: '#fff',
    fontSize: 14, fontWeight: 800,
    border: 'none', cursor: 'pointer',
    minHeight: 44,
    boxShadow: `0 6px 18px ${accent}66`,
  }

  // ── Library tab content ────────────────────────────────────
  const libraryContent = (
    <div>
      <div style={sFilterRow}>
        <select
          style={sFilterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All kinds</option>
          {ALL_KINDS.map(k => (
            <option key={k} value={k}>{KIND_LABEL[k] || k}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', minHeight: 40, fontFamily: 'inherit' }}
        />
      </div>
      {loadingLib ? (
        <div style={sEmpty}>Loading your library…</div>
      ) : filteredLibrary.length === 0 ? (
        <div style={sEmpty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
          <div style={{ fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {library.length === 0 ? 'Your library is empty' : 'No matches'}
          </div>
          <div>
            {library.length === 0
              ? <>Every image you upload is saved here so you can re-use it in any slot. Tap <strong style={{ color: accent }}>Upload</strong> above to add your first.</>
              : <>Nothing in your library matches "{search}". Clear the search or try a different filter.</>}
          </div>
        </div>
      ) : (
        <div style={sGrid}>
          {filteredLibrary.map(row => {
            const selected = current === row.url
            return (
              <div key={row.id} style={sTile(selected)} onClick={() => handlePick(row.url)}>
                <img loading="lazy" src={row.url} alt={row.label || ''} style={sTileImg} />
                {selected && <div style={sTileTick}>✓</div>}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(row.id) }}
                  style={sTileDelete}
                  aria-label="Remove from library"
                >×</button>
                {row.label && <div style={sTileLabel}>{row.label}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Stock tab content ──────────────────────────────────────
  const stockContent = (
    <div>
      {stockForKind.length === 0 ? (
        <div style={sEmpty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
          <div style={{ fontWeight: 800, color: '#fff', marginBottom: 6 }}>Stock artwork coming soon</div>
          <div>We're curating {KIND_LABEL[kind] || 'this kind'} images now. Upload your own for now — they'll save to your library for one-tap re-use.</div>
        </div>
      ) : (
        <div style={sGrid}>
          {stockForKind.map(item => {
            const selected = current === item.url
            return (
              <div key={item.id} style={sTile(selected)} onClick={() => handlePick(item.url)}>
                <img loading="lazy" src={item.url} alt={item.label || ''} style={sTileImg} />
                {selected && <div style={sTileTick}>✓</div>}
                {item.label && <div style={sTileLabel}>{item.label}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Upload tab content ─────────────────────────────────────
  const uploadContent = (
    <div style={sUploadBox}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>{capReached ? '🚦' : '⬆️'}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
        {capReached ? `${tierLabel || 'Starter'} plan — library full` : 'Upload from your device'}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 18, lineHeight: 1.5 }}>
        {capReached
          ? `You've used all ${cap} images on this plan. Remove some images from your library, or upgrade your plan to unlock more storage.`
          : "PNG, JPG, or WebP. We'll compress and store it in your library so you can re-pick it anywhere later."}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{ ...sUploadBtn, opacity: capReached ? 0.45 : 1, cursor: capReached ? 'not-allowed' : 'pointer' }}
        disabled={uploading || capReached}
      >
        {uploading ? 'Uploading…' : capReached ? 'Cap reached' : 'Choose Image'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUploadInput}
      />
    </div>
  )

  return (
    <div style={sBackdrop} role="dialog" aria-modal="true" aria-label={`Choose ${KIND_LABEL[kind] || 'image'}`}>
      {bgImg && <img src={bgImg} alt="" style={sBgImg} aria-hidden />}
      <div style={sScrim} aria-hidden />
      <div style={sWrap}>
        <div style={sHeader}>
          <button type="button" onClick={onClose} style={sBackBtn} aria-label="Close">←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={sTitle}>Choose {KIND_LABEL[kind] || 'image'}</div>
            <div style={sSubtitle}>Pick from your library, our stock, or upload a new one.</div>
          </div>
          {/* Quota chip — shows current library size + tier cap so the
              vendor always knows where they are vs the cap. Hidden for
              unlimited tiers. */}
          {Number.isFinite(cap) && (
            <div style={{
              padding: '6px 10px', borderRadius: 999,
              background: capReached ? 'rgba(239,68,68,0.18)' : 'rgba(0,0,0,0.55)',
              border: `1px solid ${capReached ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
              color: capReached ? '#FCA5A5' : 'rgba(255,255,255,0.85)',
              fontSize: 13, fontWeight: 800,
              whiteSpace: 'nowrap',
            }}>
              {libraryCount}/{cap}
            </div>
          )}
        </div>

        <div style={sTabBar}>
          <button type="button" style={sTab(tab === 'library')} onClick={() => setTab('library')}>Library</button>
          <button type="button" style={sTab(tab === 'stock')}   onClick={() => setTab('stock')}>Stock</button>
          <button type="button" style={sTab(tab === 'upload')}  onClick={() => setTab('upload')}>Upload</button>
        </div>

        <div style={sBody}>
          {tab === 'library' && libraryContent}
          {tab === 'stock'   && stockContent}
          {tab === 'upload'  && uploadContent}
        </div>
      </div>

      {/* Soft-delete confirmation — keeps the action one tap of an
          accidental cross-tap. */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 340, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 360, width: '100%', padding: 22, borderRadius: 18, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>Remove from library?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 18 }}>
              The image stays live wherever it's already used — only this entry in your library is hidden. You can ask us to restore it within 30 days.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>Cancel</button>
              <button type="button" onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
