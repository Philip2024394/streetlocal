import { useState, useEffect, useCallback } from 'react'
import {
  fetchProducts, fetchOrders, fetchStats,
  updateOrderStatus, toggleProductActive, DEMO_STATS,
} from '@/services/commerceService'
import ProductCatalogSlider from './ProductCatalogSlider'
import DeliveryPricingEditor from './DeliveryPricingEditor'
import { createAuction, getAuctions, cancelAuction, editAuction, canEditAuction, fmtIDR, AUCTION_STATUS } from '@/services/auctionService'
import SellerAnalytics from './SellerAnalytics'
import AddProductSheet from './AddProductSheet'
import styles from './EchoCommercePanel.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// EchoCommercePanel — right-side seller control panel (280px, collapsible)
// ─────────────────────────────────────────────────────────────────────────────

const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered']

const STATUS_COLORS = {
  pending:   { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#FBBF24' },
  confirmed: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#A78BFA' },
  shipped:   { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#818CF8' },
  delivered: { bg: 'rgba(141,198,63,0.12)',  border: 'rgba(141,198,63,0.3)',  text: '#8DC63F' },
}

function StatCard({ label, value, icon }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export default function EchoCommercePanel({ userId, businessName, open: externalOpen, onToggle }) {
  const [open, setOpen]               = useState(externalOpen ?? false)
  const [stats, setStats]             = useState(DEMO_STATS)
  const [orders, setOrders]           = useState([])
  const [products, setProducts]       = useState([])
  const [section, setSection]         = useState('orders') // orders | products | shipping
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [deliveryPricingOpen, setDeliveryPricingOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [deliveryPricingProduct, setDeliveryPricingProduct] = useState(null)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading]         = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [s, o, p] = await Promise.all([fetchStats(userId), fetchOrders(userId), fetchProducts(userId)])
    setStats(s)
    setOrders(o)
    setProducts(p)
    setLoading(false)
  }, [userId])

  useEffect(() => { if (open) load() }, [open, load])

  // sync external open prop
  useEffect(() => { if (externalOpen !== undefined) setOpen(externalOpen) }, [externalOpen])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    onToggle?.(next)
  }

  async function advanceOrder(orderId, currentStatus) {
    const idx  = ORDER_STATUS_FLOW.indexOf(currentStatus)
    const next = ORDER_STATUS_FLOW[idx + 1]
    if (!next) return
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o))
    await updateOrderStatus(orderId, next)
  }

  async function handleToggleProduct(productId, current) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, active: !current } : p))
    await toggleProductActive(productId, !current)
  }

  return (
    <>
      {/* Slide-in panel */}
      <div className={[styles.panel, open ? styles.panelOpen : ''].join(' ')}>
        {/* Tab on left edge to open/close */}
        <button className={styles.tab} onClick={toggleOpen} title={open ? 'Close panel' : 'Open seller panel'}>
          {open ? '›' : '‹'}
          {!open && <span className={styles.tabLabel}>Shop</span>}
        </button>

        <div className={styles.inner}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <img src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752" alt="Indoo Market" style={{ height:22, objectFit:'contain' }} />
              <span className={styles.commerce}>Seller</span>
            </div>
            <button className={styles.headerCatalogBtn} onClick={() => setAnalyticsOpen(true)}>
              📊
            </button>
            <button className={styles.headerCatalogBtn} onClick={() => setCatalogOpen(true)}>
              📦
            </button>
          </div>

          {/* Business name */}
          {businessName && (
            <div className={styles.bizName}>{businessName}</div>
          )}

          {/* Stats row */}
          <div className={styles.statsRow}>
            <StatCard icon="👁" label="Views"   value={stats.views ?? 0} />
            <StatCard icon="🛒" label="Carts"   value={stats.cartAdds ?? 0} />
            <StatCard icon="💬" label="WA Clicks" value={stats.whatsappClicks ?? 0} />
            <StatCard icon="📦" label="Orders"  value={stats.orders ?? 0} />
          </div>

          {/* Section tabs */}
          <div className={styles.sectionTabs}>
            {['orders', 'products', 'shipping', 'payment', 'auction'].map(s => (
              <button
                key={s}
                className={[styles.sectionTab, section === s ? styles.sectionTabActive : ''].join(' ')}
                onClick={() => setSection(s)}
              >
                {s === 'orders' ? '🧾' : s === 'products' ? '📦' : s === 'shipping' ? '🚚' : s === 'payment' ? '🛡' : '🔨'}
              </button>
            ))}
          </div>

          {loading && <div className={styles.loading}>Loading…</div>}

          {/* ── Orders section ── */}
          {!loading && section === 'orders' && (
            <div className={styles.list}>
              {/* Bulk action bar */}
              {selectedOrders.size > 0 && (
                <div className={styles.bulkBar}>
                  <span className={styles.bulkCount}>{selectedOrders.size} selected</span>
                  <button className={styles.bulkBtn} onClick={() => {
                    selectedOrders.forEach(id => {
                      const o = orders.find(x => x.id === id)
                      if (o) advanceOrder(id, o.status)
                    })
                    setSelectedOrders(new Set())
                  }}>Advance All →</button>
                  <button className={styles.bulkBtnClear} onClick={() => setSelectedOrders(new Set())}>Clear</button>
                </div>
              )}

              {orders.length === 0 && (
                <div className={styles.empty}>No orders yet — share your store link to get started!</div>
              )}
              {orders.map(order => {
                const color = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                const canAdvance = ORDER_STATUS_FLOW.indexOf(order.status) < ORDER_STATUS_FLOW.length - 1
                const isSelected = selectedOrders.has(order.id)
                return (
                  <div key={order.id} className={`${styles.orderCard} ${isSelected ? styles.orderCardSelected : ''}`}>
                    <div className={styles.orderTop}>
                      <input type="checkbox" checked={isSelected} onChange={() => {
                        setSelectedOrders(prev => {
                          const next = new Set(prev)
                          next.has(order.id) ? next.delete(order.id) : next.add(order.id)
                          return next
                        })
                      }} className={styles.orderCheck} />
                      <span className={styles.orderProduct}>{order.product}</span>
                      <span
                        className={styles.orderStatus}
                        style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className={styles.orderMeta}>
                      <span>{order.buyer}</span>
                      <span>Qty: {order.qty}</span>
                      <span>${(order.total ?? 0).toFixed(2)}</span>
                      <span className={styles.orderTime}>{order.time}</span>
                    </div>
                    {/* Show tracking info if shipped */}
                    {order.trackingNo && (
                      <div className={styles.trackingInfo}>
                        <span className={styles.trackingLabel}>📦 {order.carrierName ?? 'Carrier'}: {order.trackingNo}</span>
                      </div>
                    )}
                    {canAdvance && (
                      <button
                        className={styles.advanceBtn}
                        onClick={() => {
                          const nextStatus = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(order.status) + 1]
                          if (nextStatus === 'shipped') {
                            const carrier = prompt('Select carrier:\n\n1=JNE  2=J&T  3=SiCepat  4=Ninja  5=Pos Indonesia\n6=TIKI  7=Lion Parcel  8=Anteraja  9=Other\n\nEnter number:')
                            const carrierMap = { '1':'jne','2':'jnt_express','3':'sicepat','4':'ninja','5':'pos_indo','6':'tiki','7':'lion_parcel','8':'antaraja','9':'other' }
                            const carrierNames = { '1':'JNE','2':'J&T Express','3':'SiCepat','4':'Ninja Xpress','5':'Pos Indonesia','6':'TIKI','7':'Lion Parcel','8':'Anteraja','9':'Other' }
                            const trackingNo = prompt('Enter tracking number:')
                            if (trackingNo?.trim()) {
                              order.trackingNo = trackingNo.trim()
                              order.carrierKey = carrierMap[carrier] ?? 'other'
                              order.carrierName = carrierNames[carrier] ?? 'Carrier'
                            }
                          }
                          advanceOrder(order.id, order.status)
                        }}
                      >
                        Mark as {ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(order.status) + 1]} →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Products section ── */}
          {!loading && section === 'products' && (
            <div className={styles.list}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={styles.addProductBtn} onClick={() => { setEditingProduct(null); setAddProductOpen(true) }}>
                  + Add Product
                </button>
                <button className={styles.addProductBtn} onClick={() => setCatalogOpen(true)} style={{ background: 'rgba(255,255,255,0.04)' }}>
                  View Catalogue
                </button>
              </div>
              {products.map(p => (
                <div key={p.id} className={[styles.productRow, p.active ? '' : styles.productInactive].join(' ')}>
                  {p.image && (
                    <img src={p.image} alt={p.name} className={styles.productThumb} />
                  )}
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{p.name}</span>
                    <span className={styles.productPrice}>${(p.price ?? 0).toFixed(2)}</span>
                    <span className={styles.productStock}>Stock: {p.stock ?? '–'}</span>
                    {p.flashSale?.active && (
                      <span className={styles.flashBadge}>⚡ -{p.flashSale.discountPercent}%</span>
                    )}
                  </div>
                  <div className={styles.productActions}>
                    <button
                      className={[styles.toggleActive, p.active ? styles.toggleOn : styles.toggleOff].join(' ')}
                      onClick={() => handleToggleProduct(p.id, p.active)}
                      title={p.active ? 'Hide product' : 'Show product'}
                    >
                      {p.active ? 'Live' : 'Off'}
                    </button>
                    <button
                      className={[styles.flashToggle, p.flashSale?.active ? styles.flashToggleOn : ''].join(' ')}
                      onClick={() => {
                        if (p.flashSale?.active) {
                          setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, flashSale: { ...pr.flashSale, active: false } } : pr))
                        } else {
                          const pct = prompt('Discount % (e.g. 10, 25, 50):')
                          if (pct && !isNaN(pct) && Number(pct) > 0 && Number(pct) <= 90) {
                            const hrs = prompt('Sale duration in hours (max 48):')
                            const duration = Math.min(48, Math.max(1, Number(hrs) || 6))
                            setProducts(prev => prev.map(pr => pr.id === p.id ? {
                              ...pr,
                              flashSale: { active: true, discountPercent: Number(pct), endsAt: Date.now() + duration * 3600000 }
                            } : pr))
                          }
                        }
                      }}
                      title={p.flashSale?.active ? 'Stop flash sale' : 'Start flash sale'}
                    >
                      ⚡
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Shipping section ── */}
          {!loading && section === 'shipping' && (
            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Shipping Options</div>
              {[
                { icon: '🏃', label: 'Same-day delivery',      sub: 'Within city — 2-4 hrs',      checked: true },
                { icon: '📦', label: 'Standard shipping',       sub: '3-5 business days',          checked: true },
                { icon: '✈️',  label: 'International shipping', sub: '7-14 business days',         checked: false },
                { icon: '🤝', label: 'Click & Collect',        sub: 'Buyer picks up from you',    checked: true },
                { icon: '💬', label: 'WhatsApp order only',    sub: 'Chat before completing',     checked: false },
              ].map(opt => (
                <label key={opt.label} className={styles.shippingOpt}>
                  <input type="checkbox" defaultChecked={opt.checked} className={styles.shippingCheck} />
                  <span className={styles.shippingIcon}>{opt.icon}</span>
                  <div className={styles.shippingText}>
                    <span className={styles.shippingLabel}>{opt.label}</span>
                    <span className={styles.shippingSub}>{opt.sub}</span>
                  </div>
                </label>
              ))}
              <button className={styles.saveShippingBtn}>Save Shipping Settings</button>

              {/* Per-product delivery pricing */}
              <div className={styles.shippingTitle} style={{ marginTop: 16 }}>Product Delivery Pricing</div>
              <div className={styles.shippingSub2}>Set delivery prices per product, per carrier</div>
              {products.map(p => (
                <button
                  key={p.id}
                  className={styles.deliveryPricingBtn}
                  onClick={() => { setDeliveryPricingProduct(p); setDeliveryPricingOpen(true) }}
                >
                  <span className={styles.deliveryPricingName}>{p.name}</span>
                  <span className={styles.deliveryPricingArrow}>→</span>
                </button>
              ))}
              {products.length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>Add products first to set delivery pricing</div>
              )}
            </div>
          )}

          {/* ── Payment section (COD + Safe Trade) ── */}
          {!loading && section === 'payment' && (
            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Cash on Delivery</div>
              <div className={styles.shippingSub2}>Enable COD per product</div>
              {products.map(p => (
                <label key={p.id} className={styles.shippingOpt}>
                  <input
                    type="checkbox"
                    checked={p.cashOnDelivery ?? false}
                    onChange={() => setProducts(prev => prev.map(pr =>
                      pr.id === p.id ? { ...pr, cashOnDelivery: !pr.cashOnDelivery } : pr
                    ))}
                    className={styles.shippingCheck}
                  />
                  <div className={styles.shippingText}>
                    <span className={styles.shippingLabel}>{p.name}</span>
                    <span className={styles.shippingSub}>{p.cashOnDelivery ? 'COD enabled' : 'COD disabled'}</span>
                  </div>
                </label>
              ))}
              {products.length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>Add products first</div>
              )}

              <div className={styles.shippingTitle} style={{ marginTop: 16 }}>Safe Trade</div>
              <div className={styles.shippingSub2}>Buyer protection via PayPal or Escrow</div>

              {products.map(p => {
                const st = p.safeTrade ?? {}
                return (
                  <div key={p.id} className={styles.safeTradeProduct}>
                    <span className={styles.safeTradeProductName}>{p.name}</span>
                    <div className={styles.safeTradeToggles}>
                      <label className={styles.safeTradeToggle}>
                        <input
                          type="checkbox"
                          checked={st.enabled ?? false}
                          onChange={() => setProducts(prev => prev.map(pr =>
                            pr.id === p.id ? { ...pr, safeTrade: { ...pr.safeTrade, enabled: !(pr.safeTrade?.enabled) } } : pr
                          ))}
                          className={styles.shippingCheck}
                        />
                        <span className={styles.safeTradeLabel}>Enabled</span>
                      </label>
                      {st.enabled && (
                        <>
                          <label className={styles.safeTradeToggle}>
                            <input
                              type="checkbox"
                              checked={st.paypal ?? false}
                              onChange={() => setProducts(prev => prev.map(pr =>
                                pr.id === p.id ? { ...pr, safeTrade: { ...pr.safeTrade, paypal: !(pr.safeTrade?.paypal) } } : pr
                              ))}
                              className={styles.shippingCheck}
                            />
                            <span className={styles.safeTradeLabel}>PayPal</span>
                          </label>
                          <label className={styles.safeTradeToggle}>
                            <input
                              type="checkbox"
                              checked={st.escrow ?? false}
                              onChange={() => setProducts(prev => prev.map(pr =>
                                pr.id === p.id ? { ...pr, safeTrade: { ...pr.safeTrade, escrow: !(pr.safeTrade?.escrow) } } : pr
                              ))}
                              className={styles.shippingCheck}
                            />
                            <span className={styles.safeTradeLabel}>Escrow</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              {products.length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>Add products first</div>
              )}

              <button className={styles.saveShippingBtn}>Save Payment Settings</button>
            </div>
          )}

          {/* ── Auction section ── */}
          {!loading && section === 'auction' && (
            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Create Auction</div>
              <div className={styles.shippingSub2}>Select a product to auction (max 6 hours)</div>
              {products.filter(p => p.active).map(p => (
                <button
                  key={p.id}
                  className={styles.deliveryPricingBtn}
                  onClick={() => {
                    const startPrice = prompt('Starting price (Rp) — includes delivery within Indonesia:')
                    if (!startPrice || isNaN(startPrice)) return
                    const reserve = prompt('Reserve price (Rp):\n\n• Set a reserve = item only sells if bidding reaches this price\n• Leave empty = NO reserve, item sells to highest bidder regardless of price')
                    const buyNowPr = prompt('Buy Now price (Rp) — leave empty for no Buy Now:')
                    const itemCond = prompt('Item condition:\n\n1 = New Unused\n2 = Used Good Condition\n3 = Needs Repair\n\nEnter 1, 2, or 3:')
                    const condMap = { '1': 'new_unused', '2': 'used_good', '3': 'needs_repair' }
                    const desc = prompt('Short description for auction (max 300 characters):')
                    const hours = prompt('Auction duration (hours, max 6):')
                    const dur = Math.min(6, Math.max(1, Number(hours) || 4))
                    createAuction({
                      productId: p.id,
                      productName: p.name,
                      productImage: p.image,
                      description: desc ? desc.slice(0, 300) : p.description ?? '',
                      material: p.specs?.material ?? '',
                      weight: p.weight_grams ? `${p.weight_grams}g` : '',
                      dimensions: p.dimensions ?? '',
                      condition: p.condition ?? 'new',
                      itemCondition: condMap[itemCond] ?? 'new_unused',
                      sellerId: userId,
                      sellerName: businessName ?? 'Seller',
                      startPrice: Number(startPrice),
                      reservePrice: reserve ? Number(reserve) : null,
                      buyNowPrice: buyNowPr ? Number(buyNowPr) : null,
                      startTime: Date.now(),
                      endTime: Date.now() + dur * 3600000,
                    })
                    alert(`Auction started for ${p.name}\nStart: Rp ${Number(startPrice).toLocaleString('id-ID')}\n${reserve ? 'Reserve: Rp ' + Number(reserve).toLocaleString('id-ID') : '⚠️ No Reserve — sells to highest bidder'}\n${buyNowPr ? 'Buy Now: Rp ' + Number(buyNowPr).toLocaleString('id-ID') : 'No Buy Now'}\nDuration: ${dur} hours\nPrice includes delivery · 10% commission on sale`)
                  }}
                >
                  <span className={styles.deliveryPricingName}>{p.name} — {fmtIDR(p.price)}</span>
                  <span className={styles.deliveryPricingArrow}>🔨</span>
                </button>
              ))}

              <div className={styles.shippingTitle} style={{ marginTop: 16 }}>My Auctions</div>
              {getAuctions().filter(a => a.sellerId === userId).length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>No auctions yet</div>
              )}
              {getAuctions().filter(a => a.sellerId === userId).map(a => (
                <div key={a.id} className={styles.deliveryPricingBtn} style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <span className={styles.deliveryPricingName}>{a.productName}</span>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)', alignItems: 'center' }}>
                    <span>Current: {fmtIDR(a.currentPrice)}</span>
                    <span>{a.bidCount} bids</span>
                    <span style={{ color: a.status === AUCTION_STATUS.LIVE ? '#8DC63F' : a.status === AUCTION_STATUS.PAID ? '#8DC63F' : '#EF4444', fontWeight: 700 }}>
                      {a.status}
                    </span>
                  </div>
                  {canEditAuction(a) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button
                        className={styles.flashToggle}
                        style={{ width: 'auto', padding: '2px 8px', fontSize: 9, color: '#8DC63F', borderColor: 'rgba(141,198,63,0.3)' }}
                        onClick={() => {
                          const price = prompt('New starting price (Rp):', a.startPrice)
                          if (price && !isNaN(price)) {
                            editAuction(a.id, { startPrice: Number(price) })
                            alert('Auction updated')
                          }
                        }}
                      >Edit</button>
                      <button
                        className={styles.flashToggle}
                        style={{ width: 'auto', padding: '2px 8px', fontSize: 9, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        onClick={() => {
                          if (confirm('Cancel this auction?')) {
                            cancelAuction(a.id)
                            alert('Auction cancelled')
                          }
                        }}
                      >Cancel</button>
                    </div>
                  )}
                  {a.bidCount > 0 && a.status === AUCTION_STATUS.LIVE && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2, fontStyle: 'italic' }}>
                      Cannot edit or cancel — has bids
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product catalog slider */}
      <ProductCatalogSlider
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        userId={userId}
        products={products}
        onProductsChange={setProducts}
      />

      {/* Delivery pricing editor per product */}
      <DeliveryPricingEditor
        open={deliveryPricingOpen}
        onClose={() => { setDeliveryPricingOpen(false); setDeliveryPricingProduct(null) }}
        product={deliveryPricingProduct}
        onSave={(config) => {
          if (deliveryPricingProduct) {
            setProducts(prev => prev.map(p =>
              p.id === deliveryPricingProduct.id
                ? { ...p, deliveryPricing: config }
                : p
            ))
          }
          setDeliveryPricingOpen(false)
          setDeliveryPricingProduct(null)
        }}
      />

      <SellerAnalytics open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />

      <AddProductSheet
        open={addProductOpen}
        onClose={() => { setAddProductOpen(false); setEditingProduct(null) }}
        onSaved={() => { load(); setAddProductOpen(false); setEditingProduct(null) }}
        userId={userId}
        editProduct={editingProduct}
      />
    </>
  )
}
