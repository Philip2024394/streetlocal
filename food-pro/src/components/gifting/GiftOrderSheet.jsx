/**
 * GiftOrderSheet.jsx
 * Anonymous gift checkout sheet.
 *
 * Shows: recipient chip, product details, Indoo delivery tier pricing,
 * optional anonymous message, and a "Send Gift Anonymously" button.
 *
 * Privacy: the buyer never sees the recipient's address.
 * Distance comes from giftFor.distanceKm (already calculated when profile was viewed).
 */
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { placeGiftOrder, getDeliveryTier, DELIVERY_TIERS, formatIDR, hasGiftAddress } from '@/services/giftService'
import { notifyGiftToSeller, notifyGiftToRecipient, notifyGiftAddressRequired } from '@/services/notificationService'
import { payGiftOrder } from '@/services/paymentService'
import { supabase } from '@/lib/supabase'
import styles from './GiftOrderSheet.module.css'

const ORDER_STEPS = ['pending', 'processing', 'delivering', 'delivered']
const STEP_LABELS = { pending: '⏳ Preparing', processing: '🔄 Processing', delivering: '🛵 On the way', delivered: '✅ Delivered' }

function formatProductPrice(price, currency) {
  if (!price) return '—'
  if (currency === 'IDR' || !currency) return formatIDR(price)
  return `${currency} ${Number(price).toLocaleString()}`
}

