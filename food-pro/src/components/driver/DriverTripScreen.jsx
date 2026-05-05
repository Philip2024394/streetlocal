import { useState, useRef, useEffect } from 'react'
import { driverMarkArrived, driverStartRide, driverCompleteRide } from '@/services/bookingService'
import { sendMessage, onMessagesUpdated } from '@/services/driverChatService'
import useDriverNavigation from '@/hooks/useDriverNavigation'
import DriverNavMap from './DriverNavMap'
import styles from './DriverTripScreen.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

const ARROW_IMGS = {
  'turn-left': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsss-removebg-preview.png',
  'turn-slight-left': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsssd-removebg-preview.png',
  'turn-right': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsssds-removebg-preview.png',
  'turn-slight-right': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsssdsssss-removebg-preview.png',
  'straight': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsssdsssssss-removebg-preview.png',
  'uturn-left': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsssdsssssssss-removebg-preview.png',
  'uturn-right': 'https://ik.imagekit.io/nepgaxllc/Untitledsddsssdsssssssss-removebg-preview.png',
}

function DirectionArrow({ maneuver, size = 36 }) {
  const imgUrl = ARROW_IMGS[maneuver] || ARROW_IMGS['straight']
  if (imgUrl) {
    const isSlight = maneuver === 'turn-slight-left' || maneuver === 'turn-slight-right'
    const isStraight = !maneuver || maneuver === 'straight' || !ARROW_IMGS[maneuver]
    const displaySize = (isSlight || isStraight) ? size * 1.3 : size
    return <img src={imgUrl} alt={maneuver} style={{ width: displaySize, height: displaySize, objectFit: 'contain', animation: isStraight ? 'dirHeartbeat 2s ease-in-out infinite' : 'none' }} />
  }
  // Fallback SVG for other maneuvers
  const sw = size >= 30 ? 3 : 2.5
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#8DC63F', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (maneuver) {
    case 'turn-sharp-left': return <svg {...props}><path d="M16 20V12L6 8"/><polyline points="2 12 6 8 10 12"/></svg>
    case 'turn-sharp-right': return <svg {...props}><path d="M8 20V12l10-4"/><polyline points="14 12 18 8 22 12"/></svg>
    case 'uturn-left': return <svg {...props}><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a4 4 0 010 8h-1"/></svg>
    case 'uturn-right': return <svg {...props}><path d="M15 14l4-4-4-4"/><path d="M19 10h-9a4 4 0 000 8h1"/></svg>
    case 'roundabout-left':
    case 'roundabout-right': return <svg {...props}><circle cx="12" cy="10" r="4"/><path d="M12 14v6"/><path d="M16 10l2-2"/></svg>
    case 'merge': return <svg {...props}><path d="M6 4l6 6 6-6"/><path d="M12 10v10"/></svg>
    case 'fork-left': return <svg {...props}><path d="M14 20V10L7 4"/><path d="M17 4v16"/></svg>
    case 'fork-right': return <svg {...props}><path d="M10 20V10l7-6"/><path d="M7 4v16"/></svg>
    default: return <svg {...props}><path d="M12 20V4"/><polyline points="6 10 12 4 18 10"/></svg>
  }
}

