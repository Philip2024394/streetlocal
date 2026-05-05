import { useRef, useState } from 'react'
import styles from './RestaurantMenuSheet.module.css'
import { fmtRp } from './menuSheetConstants'

// ── Order confirmation overlay with payment flow ──────────────────────────────
export default function OrderConfirmOverlay({
  orderConfirm,
  setOrderConfirm,
  paymentStep,
  setPaymentStep,
  paymentSubmitted,
  setPaymentSubmitted,
  driverSearching,
  assignedDriver,
  setAssignedDriver,
  paymentProofFile,
  setPaymentProofFile,
  restaurant,
  handleSubmitPayment,
  handlePaymentProofUpload,
  handleOpenTracking,
  getFoodOrders,
  saveFoodOrders,
  setFoodOrders,
}) {
  const fileInputRef = useRef(null)
  const [showTracking, setShowTracking] = useState(false)

  if (!orderConfirm) return null

  return (
    <div className={styles.processingOverlay} onClick={() => { if (!paymentStep) setOrderConfirm(null) }}>
      <div className={styles.confirmCard} onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Step 1: Confirmation */}
        {!paymentStep && !paymentSubmitted && (
          <>
            <div className={styles.confirmCheck}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 className={styles.confirmTitle}>Order Confirmed!</h3>
            <p className={styles.confirmOrderId}>{orderConfirm.id}</p>
            <div className={styles.confirmDetails}>
              <div className={styles.confirmRow}>
                <span>Total</span>
                <span style={{ color: '#F59E0B', fontWeight: 900 }}>{fmtRp(orderConfirm.total)}</span>
              </div>
              <div className={styles.confirmRow}>
                <span>Est. Delivery</span>
                <span style={{ fontWeight: 800 }}>{orderConfirm.estimatedMin} min</span>
              </div>
            </div>
            {/* Payment method selector */}
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <button onClick={() => setPaymentStep(true)} style={{
                flex: 1, padding: '14px 8px', borderRadius: 16,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(141,198,63,0.2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 24 }}>🏦</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Bank Transfer</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Pay restaurant direct</span>
              </button>
              <button onClick={() => {
                // COD — skip payment, go straight to driver assignment
                const orders = getFoodOrders()
                const updated = orders.map(o =>
                  o.id === orderConfirm.id ? { ...o, status: 'cod_pending', payment_method: 'cod' } : o
                )
                saveFoodOrders(updated)
                setFoodOrders(updated)
                setPaymentSubmitted(true)
                handleSubmitPayment()
              }} style={{
                flex: 1, padding: '14px 8px', borderRadius: 16,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,215,0,0.2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 24 }}>💵</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>COD</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Cash on Delivery</span>
              </button>
            </div>
            <button className={styles.orderCancelBtn} onClick={() => setOrderConfirm(null)} style={{ marginTop: 8 }}>
              Cancel
            </button>
          </>
        )}

        {/* Step 2: Payment details + screenshot upload */}
        {paymentStep && !paymentSubmitted && (
          <>
            <h3 className={styles.confirmTitle} style={{ marginTop: 4 }}>Bank Transfer</h3>
            <p className={styles.confirmOrderId}>{orderConfirm.id}</p>

            {/* Bank details card */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px',
              margin: '12px 0', width: '100%',
            }}>
              {(restaurant.bank_name || restaurant.bank?.name) ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Bank</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 800 }}>{restaurant.bank_name ?? restaurant.bank?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Account</span>
                    <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 900, letterSpacing: '0.05em' }}>{restaurant.bank_account_number ?? restaurant.account_number ?? restaurant.bank?.account_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Name</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{restaurant.bank_account_holder ?? restaurant.account_holder ?? restaurant.bank?.account_holder}</span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: 0 }}>
                  Contact restaurant for payment details
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Transfer Amount</span>
              <span style={{ fontSize: 15, color: '#F59E0B', fontWeight: 900 }}>{fmtRp(orderConfirm.total)}</span>
            </div>

            {/* Screenshot upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePaymentProofUpload}
            />
            <button
              className={styles.confirmDoneBtn}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: paymentProofFile
                  ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                  : 'rgba(255,255,255,0.08)',
                border: paymentProofFile ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                marginBottom: 8,
              }}
            >
              {paymentProofFile ? `Screenshot: ${paymentProofFile.name.slice(0, 25)}` : 'Upload Payment Screenshot'}
            </button>

            <button
              className={styles.confirmDoneBtn}
              onClick={handleSubmitPayment}
              disabled={driverSearching}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                opacity: driverSearching ? 0.6 : 1,
              }}
            >
              {driverSearching ? 'Submitting...' : 'Submit Payment'}
            </button>

            <button className={styles.orderCancelBtn} onClick={() => setPaymentStep(false)} style={{ marginTop: 4 }}>
              Back
            </button>
          </>
        )}

        {/* Step 3: Payment submitted — driver assignment */}
        {paymentSubmitted && (
          <>
            {driverSearching ? (
              <>
                <div className={styles.processingSpinner} />
                <h3 className={styles.confirmTitle}>Searching for driver...</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
                  Finding a nearby driver for your order
                </p>
              </>
            ) : assignedDriver ? (
              <>
                <div className={styles.confirmCheck}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3 className={styles.confirmTitle}>Driver Assigned!</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                  Heading to restaurant
                </p>

                {/* Driver info card */}
                <div style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 14,
                  border: '1px solid rgba(141,198,63,0.2)', padding: '14px 16px',
                  margin: '8px 0', width: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(141,198,63,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      🏍️
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                        {assignedDriver.display_name ?? assignedDriver.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        {assignedDriver.vehicle_model ?? assignedDriver.vehicle ?? 'Motorcycle'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {assignedDriver.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <button className={styles.confirmDoneBtn} onClick={() => setShowTracking(true)} style={{ background: 'linear-gradient(135deg, #8DC63F 0%, #6BA530 100%)' }}>
                  Track Order
                </button>
                <button className={styles.orderCancelBtn} onClick={() => {
                  setOrderConfirm(null)
                  setPaymentStep(false)
                  setPaymentSubmitted(false)
                  setAssignedDriver(null)
                  setPaymentProofFile(null)
                }} style={{ marginTop: 4 }}>
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className={styles.confirmTitle}>Payment Submitted</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
                  Waiting for restaurant confirmation
                </p>
                <button className={styles.confirmDoneBtn} onClick={handleSubmitPayment}>
                  Retry Driver Search
                </button>
                <button className={styles.orderCancelBtn} onClick={() => {
                  setOrderConfirm(null)
                  setPaymentStep(false)
                  setPaymentSubmitted(false)
                }} style={{ marginTop: 4 }}>
                  Close
                </button>
              </>
            )}
          </>
        )}

      </div>

      {/* ── Driver tracking overlay ── */}
      {showTracking && assignedDriver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Order Tracking</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{assignedDriver.display_name ?? assignedDriver.name} is on the way</div>
            </div>
            <button onClick={() => setShowTracking(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Driver info card */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(141,198,63,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '2px solid rgba(141,198,63,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏍️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{assignedDriver.display_name ?? assignedDriver.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{assignedDriver.vehicle_model ?? assignedDriver.vehicle ?? 'Honda Beat'} · {assignedDriver.plate ?? 'AB 1234 CD'}</div>
            </div>
            <a href={`tel:${assignedDriver.phone ?? '081234567890'}`} style={{ width: 40, height: 40, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </a>
          </div>

          {/* Status timeline */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Order Confirmed', icon: '✅', done: true },
              { label: 'Driver Heading to Restaurant', icon: '🏍️', done: true },
              { label: 'Picking Up Your Food', icon: '🍽️', done: false, active: true },
              { label: 'On the Way to You', icon: '📦', done: false },
              { label: 'Delivered', icon: '🎉', done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: step.done ? 'rgba(141,198,63,0.2)' : step.active ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${step.done ? '#8DC63F' : step.active ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{step.icon}</div>
                <span style={{
                  fontSize: 13, fontWeight: step.active ? 800 : 600,
                  color: step.done ? '#8DC63F' : step.active ? '#FFD700' : 'rgba(255,255,255,0.35)',
                }}>{step.label}{step.active ? ' ···' : ''}</span>
              </div>
            ))}
          </div>

          {/* ETA */}
          <div style={{ padding: '0 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700' }}>~{orderConfirm.estimatedMin} min</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Estimated delivery time</div>
          </div>
        </div>
      )}
    </div>
  )
}
