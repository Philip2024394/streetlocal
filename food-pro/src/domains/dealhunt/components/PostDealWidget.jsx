import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './PostDealWidget.module.css'

const DISCOUNT_TIERS = [
  { pct: 10, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaa-removebg-preview.png' },
  { pct: 15, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaad-removebg-preview.png' },
  { pct: 20, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaada-removebg-preview.png' },
  { pct: 25, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadaf-removebg-preview.png' },
  { pct: 30, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafd-removebg-preview.png' },
  { pct: 35, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafde-removebg-preview.png' },
  { pct: 40, img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafdedd-removebg-preview.png' },
  { pct: 45, img: 'https://ik.imagekit.io/nepgaxllc/6789.png' },
  { pct: 50, img: 'https://ik.imagekit.io/nepgaxllc/Untitledttt-removebg-preview.png' },
]

const DEMO_ITEMS = {
  food: [
    { id: 'f1', name: 'Nasi Goreng', price: 35000, image: 'https://picsum.photos/seed/fg1/200/200' },
    { id: 'f2', name: 'Mie Ayam', price: 25000, image: 'https://picsum.photos/seed/fg2/200/200' },
    { id: 'f3', name: 'Ayam Bakar', price: 40000, image: 'https://picsum.photos/seed/fg3/200/200' },
    { id: 'f4', name: 'Es Teh Manis', price: 5000, image: 'https://picsum.photos/seed/fg4/200/200' },
    { id: 'f5', name: 'Bakso Urat', price: 30000, image: 'https://picsum.photos/seed/fg5/200/200' },
    { id: 'f6', name: 'Soto Ayam', price: 28000, image: 'https://picsum.photos/seed/fg6/200/200' },
  ],
  marketplace: [
    { id: 'p1', name: 'Leather Wallet', price: 250000, image: 'https://picsum.photos/seed/mp1/200/200' },
    { id: 'p2', name: 'Wireless Earbuds', price: 450000, image: 'https://picsum.photos/seed/mp2/200/200' },
    { id: 'p3', name: 'Phone Case', price: 85000, image: 'https://picsum.photos/seed/mp3/200/200' },
  ],
  _default: [
    { id: 's1', name: 'Service A', price: 150000, image: 'https://picsum.photos/seed/sv1/200/200' },
    { id: 's2', name: 'Service B', price: 250000, image: 'https://picsum.photos/seed/sv2/200/200' },
    { id: 's3', name: 'Premium Package', price: 400000, image: 'https://picsum.photos/seed/sv3/200/200' },
  ],
}

const DURATION_OPTS = [
  { label: '3 Hours', hours: 3 },
  { label: '6 Hours', hours: 6 },
  { label: '1 Day', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '7 Days', hours: 168 },
]

const DEAL_TYPES = [
  { id: 'eat_in', label: 'Eat In', icon: '🍽️' },
  { id: 'delivery', label: 'Delivery', icon: '🛵' },
  { id: 'pickup', label: 'Pick Up', icon: '🏪' },
]

const DOMAIN_LABELS = { food: 'dish', marketplace: 'product', massage: 'service', rentals: 'listing', rides: 'ride' }

function fmtRp(n) { return `Rp${(n ?? 0).toLocaleString('id-ID')}` }

export default function PostDealWidget({ open, onClose, onPosted, domain = 'food', sellerItems, sellerId, sellerName }) {
  const [step, setStep] = useState(1)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedDiscount, setSelectedDiscount] = useState(null)
  const [quantity, setQuantity] = useState(10)
  const [duration, setDuration] = useState(24)
  const [dealType, setDealType] = useState('pickup')

  const items = sellerItems?.length ? sellerItems : (DEMO_ITEMS[domain] ?? DEMO_ITEMS._default)
  const dealPrice = selectedItem && selectedDiscount ? Math.round(selectedItem.price * (1 - selectedDiscount / 100)) : 0

  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div className={styles.handle}><span /></div>

        {/* Progress dots */}
        <div className={styles.progress}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`${styles.progressDot} ${step >= s ? styles.progressDotActive : ''}`} />
          ))}
        </div>

        {/* Step 1 — Select Item */}
        {step === 1 && (
          <div className={styles.stepBody}>
            <h3 className={styles.stepTitle}>Select a {DOMAIN_LABELS[domain] ?? 'item'}</h3>
            <div className={styles.itemGrid}>
              {items.map(item => (
                <button
                  key={item.id}
                  className={`${styles.itemCard} ${selectedItem?.id === item.id ? styles.itemCardActive : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <img src={item.image} alt="" className={styles.itemImg} />
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>{fmtRp(item.price)}</span>
                </button>
              ))}
            </div>
            <button className={styles.nextBtn} disabled={!selectedItem} onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — Choose Discount */}
        {step === 2 && (
          <div className={styles.stepBody}>
            <button className={styles.backStep} onClick={() => setStep(1)}>← Back</button>
            <h3 className={styles.stepTitle}>Choose your discount</h3>
            <div className={styles.discountScroll}>
              {DISCOUNT_TIERS.map(tier => (
                <button
                  key={tier.pct}
                  className={`${styles.discountCard} ${selectedDiscount === tier.pct ? styles.discountCardActive : ''}`}
                  onClick={() => setSelectedDiscount(tier.pct)}
                >
                  <img src={tier.img} alt={`${tier.pct}%`} className={styles.discountCardImg} />
                  <span className={styles.discountCardPct}>{tier.pct}%</span>
                </button>
              ))}
            </div>
            {selectedItem && selectedDiscount && (
              <div className={styles.pricePreview}>
                <span className={styles.priceOrig}>{fmtRp(selectedItem.price)}</span>
                <span className={styles.priceArrow}>→</span>
                <span className={styles.priceDeal}>{fmtRp(dealPrice)}</span>
              </div>
            )}
            <button className={styles.nextBtn} disabled={!selectedDiscount} onClick={() => setStep(3)}>
              Next →
            </button>
          </div>
        )}

        {/* Step 3 — Quantity + Duration */}
        {step === 3 && (
          <div className={styles.stepBody}>
            <button className={styles.backStep} onClick={() => setStep(2)}>← Back</button>
            <h3 className={styles.stepTitle}>How many deals?</h3>

            {/* Quantity */}
            <div className={styles.qtyRow}>
              <button className={styles.qtyBtn} onClick={() => setQuantity(q => Math.max(5, q - 5))}>−</button>
              <span className={styles.qtyNum}>{quantity}</span>
              <button className={styles.qtyBtn} onClick={() => setQuantity(q => q + 5)}>+</button>
            </div>
            <div className={styles.quickBtns}>
              {[5, 10, 20, 50, 100].map(n => (
                <button key={n} className={`${styles.quickBtn} ${quantity === n ? styles.quickBtnActive : ''}`} onClick={() => setQuantity(n)}>{n}</button>
              ))}
            </div>

            {/* Duration */}
            <h4 className={styles.subLabel}>Duration</h4>
            <div className={styles.quickBtns}>
              {DURATION_OPTS.map(d => (
                <button key={d.hours} className={`${styles.quickBtn} ${duration === d.hours ? styles.quickBtnActive : ''}`} onClick={() => setDuration(d.hours)}>{d.label}</button>
              ))}
            </div>

            {/* Deal type */}
            <h4 className={styles.subLabel}>Deal type</h4>
            <div className={styles.typeRow}>
              {DEAL_TYPES.map(t => (
                <button key={t.id} className={`${styles.typeBtn} ${dealType === t.id ? styles.typeBtnActive : ''}`} onClick={() => setDealType(t.id)}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>

            <button className={styles.postBtn} onClick={() => { setStep(4); onPosted?.({ item: selectedItem, discount: selectedDiscount, quantity, duration, dealType, sellerId, sellerName, domain }) }}>
              Post Deal 🔥
            </button>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div className={styles.stepBody} style={{ textAlign: 'center' }}>
            <div className={styles.successIcon}>✅</div>
            <h3 className={styles.stepTitle}>Deal is live!</h3>
            <p className={styles.successSub}>{selectedItem?.name} at {selectedDiscount}% off — {quantity} deals posted</p>
            <button className={styles.nextBtn} onClick={() => { setStep(1); setSelectedItem(null); setSelectedDiscount(null); setQuantity(10); onClose() }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