export default function DriverTripScreen({ booking, driverId, onCompleted, onClose, onOpenChat }) {
  const [phase, setPhase] = useState(
    booking.status === 'in_progress' ? 'in_progress' : 'going_to_pickup'
  )
  const [busy, setBusy] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [directionsVisible, setDirectionsVisible] = useState(false)

  const [msgCount, setMsgCount] = useState(0)

  // Track message count for badge
  useEffect(() => {
    return onMessagesUpdated(booking.id, (msgs) => setMsgCount(msgs.length))
  }, [booking.id])

  // Night mode — Indonesia WIB (UTC+7), 18:00–06:00
  const [isNight, setIsNight] = useState(() => {
    const h = new Date(Date.now() + 7 * 3600000).getUTCHours()
    return h >= 18 || h < 6
  })
  useEffect(() => {
    const check = () => {
      const h = new Date(Date.now() + 7 * 3600000).getUTCHours()
      setIsNight(h >= 18 || h < 6)
    }
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  // Determine navigation destination based on phase
  const destination = phase === 'in_progress' || phase === 'arrived'
    ? booking.dropoff_coords
    : booking.pickup_coords

  const {
    route, loading, driverPos, bearing,
    currentStep, nextStep, etaMin, distToNextTurn,
    isOffRoute, arrived,
    speedKmh, remainingKm, tripProgress, timeToTurnSec, closestIdx, navAlerts,
  } = useDriverNavigation(destination, phase !== 'completed')

  const passenger = booking.passenger
  const pickupAddress = booking.pickup_address || booking.pickup_location || 'Pickup location'
  const dropoffAddress = booking.dropoff_address || booking.dropoff_location || 'Drop-off location'

  const handleArrived = async () => {
    setBusy(true)
    await driverMarkArrived(booking.id)
    setPhase('arrived')
    setBusy(false)
  }

  const handleStartRide = async () => {
    setBusy(true)
    await driverStartRide(booking.id)
    setPhase('in_progress')
    setBusy(false)
  }

  const completeTimerRef = useRef(null)
  const sentStatusRef = useRef(new Set())
  useEffect(() => () => clearTimeout(completeTimerRef.current), [])

  // Auto-post status updates to customer chat
  const postStatus = (text) => {
    sendMessage(booking.id, driverId, 'driver', `📍 ${text}`).catch(() => {})
  }

  // Phase change status messages
  useEffect(() => {
    const key = `phase-${phase}`
    if (sentStatusRef.current.has(key)) return
    sentStatusRef.current.add(key)

    if (phase === 'going_to_pickup') {
      postStatus('Your driver is on the way to pick you up!')
    } else if (phase === 'arrived') {
      postStatus('Your driver has arrived at the pickup location. Please come out.')
    } else if (phase === 'in_progress') {
      postStatus('Ride started! Heading to your destination now.')
    }
  }, [phase])

  // Progress milestone messages (25%, 50%, 75%)
  useEffect(() => {
    if (phase !== 'in_progress') return
    const milestones = [25, 50, 75]
    for (const m of milestones) {
      const key = `progress-${m}`
      if (tripProgress >= m && !sentStatusRef.current.has(key)) {
        sentStatusRef.current.add(key)
        if (m === 25) postStatus('Making good progress — about 25% of the way there.')
        if (m === 50) postStatus('Halfway there! About 50% complete.')
        if (m === 75) postStatus('Almost there — 75% of the way to your destination!')
      }
    }
  }, [tripProgress, phase])

  const handleComplete = async () => {
    setBusy(true)
    postStatus('You have arrived at your destination! Ride complete. Thank you for riding with INDOO 💚')
    await driverCompleteRide(booking.id, driverId)
    setPhase('completed')
    setBusy(false)
    completeTimerRef.current = setTimeout(() => onCompleted?.(), 2000)
  }

  // Completed screen (no map)
  if (phase === 'completed') {
    return (
      <div className={styles.screen}>
        <div className={styles.completedScreen}>
          <span className={styles.completedIcon}>🎉</span>
          <span className={styles.completedText}>Ride Complete!</span>
          {booking.fare != null && (
            <span className={styles.completedFare}>{fmtRp(booking.fare)} earned</span>
          )}
        </div>
      </div>
    )
  }

  const phaseLabel = phase === 'going_to_pickup' ? 'Heading to pickup'
    : phase === 'arrived' ? 'Waiting for passenger'
    : 'Ride in progress'

  return (
    <div className={styles.navScreen}>
      {/* ── Top header bar ── */}
      <div className={styles.tripHeader}>
        <div className={styles.tripHeaderLeft}>
          {onClose && phase === 'going_to_pickup' && (
            <button className={styles.tripHeaderBack} onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
          )}
          <div>
            <span className={styles.tripHeaderBrand}>
              <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
              <span className={styles.tripHeaderType}> Drive</span>
            </span>
            <div className={styles.tripHeaderPhase}>
              <span className={styles.tripHeaderPhaseDot} style={{ background: phase === 'in_progress' ? '#8DC63F' : phase === 'arrived' ? '#FACC15' : '#3B82F6' }} />
              {phaseLabel}
            </div>
          </div>
        </div>
        {passenger && (
          <div className={styles.tripHeaderRight}>
            <div className={styles.tripHeaderCustomer}>
              <span className={styles.tripHeaderName}>{passenger.display_name?.split(' ')[0] ?? 'Passenger'}</span>
              {passenger.rating != null && (
                <span className={styles.tripHeaderRating}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#FACC15" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {passenger.rating.toFixed(1)}
                </span>
              )}
            </div>
            <div className={styles.tripHeaderAvatar}>
              {passenger.photo_url
                ? <img src={passenger.photo_url} alt="" className={styles.tripHeaderAvatarImg} />
                : <span className={styles.tripHeaderAvatarLetter}>{passenger.display_name?.[0]?.toUpperCase() ?? '?'}</span>
              }
              <span className={styles.tripHeaderOnline} />
            </div>
          </div>
        )}
        <div className={styles.tripHeaderGlow} />
      </div>

      {/* Night ambient glow — header light shining down */}
      {isNight && <div className={styles.nightGlowTop} />}

      {/* Full-screen navigation map */}
      <DriverNavMap
        driverPos={driverPos}
        bearing={bearing}
        route={route}
        pickup={phase === 'going_to_pickup' ? null : booking.pickup_coords}
        destination={phase === 'going_to_pickup' ? booking.pickup_coords : booking.dropoff_coords}
        destinationLabel={phase === 'going_to_pickup' ? 'PICKUP' : 'DROP-OFF'}
        isOffRoute={isOffRoute}
        speedKmh={speedKmh}
        closestIdx={closestIdx}
        onOpenChat={onOpenChat}
        onToggleFooter={() => setSheetOpen(v => !v)}
        footerVisible={sheetOpen}
        onToggleDirections={() => setDirectionsVisible(v => !v)}
        directionsVisible={directionsVisible}
      />

      {/* ── Directions drawer — slides out from right side nav ── */}
      {directionsVisible && currentStep && (
        <div className={styles.directionsDrawer}>
          <div className={styles.drawerTab} />
          {/* Phase header */}
          <div className={styles.dirDestination}>
            <div className={styles.dirDestLabel}>
              {phase === 'going_to_pickup' ? 'HEADING TO PICKUP' : 'HEADING TO DROP-OFF'}
            </div>
          </div>
          {/* Arrow + countdown */}
          <div className={styles.dirArrowSection}>
            <div className={styles.dirArrowBox}>
              <DirectionArrow maneuver={currentStep.maneuver} size={56} />
            </div>
            {distToNextTurn != null && (
              <div className={styles.dirCountdown}>
                <div className={styles.dirCountdownValue}>
                  {distToNextTurn > 999 ? (distToNextTurn / 1000).toFixed(1) : distToNextTurn}
                </div>
                <div className={styles.dirCountdownUnit}>
                  {distToNextTurn > 999 ? 'KM' : 'M'}
                </div>
              </div>
            )}
          </div>
          {/* Instruction */}
          <div className={styles.dirInstruction}>{currentStep.instruction}</div>
          <div className={styles.dirDist}>{currentStep.distanceText}</div>
          {/* Next step */}
          {nextStep && (
            <div className={styles.dirNextRow}>
              <span className={styles.dirNextLabel}>THEN</span>
              <DirectionArrow maneuver={nextStep.maneuver} size={16} />
              <span className={styles.dirNextText}>{nextStep.instruction}</span>
              <span className={styles.dirNextDist}>{nextStep.distanceText}</span>
            </div>
          )}
        </div>
      )}

      {/* Night ambient glow — slider light shining up */}
      {isNight && sheetOpen && <div className={styles.nightGlowBottom} />}

      {/* ── Slide-up bottom sheet — fixed, outside map stacking context ── */}
      <div className={`${styles.bottomSheet} ${sheetOpen ? styles.bottomSheetOpen : styles.bottomSheetClosed}`}>
        {/* Running light border */}
        <div className={styles.runningLight} />

        {/* Drag handle */}
        <div className={styles.sheetHandle} onClick={() => setSheetOpen(v => !v)}>
          <div className={styles.sheetHandleBar} />
        </div>

        {/* Trip progress bar */}
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${tripProgress}%` }} />
        </div>

        {/* Pickup & Drop-off */}
        <div className={styles.locationsBlock}>
          <div className={styles.locationRow}>
            <div className={styles.pickupDot}><div className={styles.pickupDotInner} /></div>
            <div className={styles.locationText}>
              <div className={styles.locationLabel}>PICKUP</div>
              <div className={styles.locationAddr}>{pickupAddress}</div>
            </div>
          </div>
          <div className={styles.locationConnector} />
          <div className={styles.locationRow}>
            <div className={styles.dropoffDot}><div className={styles.dropoffDotInner} /></div>
            <div className={styles.locationText}>
              <div className={styles.locationLabelRed}>DROP-OFF</div>
              <div className={styles.locationAddr}>{dropoffAddress}</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{etaMin ?? '—'}</div>
            <div className={styles.statLabel}>MIN</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <div className={styles.statValueWhite}>{remainingKm != null ? `${remainingKm}` : '—'}</div>
            <div className={styles.statLabel}>KM LEFT</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <div className={styles.statValueWhite}>{tripProgress}%</div>
            <div className={styles.statLabel}>DONE</div>
          </div>
        </div>

        {/* Chat & WhatsApp buttons */}
        {passenger && (
          <div className={styles.contactRow}>
            <button className={styles.contactBtn} onClick={onOpenChat} style={{ position: 'relative' }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitledsddsssdsssssssssdddd-removebg-preview%20(1).png" alt="Chat" className={styles.contactIcon} />
              {msgCount > 0 && <span className={styles.chatBadge}>{msgCount}</span>}
              <span>Chat</span>
            </button>
            <a
              className={styles.contactBtn}
              href={passenger.phone ? `https://wa.me/${passenger.phone.replace(/\D/g, '')}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span>WhatsApp</span>
            </a>
          </div>
        )}

        {/* Action button with fare */}
        <div className={styles.sheetAction}>
          {phase === 'going_to_pickup' && (
            <button className={styles.actionBtn} onClick={handleArrived} disabled={busy}>
              <img className={styles.btnBg} src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png" alt="" />
              <span className={styles.btnContent}>{busy ? '...' : "I've Arrived at Pickup"}{booking.fare != null && ` · ${fmtRp(booking.fare)}`}</span>
            </button>
          )}
          {phase === 'arrived' && (
            <button className={styles.actionBtn} onClick={handleStartRide} disabled={busy}>
              <img className={styles.btnBg} src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png" alt="" />
              <span className={styles.btnContent}>{busy ? '...' : 'Start Ride'}{booking.fare != null && ` · ${fmtRp(booking.fare)}`}</span>
            </button>
          )}
          {phase === 'in_progress' && (
            <button className={styles.actionBtn} onClick={handleComplete} disabled={busy}>
              <img className={styles.btnBg} src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png" alt="" />
              <span className={styles.btnContent}>{busy ? '...' : 'Complete Ride'}{booking.fare != null && ` · ${fmtRp(booking.fare)}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingOrbit}>
            <div className={styles.loadingRing1} />
            <div className={styles.loadingRing2} />
            <div className={styles.loadingRing3} />
            <div className={styles.loadingCore}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>
                <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
              </span>
            </div>
          </div>
          <div className={styles.loadingText}>Finding your route</div>
          <div className={styles.loadingDots}>
            <span className={styles.loadingDot1} />
            <span className={styles.loadingDot2} />
            <span className={styles.loadingDot3} />
          </div>
        </div>
      )}
    </div>
  )
}
