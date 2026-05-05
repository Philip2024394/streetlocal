import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getProducts } from '@/services/productService'
import styles from './MicroShop.module.css'

function formatPrice(price, currency = 'GBP') {
  const symbols = { GBP: '£', USD: '$', EUR: '€' }
  const sym = symbols[currency] ?? currency + ' '
  return `${sym}${parseFloat(price).toFixed(2)}`
}

function Lightbox({ product, onClose }) {
  // Close on backdrop click or Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className={styles.lightboxBackdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
      <div className={styles.lightboxCard} onClick={e => e.stopPropagation()}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className={styles.lightboxImg} />
          : <div className={styles.lightboxPlaceholder}><span>🛍️</span></div>
        }
        <div className={styles.lightboxBody}>
          <p className={styles.lightboxName}>{product.name}</p>
          {product.description && <p className={styles.lightboxDesc}>{product.description}</p>}
          <p className={styles.lightboxPrice}>{formatPrice(product.price, product.currency)}</p>
        </div>
        <button className={styles.lightboxClose} onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>,
    document.body
  )
}

const MODE_CONFIG = {
  shop:     { icon: '🛍️', title: 'Shop',     emptyIcon: '🛒', emptyText: 'No products listed yet' },
  menu:     { icon: '📋', title: 'Menu',     emptyIcon: '🍽️', emptyText: 'Menu coming soon'        },
  services: { icon: '🗒️', title: 'Services', emptyIcon: '✅', emptyText: 'Services coming soon'    },
}

/**
 * Read-only micro shop/menu/services grid shown on a user's profile.
 * Props:
 *  userId  — whose products to load
 *  visible — whether this tab is active (avoids fetching when hidden)
 *  mode    — 'shop' | 'menu' | 'services' (default: 'shop')
 */
export default function MicroShop({ userId, visible = true, mode = 'shop' }) {
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.shop
  const [products,  setProducts] = useState([])
  const [loading,   setLoading]  = useState(false)
  const [fetched,   setFetched]  = useState(false)
  const [selected,  setSelected] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getProducts(userId)
      setProducts(data)
    } catch {
      setProducts([]) // table may not exist yet — empty state handles it
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [userId])

  useEffect(() => {
    if (visible && !fetched) load()
  }, [visible, fetched, load])

  if (loading) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>{cfg.icon}</span>
          <span className={styles.headerTitle}>{cfg.title}</span>
        </header>
        <div className={styles.skeletonGrid}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <span className={styles.headerIcon}>{cfg.icon}</span>
          <span className={styles.headerTitle}>{cfg.title}</span>
        </header>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>{cfg.emptyIcon}</span>
          <p className={styles.emptyText}>{cfg.emptyText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.headerIcon}>{cfg.icon}</span>
        <span className={styles.headerTitle}>{cfg.title}</span>
        <span className={styles.headerCount}>{products.length} item{products.length !== 1 ? 's' : ''}</span>
      </header>

      <div className={styles.grid}>
        {products.map(p => (
          <button
            key={p.id}
            className={styles.card}
            onClick={() => setSelected(p)}
            aria-label={`${p.name} — ${formatPrice(p.price, p.currency)}`}
          >
            <div className={styles.imageWrap}>
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className={styles.image} loading="lazy" />
                : <div className={styles.imagePlaceholder}><span>🛍️</span></div>
              }
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardName}>{p.name}</p>
              <p className={styles.cardPrice}>{formatPrice(p.price, p.currency)}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && <Lightbox product={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
