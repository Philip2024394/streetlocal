/**
 * FoodOrderStatus — full-screen live tracking page.
 * Design matches BookingScreen (bike/car) — same green accent, glass cards, bg images.
 */
import { useState, useEffect } from 'react'
import { subscribeToFoodOrder, ORDER_STATUSES, getStatusIndex } from '@/services/foodOrderService'
import styles from './FoodOrderStatus.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

function isNightWIB() {
  const h = (new Date().getUTCHours() + 7) % 24
  return h >= 18 || h < 6
}

const BG_DAY   = 'url("https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2012,%202026,%2008_57_07%20PM.png")'
const BG_NIGHT = 'url("https://ik.imagekit.io/nepgaxllc/Night%20ride%20on%20Jalan%20Bromo.png")'

export default function FoodOrderStatus({ order, onClose }) {
  const [liveOrder, setLiveOrder] = useState(order)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    if (!order?.id) return
    setLiveOrder(order)
    const unsub = subscribeToFoodOrder(order.id, updated => setLiveOrder(updated))
    return unsub
  }, [order?.id]) // eslint-disable-line

  if (!liveOrder) return null

  const statusIdx   = getStatusIndex(liveOrder.status)
  const isDelivered = liveOrder.status === 'delivered'
  const items       = Array.isArray(liveOrder.items) ? liveOrder.items : []
  const bgImage     = isNightWIB() ? BG_NIGHT : BG_DAY

  // ── Minimized strip ──────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div className={styles.stripWrap}>
        <div className={styles.strip} onClick={() => setMinimized(false)}>
          <span className={styles.stripEmoji}>
            {ORDER_STATUSES[Math.max(0, statusIdx)]?.icon ?? '🏍️'}
          </span>
          <div className={styles.stripMid}>
            <span className={styles.stripTitle}>
              {isDelivered ? 'Delivered!' : 'Order On Its Way'}
            </span>
            <span className={styles.stripSub}>
              {ORDER_STATUSES[Math.max(0, statusIdx)]?.label ?? ''}
            </span>
          </div>
          <span className={styles.stripExpand}>▲</span>
        </div>
      </div>
    )
  }

  // ── Full-screen page ─────────────────────────────────────────────────────────
  return (
    <div className={styles.screen} style={{ backgroundImage: bgImage }}>
      <div className={styles.scrim} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerBrand}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926"
            alt="INDOO"
            className={styles.headerLogo}
          />
        </div>
        <div className={styles.headerActions}>
          <button className={styles.minimizeBtn} onClick={() => setMinimized(true)} aria-label="Minimize">
            ▼
          </button>
          {isDelivered && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className={styles.body}>

        {/* Title card */}
        <div className={styles.titleCard}>
          <div className={styles.titleRow}>
            <span className={styles.titleEmoji}>
              {isDelivered ? '🎉' : ORDER_STATUSES[Math.max(0, statusIdx)]?.icon ?? '🏍️'}
            </span>
            <div>
              <p className={styles.titleText}>
                {isDelivered ? 'Order Delivered!' : 'Order On Its Way'}
              </p>
              <p className={styles.titleRef}>Ref · {liveOrder.cash_ref}</p>
            </div>
          </div>

          {/* Status progress steps */}
          <div className={styles.steps}>
            {ORDER_STATUSES.map((s, i) => {
              const done    = i < statusIdx
              const current = i === statusIdx
              return (
                <div key={s.key} className={styles.step}>
                  <div className={`${styles.stepDot} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''}`}>
                    {done
                      ? <span className={styles.stepCheck}>✓</span>
                      : <span className={styles.stepIcon}>{s.icon}</span>}
                  </div>
                  {i < ORDER_STATUSES.length - 1 && (
                    <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''} ${current ? styles.stepLineCurrent : ''}`} />
                  )}
                  <span className={`${styles.stepLabel} ${current ? styles.stepLabelCurrent : ''} ${done ? styles.stepLabelDone : ''}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Driver card */}
        <div className={styles.driverCard}>
          <div className={styles.driverTop}>
            <div className={styles.driverAvatar}>
              {liveOrder.driver_photo
                ? <img src={liveOrder.driver_photo} alt="" className={styles.driverAvatarImg} />
                : <span className={styles.driverAvatarEmoji}>🏍️</span>}
            </div>
            <div className={styles.driverInfo}>
              <span className={styles.driverName}>{liveOrder.driver_name}</span>
              <span className={styles.driverVehicle}>{liveOrder.driver_vehicle}</span>
              <span className={styles.driverPlate}>{liveOrder.driver_plate}</span>
            </div>
            {/* Chat button — right of profile */}
            <button className={styles.chatBtn} onClick={() => {}}>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitledsddsssdsssssssssdddd-removebg-preview%20(1).png" alt="Chat" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </button>
          </div>
          {/* Call + WhatsApp — centered row */}
          {liveOrder.driver_phone && (
            <div className={styles.driverActions}>
              <a href={`tel:${liveOrder.driver_phone}`} className={styles.actionBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <span>Call</span>
              </a>
              <a href={`https://wa.me/${liveOrder.driver_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className={styles.orderCard}>
          <div className={styles.orderRestaurant}>
            <span className={styles.orderRestaurantIcon}>📍</span>
            <span className={styles.orderRestaurantName}>{liveOrder.restaurant_name}</span>
          </div>
          <div className={styles.orderDivider} />
          <div className={styles.orderItems}>
            {items.map((item, i) => (
              <div key={i} className={styles.orderItem}>
                <span className={styles.orderItemQty}>{item.qty}×</span>
                <span className={styles.orderItemName}>{item.name}</span>
                <span className={styles.orderItemPrice}>{fmtRp(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className={styles.orderDivider} />
          <div className={styles.orderTotalRow}>
            <span className={styles.orderTotalLabel}>Total</span>
            <span className={styles.orderTotalVal}>{fmtRp(liveOrder.total)}</span>
          </div>
        </div>

        {/* Status note */}
        {!isDelivered && liveOrder.status === 'confirmed' && (
          <div className={styles.infoNote}>
            ✓ Payment confirmed — your driver has been notified and is heading to the restaurant
          </div>
        )}

        {/* Delivered */}
        {isDelivered && (
          <div className={styles.deliveredCard}>
            <span className={styles.deliveredEmoji}>🍽️</span>
            <p className={styles.deliveredTitle}>Enjoy your food!</p>
            <p className={styles.deliveredSub}>Your order has been delivered successfully.</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

      </div>
    </div>
  )
}
