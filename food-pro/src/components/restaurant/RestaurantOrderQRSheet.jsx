/**
 * RestaurantOrderQRSheet
 * Shown to restaurant after accepting a COD order.
 * Displays a QR code the driver scans at pickup.
 * When driver scans → commission is recorded automatically.
 * For bank transfer orders this sheet is skipped (payment already confirmed).
 */
import { useState, useEffect } from 'react'
import styles from './RestaurantOrderQRSheet.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

// Simple QR visual — in production use a real QR library
function FakeQR({ value }) {
  // Render a deterministic pixel grid based on the value string
  const size = 9
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const cells = Array.from({ length: size * size }, (_, i) => {
    const r = (seed * (i + 7) * 13) % 97
    // Always fill corners (QR finder patterns)
    const row = Math.floor(i / size), col = i % size
    const isCorner = (row < 3 && col < 3) || (row < 3 && col >= size - 3) || (row >= size - 3 && col < 3)
    return isCorner || r < 48
  })
  return (
    <div className={styles.qr}>
      {cells.map((filled, i) => (
        <div key={i} className={`${styles.qrCell} ${filled ? styles.qrCellFilled : ''}`} />
      ))}
    </div>
  )
}

export default function RestaurantOrderQRSheet({ open, order, onScanned, onClose, _forceScanned = false }) {
  const [scanned, setScanned] = useState(_forceScanned)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!open) { setScanned(_forceScanned); setScanning(false) }
  }, [open, _forceScanned])

  // Simulate driver scan via a dev button (in production: driver app sends scan event via Supabase realtime)
  const simulateScan = async () => {
    setScanning(true)
    await new Promise(r => setTimeout(r, 1200))
    setScanned(true)
    setScanning(false)
    onScanned?.({ orderId: order?.id, driverId: order?.driverId })
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        {scanned ? (
          <div className={styles.scannedState}>
            <span className={styles.scannedIcon}>✅</span>
            <span className={styles.scannedTitle}>Driver Collected!</span>
            <span className={styles.scannedSub}>
              Driver paid you <strong>{fmtRp(order?.finalTotal ?? order?.total)}</strong> cash.
              Your 10% commission has been recorded automatically.
            </span>
            <div className={styles.commissionPill}>
              💰 Commission: {fmtRp(Math.round((order?.finalTotal ?? order?.total ?? 0) * 0.10))} (10%)
            </div>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <span className={styles.headerTitle}>Driver Pickup QR</span>
              <span className={styles.headerSub}>
                Show this QR to the driver. They scan it when they collect and pay you.
              </span>
            </div>

            {/* QR code */}
            <div className={styles.qrWrap}>
              <FakeQR value={order?.id ?? 'dev-order'} />
              <span className={styles.qrRef}>{order?.ref ?? '#MAKAN_00000000'}</span>
            </div>

            {/* Amount driver owes */}
            <div className={styles.amountCard}>
              <span className={styles.amountLabel}>Driver pays you</span>
              <span className={styles.amountValue}>{fmtRp(order?.finalTotal ?? order?.total)}</span>
              <span className={styles.amountNote}>Cash · collected before handing over food</span>
            </div>

            {/* Steps */}
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <span>Driver arrives and shows you their app</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <span>Driver pays you <strong>{fmtRp(order?.finalTotal ?? order?.total)}</strong> cash</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <span>Driver scans this QR → confirms pickup → commission recorded</span>
              </div>
            </div>

            {/* Dev-only simulate button */}
            <button
              className={styles.simulateBtn}
              onClick={simulateScan}
              disabled={scanning}
            >
              {scanning ? '⏳ Scanning…' : '📷 [DEV] Simulate Driver Scan'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}
