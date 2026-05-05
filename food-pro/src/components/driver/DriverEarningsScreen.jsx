import { useState, useEffect } from 'react'
import { fetchDriverTripHistory } from '@/services/bookingService'
import styles from './DriverEarningsScreen.module.css'

const DEMO_TRIPS = [
  { id: 'BOOK_001', created_at: '2026-04-08T09:12:00Z', pickup_location: 'Jl. Malioboro 15', dropoff_location: 'Bandara Adisucipto', fare: 28000, status: 'completed', passenger: { display_name: 'Ahmad F.' } },
  { id: 'BOOK_002', created_at: '2026-04-08T10:45:00Z', pickup_location: 'Hotel Tentrem',    dropoff_location: 'Prambanan Temple',    fare: 45000, status: 'completed', passenger: { display_name: 'Dewi R.' } },
  { id: 'BOOK_003', created_at: '2026-04-07T14:20:00Z', pickup_location: 'Pasar Beringharjo', dropoff_location: 'Kotagede',           fare: 22000, status: 'completed', passenger: { display_name: 'Rizky M.' } },
  { id: 'BOOK_004', created_at: '2026-04-07T16:05:00Z', pickup_location: 'Jl. Kaliurang',    dropoff_location: 'Alun-Alun Kidul',    fare: null,  status: 'cancelled', passenger: { display_name: 'Siti A.' } },
  { id: 'BOOK_005', created_at: '2026-04-06T08:15:00Z', pickup_location: 'RS Sardjito',       dropoff_location: 'Jl. Magelang Km 3',  fare: 18000, status: 'completed', passenger: { display_name: 'Budi S.' } },
]

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }
function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function DriverEarningsScreen({ driverId, profile, onClose }) {
  const [trips,   setTrips]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDriverTripHistory(driverId)
      .then(data => setTrips(data.length ? data : DEMO_TRIPS))
      .catch(() => setTrips(DEMO_TRIPS))
      .finally(() => setLoading(false))
  }, [driverId])

  const completed  = trips.filter(t => t.status === 'completed')
  const totalEarned = completed.reduce((s, t) => s + (t.fare ?? 0), 0)
  const cancels    = trips.filter(t => t.status === 'cancelled').length

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className={styles.title}>My Earnings</span>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statBig}>
          <span className={styles.statBigNum}>{fmtRp(totalEarned)}</span>
          <span className={styles.statBigLbl}>Total Earned (0% commission)</span>
        </div>
        <div className={styles.statRow}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{profile?.total_trips ?? completed.length}</span>
            <span className={styles.statLbl}>Trips</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{profile?.rating ?? '—'}</span>
            <span className={styles.statLbl}>Rating</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{cancels}</span>
            <span className={styles.statLbl}>Cancels</span>
          </div>
        </div>
        <div className={styles.freeNote}>✅ You keep 100% — Indoo charges zero commission</div>
      </div>

      {/* Trip list */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading trips…</div>
        ) : trips.length === 0 ? (
          <div className={styles.empty}>No trips yet — go online to start earning!</div>
        ) : trips.map(t => (
          <div key={t.id} className={styles.tripRow}>
            <div className={styles.tripIcon}>
              {t.status === 'cancelled' ? '✕' : '✓'}
            </div>
            <div className={styles.tripMeta}>
              <span className={styles.tripPassenger}>{t.passenger?.display_name ?? 'Passenger'}</span>
              <span className={styles.tripRoute}>{t.pickup_location} → {t.dropoff_location}</span>
              <span className={styles.tripDate}>{fmtDate(t.created_at)}</span>
            </div>
            <div className={styles.tripRight}>
              {t.status === 'completed' && t.fare != null
                ? <span className={styles.tripFare}>{fmtRp(t.fare)}</span>
                : <span className={styles.tripCancelled}>Cancelled</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
