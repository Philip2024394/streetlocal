/**
 * SellerProductsScreen — product management for sellers.
 * List products, toggle live/off, flash sale, auction entry.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchProducts, toggleProductActive, deleteProduct } from '@/services/commerceService'
import { DEMO_PRODUCTS } from '@/services/commerceService'
import styles from './SellerProductsScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function SellerProductsScreen({ open, onClose, onAddProduct, onEditProduct }) {
  const { user } = useAuth()
  const [products, setProducts] = useState(DEMO_PRODUCTS.map(p => ({
    ...p,
    flashSale: p.flashSale || { active: false, discountPercent: 0, endsAt: null },
    auction: p.auction || { active: false, startPrice: 0, duration: 6 },
  })))
  const [filter, setFilter] = useState('all')
  const [flashModal, setFlashModal] = useState(null)
  const [auctionModal, setAuctionModal] = useState(null)
  const [flashPercent, setFlashPercent] = useState('20')
  const [flashHours, setFlashHours] = useState('24')
  const [auctionStart, setAuctionStart] = useState('')
  const [auctionReserve, setAuctionReserve] = useState('')
  const [auctionBuyNow, setAuctionBuyNow] = useState('')
  const [auctionDuration, setAuctionDuration] = useState('6')

  useEffect(() => {
    if (!open || !user?.id) return
    fetchProducts(user.id).then(data => {
      if (data?.length) setProducts(data.map(p => ({
        ...p,
        flashSale: p.flashSale || { active: false },
        auction: p.auction || { active: false },
      })))
    })
  }, [open, user?.id])

  if (!open) return null

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setProducts(prev => prev.filter(p => p.id !== id))
    deleteProduct(id).catch(() => {})
    // Also remove from localStorage
    try {
      const key = 'indoo_seller_products'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== id)))
    } catch {}
  }

  const toggleLive = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
    toggleProductActive(id, products.find(p => p.id === id)?.active ? false : true).catch(() => {})
  }

  const startFlashSale = (id) => {
    const pct = Number(flashPercent)
    const hrs = Number(flashHours)
    if (!pct || pct < 1 || pct > 90 || !hrs || hrs < 1) return
    setProducts(prev => prev.map(p => p.id === id ? {
      ...p, flashSale: { active: true, discountPercent: pct, endsAt: Date.now() + hrs * 3600000 }
    } : p))
    setFlashModal(null)
  }

  const stopFlashSale = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, flashSale: { active: false } } : p))
  }

  const startAuction = (id) => {
    const start = Number(auctionStart)
    if (!start) return
    setProducts(prev => prev.map(p => p.id === id ? {
      ...p, auction: {
        active: true, startPrice: start,
        reservePrice: Number(auctionReserve) || null,
        buyNowPrice: Number(auctionBuyNow) || null,
        duration: Number(auctionDuration) || 6,
        endsAt: Date.now() + (Number(auctionDuration) || 6) * 3600000,
      }
    } : p))
    setAuctionModal(null)
  }

  const stopAuction = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, auction: { active: false } } : p))
  }

  const filtered = filter === 'all' ? products
    : filter === 'live' ? products.filter(p => p.active)
    : filter === 'off' ? products.filter(p => !p.active)
    : filter === 'flash' ? products.filter(p => p.flashSale?.active)
    : filter === 'auction' ? products.filter(p => p.auction?.active)
    : products

  const counts = {
    all: products.length,
    live: products.filter(p => p.active).length,
    off: products.filter(p => !p.active).length,
    flash: products.filter(p => p.flashSale?.active).length,
    auction: products.filter(p => p.auction?.active).length,
  }

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="" className={styles.headerLogo} />
        <h1 className={styles.title}>My Products</h1>
        <button className={styles.addBtn} onClick={onAddProduct}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'all', label: 'All' },
          { id: 'live', label: 'Live' },
          { id: 'off', label: 'Off' },
          { id: 'flash', label: 'Flash Sale' },
          { id: 'auction', label: 'Auction' },
        ].map(t => (
          <button key={t.id} className={`${styles.tab} ${filter === t.id ? styles.tabActive : ''}`} onClick={() => setFilter(t.id)}>
            {t.label} ({counts[t.id]})
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📦</span>
            <span>No products</span>
            <button className={styles.emptyBtn} onClick={onAddProduct}>List your first product</button>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className={`${styles.card} ${!p.active ? styles.cardOff : ''}`}>
            <img src={p.image || 'https://picsum.photos/seed/prod/200'} alt={p.name} className={styles.cardImg} />
            <div className={styles.cardBody}>
              <span className={styles.cardName}>{p.name}</span>
              <span className={styles.cardPrice}>{fmtRp(p.price)}</span>
              <span className={styles.cardStock}>Stock: {p.stock ?? '∞'}</span>
              {/* Badges */}
              <div className={styles.badges}>
                {p.flashSale?.active && <span className={styles.flashBadge}>⚡ -{p.flashSale.discountPercent}%</span>}
                {p.auction?.active && <span className={styles.auctionBadge}>🔨 Live Auction</span>}
              </div>
            </div>
            <div className={styles.cardActions}>
              {/* Live toggle */}
              <button className={`${styles.toggleBtn} ${p.active ? styles.toggleOn : styles.toggleOff}`} onClick={() => toggleLive(p.id)}>
                {p.active ? 'Live' : 'Off'}
              </button>
              {/* Flash Sale */}
              {p.flashSale?.active ? (
                <button className={styles.flashStopBtn} onClick={() => stopFlashSale(p.id)}>⚡ Stop</button>
              ) : (
                <button className={styles.flashBtn} onClick={() => { setFlashModal(p.id); setFlashPercent('20'); setFlashHours('24') }}>⚡ Flash</button>
              )}
              {/* Auction */}
              {p.auction?.active ? (
                <button className={styles.auctionStopBtn} onClick={() => stopAuction(p.id)}>🔨 End</button>
              ) : (
                <button className={styles.auctionBtn} onClick={() => { setAuctionModal(p.id); setAuctionStart(String(p.price || '')); setAuctionReserve(''); setAuctionBuyNow(''); setAuctionDuration('6') }}>🔨 Auction</button>
              )}
              {/* Edit */}
              <button className={styles.editBtn} onClick={() => onEditProduct?.(p)}>Edit</button>
              {/* Delete */}
              <button
                className={styles.editBtn}
                style={{
                  width: 30, height: 30, padding: 0, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}
                title="Delete product"
                onClick={() => handleDelete(p.id, p.name)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Flash Sale Modal */}
      {flashModal && (
        <div className={styles.modalOverlay} onClick={() => setFlashModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>⚡ Start Flash Sale</h3>
            <div className={styles.modalFields}>
              <div className={styles.modalField}>
                <label>Discount %</label>
                <input type="number" value={flashPercent} onChange={e => setFlashPercent(e.target.value)} placeholder="20" min="1" max="90" />
              </div>
              <div className={styles.modalField}>
                <label>Duration (hours)</label>
                <input type="number" value={flashHours} onChange={e => setFlashHours(e.target.value)} placeholder="24" min="1" max="72" />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setFlashModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={() => startFlashSale(flashModal)}>Start Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* Auction Modal */}
      {auctionModal && (
        <div className={styles.modalOverlay} onClick={() => setAuctionModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🔨 Start Auction</h3>
            <div className={styles.modalFields}>
              <div className={styles.modalField}>
                <label>Starting Price (IDR) *</label>
                <input type="number" value={auctionStart} onChange={e => setAuctionStart(e.target.value)} placeholder="100000" />
              </div>
              <div className={styles.modalField}>
                <label>Reserve Price (optional)</label>
                <input type="number" value={auctionReserve} onChange={e => setAuctionReserve(e.target.value)} placeholder="Min price to sell" />
              </div>
              <div className={styles.modalField}>
                <label>Buy Now Price (optional)</label>
                <input type="number" value={auctionBuyNow} onChange={e => setAuctionBuyNow(e.target.value)} placeholder="Instant buy price" />
              </div>
              <div className={styles.modalField}>
                <label>Duration (hours, max 6)</label>
                <input type="number" value={auctionDuration} onChange={e => setAuctionDuration(e.target.value)} placeholder="6" min="1" max="6" />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setAuctionModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={() => startAuction(auctionModal)} disabled={!auctionStart}>Start Auction</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