export default function GiftOrderSheet({ open, product, seller, giftFor, onClose, showToast }) {
  const { user } = useAuth()

  const [message,     setMessage]     = useState('')
  const [sending,     setSending]     = useState(false)
  const [sent,        setSent]        = useState(false)
  const [placedId,    setPlacedId]    = useState(null)   // order id after placement
  const [orderStatus, setOrderStatus] = useState('pending')

  // Real-time status subscription — fires after order is placed
  useEffect(() => {
    if (!supabase || !placedId) return
    const ch = supabase
      .channel(`order-status-${placedId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'gift_orders',
        filter: `id=eq.${placedId}`,
      }, (payload) => {
        if (payload.new.status) setOrderStatus(payload.new.status)
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [placedId])
  const [bubblePos,  setBubblePos]  = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 96 : 320,
    y: 72,
  }))
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const onBubblePointerDown = (e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOffsetRef.current = { x: e.clientX - bubblePos.x, y: e.clientY - bubblePos.y }
  }
  const onBubblePointerMove = (e) => {
    if (!e.buttons) return
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 430
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    setBubblePos({
      x: Math.max(8, Math.min(vw - 80, e.clientX - dragOffsetRef.current.x)),
      y: Math.max(8, Math.min(vh - 110, e.clientY - dragOffsetRef.current.y)),
    })
  }

  if (!open || !product || !seller || !giftFor) return null

  const distanceKm    = giftFor.distanceKm ?? giftFor.distKm ?? null
  const tier          = getDeliveryTier(distanceKm)   // null when > 20 km from seller
  const indooAvail  = tier !== null                  // false → hide bike delivery, don't block
  const totalPrice    = Number(product.price ?? 0) + Number(tier?.fee ?? 0)

  const handleSend = async () => {
    if (blocked) return
    if (!user?.id && !user?.uid) {
      showToast?.('Sign in to send gifts', 'error')
      return
    }

    setSending(true)
    try {
      const buyerUserId = user.uid ?? user.id
      const recipientId = giftFor.userId ?? giftFor.id

      // ── Step 1: Midtrans payment ────────────────────────────────────────────
      const payment = await payGiftOrder({
        id:          `gift-${Date.now()}`,
        productId:   product.id ?? product.name,
        productName: product.name,
        totalAmount: totalPrice,
        buyerName:   user.displayName ?? 'Buyer',
        buyerPhone:  user.phoneNumber ?? undefined,
      })
      if (payment.status === 'closed') { setSending(false); return }
      if (payment.status === 'error') {
        showToast?.('Payment failed — please try again.', 'error')
        setSending(false)
        return
      }
      // status === 'success' | 'pending' → proceed to create order

      // ── Step 2: Record order in Supabase ───────────────────────────────────
      const { id: orderId, error } = await placeGiftOrder({
        recipientId,
        sellerId:    seller.id,
        product,
        giftMessage: message,
        deliveryFee: tier.fee ?? 0,
        distanceKm,
      })

      if (error) {
        showToast?.(error, 'error')
        setSending(false)
        return
      }

      const sellerName = seller.brandName ?? seller.displayName ?? 'a shop'

      // Notify seller — product name only, buyer identity never included
      await notifyGiftToSeller(seller.id, {
        productName: product.name,
        orderId,
        fromUserId:  buyerUserId,
      })

      // Check if recipient has a saved delivery address
      const recipientHasAddress = await hasGiftAddress(recipientId)

      if (recipientHasAddress) {
        // Full surprise — notify recipient that a gift is on its way
        await notifyGiftToRecipient(recipientId, {
          sellerName,
          productName: product.name,
          orderId,
          fromUserId:  buyerUserId,
        })
      } else {
        // No address saved — prompt them to add one (no product/sender details revealed)
        await notifyGiftAddressRequired(recipientId, {
          sellerName,
          fromUserId: buyerUserId,
          orderId,
        })
      }

      setPlacedId(orderId)
      setSent(true)
    } catch (e) {
      showToast?.(e.message ?? 'Something went wrong', 'error')
    }
    setSending(false)
  }

  // ── Success state with live order tracking ───────────────────────────────────
  if (sent) {
    const curStep = ORDER_STEPS.indexOf(orderStatus)
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.successWrap}>
            <div className={styles.successEmoji}>{orderStatus === 'delivered' ? '✅' : '🎁'}</div>
            <h2 className={styles.successTitle}>Gift sent!</h2>
            <p className={styles.successSub}>
              Your anonymous gift is on its way to{' '}
              <strong>{giftFor.displayName ?? 'them'}</strong>.
            </p>

            {/* Live status */}
            <div className={styles.trackStatus}>{STEP_LABELS[orderStatus] ?? STEP_LABELS.pending}</div>

            {/* Progress bar */}
            <div className={styles.trackBar}>
              {ORDER_STEPS.map((s, i) => (
                <div key={s} className={`${styles.trackStep} ${i <= curStep ? styles.trackStepDone : ''}`} />
              ))}
            </div>

            <p className={styles.successPrivacy}>
              🔒 Your identity is completely anonymous — they'll never know who sent it.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>

      {/* ── Draggable floating profile bubble ── */}
      <div
        className={styles.floatingBubble}
        style={{ left: bubblePos.x, top: bubblePos.y }}
        onPointerDown={onBubblePointerDown}
        onPointerMove={onBubblePointerMove}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.bubbleRing}>
          {giftFor.photoURL
            ? <img src={giftFor.photoURL} alt={giftFor.displayName} className={styles.bubblePhoto} />
            : <div className={styles.bubblePhotoFallback}>💕</div>
          }
          <span className={styles.bubbleName}>{giftFor.displayName ?? 'Someone'}</span>
        </div>
        <span className={styles.bubbleLabel}>Gift Surprise</span>
      </div>

      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className={styles.handle} />

        {/* Product card */}
        <div className={styles.productCard}>
          {product.image || product.image_url
            ? <img
                src={product.image ?? product.image_url}
                alt={product.name}
                className={styles.productImg}
              />
            : <div className={styles.productImgFallback}>📦</div>
          }
          <div className={styles.productInfo}>
            <div className={styles.productName}>{product.name}</div>
            {product.selectedVariant && (
              <div className={styles.productVariant}>{product.selectedVariant}</div>
            )}
            <div className={styles.productSeller}>
              from {seller.brandName ?? seller.displayName}
            </div>
          </div>
          <div className={styles.productPrice}>
            {formatProductPrice(product.price, product.currency)}
          </div>
        </div>

        {/* Delivery pricing — only shown when seller is within 20 km */}
        {indooAvail ? (
          <div className={styles.deliverySection}>
            <div className={styles.deliveryTitle}>
              <span>🏍️ Indoo Local Delivery</span>
              {distanceKm != null && (
                <span className={styles.distanceTag}>{distanceKm.toFixed(1)} km</span>
              )}
            </div>

            <div className={styles.deliveryTiers}>
              {DELIVERY_TIERS.map(t => (
                <div
                  key={t.label}
                  className={[
                    styles.tierRow,
                    tier?.maxKm === t.maxKm ? styles.tierRowActive : '',
                  ].join(' ')}
                >
                  <span className={styles.tierLabel}>{t.label}</span>
                  <span className={styles.tierFee}>{formatIDR(t.fee)}</span>
                </div>
              ))}
            </div>

            <div className={styles.deliveryFeeRow}>
              <span>Delivery fee</span>
              <span className={styles.deliveryFeeValue}>{formatIDR(tier.fee)}</span>
            </div>
          </div>
        ) : (
          <div className={styles.sellerShipsNote}>
            🚚 Outside Indoo local range — the seller will arrange delivery.
            Contact the seller after ordering to confirm shipping method.
          </div>
        )}

        {/* Anonymous message */}
        <div className={styles.messageSection}>
          <label className={styles.messageLabel}>
            💌 Anonymous message <span className={styles.messageLabelOptional}>(optional)</span>
          </label>
          <textarea
            className={styles.messageInput}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
            placeholder="Write something sweet… they'll see this but won't know it's from you."
            rows={3}
          />
          <div className={styles.messageCount}>{message.length}/200</div>
        </div>

        {/* Total + Send button — always available */}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{formatProductPrice(totalPrice, product.currency)}</span>
        </div>

        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? (
            <span className={styles.sendBtnSpinner} />
          ) : (
            <>🔒 Send Gift Anonymously</>
          )}
        </button>

        <p className={styles.privacyNote}>
          Your identity is never revealed. The seller only receives an anonymous gift order.
          Your gift recipient's address is kept private and auto-deletes 7 days after delivery.
        </p>

      </div>
    </div>
  )
}
