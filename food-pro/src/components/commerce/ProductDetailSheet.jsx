import { useState, useMemo, lazy, Suspense } from 'react'
import styles from './ProductDetailSheet.module.css'
import SafeTradeModal from './SafeTradeModal'
import FreightCompaniesSheet from './FreightCompaniesSheet'
import ReturnDetailsSheet from './ReturnDetailsSheet'
import MakeOfferSheet from './MakeOfferSheet'
import { trackProductView } from './BuyerProfileSheet'
import ProductReviewPage from './ProductReviewPage'
import SellerVideoPlayer from './SellerVideoPlayer'

const ImageGalleryViewer = lazy(() => import('./ImageGalleryViewer'))
const SimilarProducts = lazy(() => import('./SimilarProducts'))

function formatIDR(val) {
  const n = parseFloat(val) || 0
  if (n === 0) return '—'
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1).replace('.', ',')}jt`
  }
  if (n >= 1_000) return `${n.toLocaleString('id-ID')}rp`
  return `${n}rp`
}

function getLabel(opt) { return typeof opt === 'object' ? opt.label : opt }
function getImage(opt) { return typeof opt === 'object' ? opt.image ?? null : null }

// Map color names to CSS colors for dot display
const COLOR_MAP = {
  black:'#111',white:'#f5f5f5',red:'#dc2626',blue:'#2563eb',navy:'#1e3a5f',
  green:'#16a34a',brown:'#78350f',tan:'#d2b48c',grey:'#6b7280',gray:'#6b7280',
  pink:'#ec4899',purple:'#9333ea',orange:'#ea580c',yellow:'#eab308',
  gold:'#d4a017',silver:'#c0c0c0',beige:'#f5f0e1',cream:'#fffdd0',
  'dark brown':'#3e1f00',cognac:'#9a3e00','rose gold':'#b76e79',
  maroon:'#800000',coral:'#ff7f50',teal:'#0d9488',olive:'#808000',
  burgundy:'#800020',charcoal:'#36454f',ivory:'#fffff0',khaki:'#c3b091',
  mint:'#98ff98',peach:'#ffcba4',lavender:'#e6e6fa',turquoise:'#40e0d0',
}
function getColorCSS(label) {
  return COLOR_MAP[label.toLowerCase()] ?? null
}

export default function ProductDetailSheet({ product, onClose, sellerWa, sellerName, sellerId, onAddToCart, onRemoveFromCart, getCartQty, totalCartQty, onOpenCart, onOrderViaChat, onMakeOffer }) {
  const [selected,    setSelected]    = useState({})
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSpecs,   setShowSpecs]   = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStart, setGalleryStart] = useState(0)
  const [freightOpen, setFreightOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [safeTradeOpen, setSafeTradeOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)

  const activeImage = useMemo(() => {
    if (!product) return null
    const colorVariants = product.variants?.color
    if (colorVariants) {
      const selectedLabel = selected.color ?? getLabel(colorVariants[0])
      const match = colorVariants.find(v => getLabel(v) === selectedLabel)
      if (match && getImage(match)) return getImage(match)
    }
    return product.image ?? null
  }, [selected.color, product])

  // Track product view for recently viewed
  useMemo(() => { if (product) trackProductView(product) }, [product?.id]) // eslint-disable-line

  if (!product) return null

  const variantKeys = product.variants ? Object.keys(product.variants) : []

  // Build a stable variant string for cart keying
  const variantStr = variantKeys.length
    ? variantKeys.map(k => selected[k] ?? getLabel(product.variants[k][0])).join(' / ')
    : null

  const cartQty = getCartQty ? getCartQty(product.id, variantStr) : 0

  function handleAddToCart() {
    if (onAddToCart) onAddToCart(product, variantStr)
  }

  // All orders go through in-app chat — no WhatsApp redirect
  const waLink = null

  function handleSpecsBtn() {
    setShowSpecs(v => !v)
  }

  const hasSpecs = product.specs && Object.keys(product.specs).length > 0

  return (
    <div className={styles.page}>

      {/* Background image — tap to open gallery */}
      {activeImage
        ? <img key={activeImage} src={activeImage} alt={product.name} className={styles.bgImg} onClick={() => { setGalleryStart(0); setGalleryOpen(true) }} />
        : <div className={styles.bgFallback}><span className={styles.bgEmoji}>📦</span></div>
      }

      {/* Thumbnail strip — shown when product has multiple images */}
      {(product.images?.length > 1 || (product.variants?.color && product.variants.color.some(v => getImage(v)))) && (
        <div style={{
          position:'absolute', bottom:120, left:0, right:0, zIndex:5,
          display:'flex', justifyContent:'center', gap:6, padding:'0 16px',
        }}>
          {(product.images ?? [activeImage]).map((url, i) => (
            <button key={i} onClick={() => { setGalleryStart(i); setGalleryOpen(true) }}
              style={{
                width:44, height:44, borderRadius:8, overflow:'hidden', padding:0,
                border: '2px solid rgba(255,255,255,0.4)', cursor:'pointer',
                background:'#000', boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
                flexShrink:0,
              }}>
              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen gallery viewer */}
      {galleryOpen && (
        <Suspense fallback={null}>
          <ImageGalleryViewer
            images={product.images ?? [activeImage].filter(Boolean)}
            startIndex={galleryStart}
            onClose={() => setGalleryOpen(false)}
          />
        </Suspense>
      )}

      {/* Gradient — hidden when overlay is off so image shows fully */}
      <div className={[styles.bgGrad, showOverlay ? '' : styles.bgGradHidden].join(' ')} />

      {/* Watermark stamp */}
      {product.watermark && (
        <div className={styles.watermarkOverlay}>
          <span className={styles.watermarkText}>{product.watermark.toUpperCase()}</span>
        </div>
      )}

      {/* Back button */}
      <button className={styles.backBtn} onClick={onClose}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      {/* Floating side panel — top-right */}
      <div className={styles.sidePanel}>
        {/* Cart count — tap to open cart */}
        {totalCartQty > 0 && (
          <button className={styles.sidePanelCartBtn} onClick={onOpenCart} aria-label="View cart">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className={styles.sidePanelCartCount}>{totalCartQty}</span>
          </button>
        )}

        {/* Eye — toggle overlay */}
        <button
          className={[styles.sidePanelBtn, showOverlay ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={() => { setShowOverlay(v => !v); if (showSpecs) setShowSpecs(false) }}
          aria-label="Toggle text overlay"
          title={showOverlay ? 'Hide info' : 'Show info'}
        >
          {showOverlay
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
        </button>

        {/* Specs / list icon */}
        <button
          className={[styles.sidePanelBtn, showOverlay && showSpecs ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={handleSpecsBtn}
          aria-label="Product specifications"
          title="Specifications"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6"  x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6"  x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>

        {/* Freight / delivery companies */}
        <button
          className={[styles.sidePanelBtn, freightOpen ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={() => setFreightOpen(true)}
          aria-label="Delivery options"
          title="Delivery options"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </button>

        {/* Return policy */}
        <button
          className={[styles.sidePanelBtn, returnOpen ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={() => setReturnOpen(true)}
          aria-label="Return policy"
          title="Return policy"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        {/* Make an Offer — only if seller allows offers */}
        {(product.allowOffers !== false) && (
          <button
            className={[styles.sidePanelBtn, offerOpen ? styles.sidePanelBtnActive : ''].join(' ')}
            onClick={() => setOfferOpen(true)}
            aria-label="Make an offer"
            title="Make an offer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Specs slider — slides from left, 70% width, dims rest of screen */}
      {showSpecs && hasSpecs && (
        <>
          <div className={styles.specsBackdrop} onClick={() => setShowSpecs(false)} />
          <div className={styles.specsPanel}>
            <div className={styles.specsPanelHeader}>
              <span className={styles.specsPanelTitle}>Specifications</span>
              <button className={styles.specsPanelClose} onClick={() => setShowSpecs(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.specsList}>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className={styles.specsItem}>
                  <span className={styles.specsItemKey}>{k}</span>
                  <span className={styles.specsItemVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom overlay */}
      <div className={[styles.overlay, showOverlay ? '' : styles.overlayHidden].join(' ')}>

        {/* ── Details view ── */}
          <>

            <h2 className={styles.name}>{product.name}</h2>
            {product.flashSale?.active && product.flashSale.endsAt > Date.now() ? (
              <div className={styles.priceRow}>
                <span className={styles.priceSale}>{formatIDR(Math.round(product.price * (1 - product.flashSale.discountPercent / 100)))}</span>
                <span className={styles.priceOriginal}>{formatIDR(product.price)}</span>
                <span className={styles.discountTag}>-{product.flashSale.discountPercent}%</span>
              </div>
            ) : (
              <div className={styles.price}>{formatIDR(product.price)}</div>
            )}

            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            {/* Variants */}
            {variantKeys.map(key => {
              const opts = product.variants[key]
              const selectedLabel = selected[key] ?? getLabel(opts[0])
              const isColorKey = key === 'color'

              return (
                <div key={key} className={styles.variantGroup}>
                  <div className={styles.variantLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {selected[key] && <span className={styles.variantSelected}> — {selected[key]}</span>}
                  </div>
                  <div className={styles.variantOptions}>
                    {opts.map(opt => {
                      const label    = getLabel(opt)
                      const img      = getImage(opt)
                      const isActive = selectedLabel === label
                      const cssColor = isColorKey ? getColorCSS(label) : null

                      // Color variant → round dot with outer ring
                      if (isColorKey) {
                        return (
                          <button
                            key={label}
                            onClick={() => setSelected(prev => ({ ...prev, [key]: label }))}
                            title={label}
                            aria-label={label}
                            style={{
                              width: 36, height: 36, borderRadius: '50%', padding: 0,
                              border: isActive ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.15)',
                              background: 'transparent', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'border-color 0.15s, box-shadow 0.15s',
                              boxShadow: isActive ? '0 0 0 3px rgba(141,198,63,0.25)' : 'none',
                            }}
                          >
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%', display: 'block',
                              background: img ? `url(${img}) center/cover` : (cssColor ?? '#888'),
                              border: label.toLowerCase() === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            }} />
                          </button>
                        )
                      }

                      // Non-color variants (size, etc.) → text buttons
                      return (
                        <button
                          key={label}
                          className={[styles.variantBtn, isActive ? styles.variantBtnActive : ''].join(' ')}
                          onClick={() => setSelected(prev => ({ ...prev, [key]: label }))}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Brand name */}
            {product.brand_name && (
              <div className={styles.brandRow}>
                <span className={styles.brandLabel}>Brand</span>
                <span className={styles.brandName}>{product.brand_name}</span>
              </div>
            )}

            {/* Stock + payment badges */}
            <div className={styles.stockRow}>
              <span className={styles.stockDot} style={{ background: (product.stock ?? 0) > 0 ? '#8DC63F' : '#EF4444' }} />
              <span className={styles.stockText}>
                {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
              {product.cashOnDelivery && (
                <span className={styles.codBadge}>COD</span>
              )}
              {product.safeTrade?.enabled && (
                <span className={styles.safeTradeBadge} onClick={() => setSafeTradeOpen(true)}>Safe Trade</span>
              )}
            </div>

            {/* Dispatch time + custom branding badges */}
            <div className={styles.infoBadges}>
              {product.dispatch_time && (
                <span className={styles.dispatchBadge}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {' '}Dispatch: {product.dispatch_time}
                </span>
              )}
              {product.custom_branding && product.custom_branding !== 'Not available' && (
                <span className={styles.brandingBadge}>
                  {product.custom_branding}
                </span>
              )}
            </div>


            {/* Thumbnail strip + Cart button row */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              <div style={{ flex:1, minWidth:0, display:'flex', gap:6, overflowX:'auto', WebkitOverflowScrolling:'touch', scrollbarWidth:'none', paddingBottom:2 }}>
                {(product.images?.length > 1 ? product.images : [activeImage].filter(Boolean)).map((url, i) => (
                  <button key={i} onClick={() => { setGalleryStart(i); setGalleryOpen(true) }}
                    style={{ width:56, height:56, borderRadius:10, overflow:'hidden', padding:0, border:'2px solid rgba(255,255,255,0.15)', cursor:'pointer', background:'#000', flexShrink:0, boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                    <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </button>
                ))}
              </div>
              <div style={{ flexShrink:0, display:'flex', gap:6 }}>
                {onAddToCart && (
                  cartQty > 0 ? (
                    <div className={styles.qtyCompact}>
                      <button className={styles.qtyCompactBtn} onClick={() => onRemoveFromCart(product.id, variantStr)}>−</button>
                      <span className={styles.qtyCompactNum}>{cartQty}</span>
                      <button className={styles.qtyCompactBtn} onClick={handleAddToCart}>+</button>
                    </div>
                  ) : (
                    <button onClick={handleAddToCart} disabled={(product.stock ?? 0) === 0}
                      style={{ height:42, padding:'0 14px', borderRadius:10, background:'rgba(141,198,63,0.15)', border:'1px solid rgba(141,198,63,0.35)', color:'#8DC63F', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', opacity:(product.stock ?? 0) === 0 ? 0.3 : 1 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight:4, verticalAlign:'middle' }}>
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      Add
                    </button>
                  )
                )}
              </div>
            </div>
            {/* Order via Chat — full width below */}
            {onOrderViaChat && (
              <div style={{ marginTop:8 }}>
                <button className={styles.orderBtn} onClick={() => onOrderViaChat({ product, variantStr, qty: Math.max(cartQty, 1), sellerName, sellerId })}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Order via Chat
                </button>
              </div>
            )}

            {/* Similar products recommendation */}
            <Suspense fallback={null}>
              <SimilarProducts
                currentProduct={product}
                onSelect={(p) => {
                  // Scroll to top and switch to the selected product
                  // The parent component handles product switching
                }}
              />
            </Suspense>
          </>
      </div>

      {/* Modals — each component internally uses createPortal to document.body */}
      <FreightCompaniesSheet
        open={freightOpen}
        onClose={() => setFreightOpen(false)}
        product={product}
      />
      <ReturnDetailsSheet
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        product={product}
      />
      <SafeTradeModal
        open={safeTradeOpen}
        onClose={() => setSafeTradeOpen(false)}
        product={product}
        sellerName={sellerName}
      />
      <MakeOfferSheet
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        product={product}
        onSubmitOffer={(offer) => {
          onMakeOffer?.({ ...offer, sellerName, sellerId })
          setOfferOpen(false)
        }}
      />
      <SellerVideoPlayer
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        videoUrl={product.video_url}
        sellerName={sellerName}
      />
      <ProductReviewPage
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        productName={product.name}
        productId={product.id}
      />
    </div>
  )
}
