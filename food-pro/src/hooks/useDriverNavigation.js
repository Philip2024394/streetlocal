/**
 * useDriverNavigation — orchestrates in-app driver navigation.
 * Fetches route, tracks GPS, advances steps, detects off-route, triggers audio.
 * Provides speed, remaining distance, trip progress, and time-to-next-turn.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getNavigationRoute } from '@/utils/googleDirections'
import { haversineKm } from '@/utils/distance'
import { speakInstruction, speakArrival, speakReroute, cancelSpeech } from '@/utils/navAudio'

const STEP_ADVANCE_METERS = 30
const OFF_ROUTE_METERS = 100
const REROUTE_COOLDOWN = 15000

function distToPolyline(point, path) {
  let minDist = Infinity
  for (const p of path) {
    const d = haversineKm(point.lat, point.lng, p.lat, p.lng) * 1000
    if (d < minDist) minDist = d
  }
  return minDist
}

function calcBearing(from, to) {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Sum haversine distance along a path from startIdx to end. */
function pathDistanceKm(path, startIdx) {
  let d = 0
  for (let i = Math.max(0, startIdx); i < path.length - 1; i++) {
    d += haversineKm(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng)
  }
  return d
}

/** Find closest index in path to a given point. */
function closestPathIdx(point, path) {
  let minD = Infinity, idx = 0
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(point.lat, point.lng, path[i].lat, path[i].lng)
    if (d < minD) { minD = d; idx = i }
  }
  return idx
}

export default function useDriverNavigation(destination, enabled = true) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [driverPos, setDriverPos] = useState(null)
  const [bearing, setBearing] = useState(0)
  const [isOffRoute, setIsOffRoute] = useState(false)
  const [etaMin, setEtaMin] = useState(null)
  const [distToNextTurn, setDistToNextTurn] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [speedKmh, setSpeedKmh] = useState(0)
  const [remainingKm, setRemainingKm] = useState(null)
  const [tripProgress, setTripProgress] = useState(0)
  const [timeToTurnSec, setTimeToTurnSec] = useState(null)
  const [closestIdx, setClosestIdx] = useState(0)
  const [navAlerts, setNavAlerts] = useState([]) // { id, type, message, icon, ts }

  const watchRef = useRef(null)
  const lastRerouteRef = useRef(0)
  const prevPosRef = useRef(null)
  const prevTimeRef = useRef(null)
  const announcedStepRef = useRef(-1)
  const alertedThresholdRef = useRef({}) // track which distance thresholds fired per step
  const alertIdRef = useRef(0)
  const demoIdxRef = useRef(0)
  const demoTimerRef = useRef(null)

  const pushAlert = useCallback((type, message, icon) => {
    const id = ++alertIdRef.current
    setNavAlerts(prev => [...prev.slice(-4), { id, type, message, icon, ts: Date.now() }])
    // Auto-dismiss after 4s
    setTimeout(() => setNavAlerts(prev => prev.filter(a => a.id !== id)), 4000)
  }, [])

  const [isDemo, setIsDemo] = useState(false)

  const fetchRoute = useCallback(async (originLat, originLng) => {
    if (!destination?.lat || !originLat) return
    // If origin ≈ destination (within 100m), offset origin slightly for a valid route
    const distM = haversineKm(originLat, originLng, destination.lat, destination.lng) * 1000
    let oLat = originLat, oLng = originLng
    if (distM < 100) {
      oLat = originLat + 0.008 // ~800m offset north
      oLng = originLng + 0.002
    }
    setLoading(true)
    const navRoute = await getNavigationRoute(oLat, oLng, destination.lat, destination.lng)
    if (navRoute) {
      setRoute(navRoute)
      setCurrentStepIdx(0)
      setIsOffRoute(false)
      setArrived(false)
      announcedStepRef.current = -1
      if (navRoute.isDemo) setIsDemo(true)
    }
    setLoading(false)
  }, [destination?.lat, destination?.lng])

  // Initial route fetch
  useEffect(() => {
    if (!enabled || !destination?.lat) return
    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        prevTimeRef.current = Date.now()
        // Check if real GPS is close to destination (within 50km = likely same city)
        const distToDestKm = haversineKm(coords.lat, coords.lng, destination.lat, destination.lng)
        if (distToDestKm < 50) {
          // Real GPS is near the destination city — use actual position
          fetchRoute(coords.lat, coords.lng)
        } else {
          // Real GPS is far away (dev/testing) — use destination as origin for demo
          fetchRoute(destination.lat, destination.lng)
        }
      },
      () => fetchRoute(destination.lat, destination.lng),
      { enableHighAccuracy: true, timeout: 5000 }
    )

    return () => {
      cancelled = true
      cancelSpeech()
    }
  }, [enabled, destination?.lat, destination?.lng, fetchRoute])

  // Real GPS watch — only when NOT in demo mode
  useEffect(() => {
    if (!enabled || isDemo) return

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const now = Date.now()

        if (prevPosRef.current && prevTimeRef.current) {
          const dist = haversineKm(prevPosRef.current.lat, prevPosRef.current.lng, coords.lat, coords.lng) * 1000
          const dtHours = (now - prevTimeRef.current) / 3600000
          if (dist > 5) {
            setBearing(calcBearing(prevPosRef.current, coords))
            if (dtHours > 0) setSpeedKmh(Math.round((dist / 1000) / dtHours))
            prevPosRef.current = coords
            prevTimeRef.current = now
          }
        } else {
          prevPosRef.current = coords
          prevTimeRef.current = now
        }

        if (pos.coords.speed != null && pos.coords.speed >= 0) {
          setSpeedKmh(Math.round(pos.coords.speed * 3.6))
        }

        setDriverPos(coords)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [enabled, isDemo])

  // Demo mode: simulate driver moving along the route path (no real GPS)
  useEffect(() => {
    if (!route?.isDemo || !route?.decodedPath?.length || arrived) return

    // Kill any real GPS watch so it doesn't interfere
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }

    const path = route.decodedPath
    demoIdxRef.current = 0
    setDriverPos(path[0])
    prevPosRef.current = path[0]
    prevTimeRef.current = Date.now()

    demoTimerRef.current = setInterval(() => {
      demoIdxRef.current += 1
      if (demoIdxRef.current >= path.length) {
        clearInterval(demoTimerRef.current)
        return
      }
      const pos = path[demoIdxRef.current]
      const prev = path[demoIdxRef.current - 1]
      const dist = haversineKm(prev.lat, prev.lng, pos.lat, pos.lng) * 1000
      const simSpeed = Math.round((dist / 1000) / (2 / 3600))
      setSpeedKmh(Math.min(simSpeed, 45))
      setBearing(calcBearing(prev, pos))
      setDriverPos(pos)
      prevPosRef.current = prev
    }, 2000)

    return () => clearInterval(demoTimerRef.current)
  }, [route?.isDemo, route?.decodedPath, arrived])

  // Process position updates — advance steps, detect off-route, compute metrics, fire alerts
  useEffect(() => {
    if (!route || !driverPos || arrived) return

    const { steps, decodedPath } = route

    // Distance to destination
    const distToDest = haversineKm(driverPos.lat, driverPos.lng, destination.lat, destination.lng) * 1000
    if (distToDest < 30) {
      setArrived(true)
      speakArrival()
      pushAlert('arrived', 'You have arrived at your destination!', 'arrived')
      return
    }

    // Closest point on path → progress tracking
    const cIdx = closestPathIdx(driverPos, decodedPath)
    setClosestIdx(cIdx)

    // Check if driver passed the destination (beyond last point and moving away)
    if (cIdx >= decodedPath.length - 1 && distToDest > 50 && distToDest < 200) {
      const key = 'passed-dest'
      if (!alertedThresholdRef.current[key]) {
        alertedThresholdRef.current[key] = true
        pushAlert('warning', 'You passed the destination — make a U-turn', 'uturn')
      }
    }

    // Remaining distance along path
    const remKm = pathDistanceKm(decodedPath, cIdx)
    setRemainingKm(Math.round(remKm * 10) / 10)

    // Trip progress %
    const totalKm = route.distanceKm || pathDistanceKm(decodedPath, 0)
    if (totalKm > 0) setTripProgress(Math.min(100, Math.round(((totalKm - remKm) / totalKm) * 100)))

    // Off-route detection
    const distFromRoute = distToPolyline(driverPos, decodedPath)
    if (distFromRoute > OFF_ROUTE_METERS) {
      setIsOffRoute(true)
      const now = Date.now()
      if (now - lastRerouteRef.current > REROUTE_COOLDOWN) {
        lastRerouteRef.current = now
        speakReroute()
        pushAlert('warning', 'You are off route — finding a new route', 'reroute')
        fetchRoute(driverPos.lat, driverPos.lng)
      }
    } else {
      setIsOffRoute(false)
    }

    // Advance step + distance-based alerts
    if (steps && currentStepIdx < steps.length) {
      const currentStepData = steps[currentStepIdx]
      const nextStepEnd = currentStepData?.endLocation
      if (nextStepEnd) {
        const distToStep = haversineKm(driverPos.lat, driverPos.lng, nextStepEnd.lat, nextStepEnd.lng) * 1000
        setDistToNextTurn(Math.round(distToStep))

        // Time to next turn based on current speed
        const spd = speedKmh > 0 ? speedKmh : 20
        setTimeToTurnSec(Math.max(0, Math.round((distToStep / 1000) / (spd / 3600))))

        // Fire distance-threshold alerts for upcoming turn
        const thresholds = [200, 100, 50, 20]
        for (const t of thresholds) {
          const key = `step-${currentStepIdx}-${t}`
          if (distToStep <= t && !alertedThresholdRef.current[key]) {
            alertedThresholdRef.current[key] = true
            const maneuver = currentStepData.maneuver || 'straight'
            const dirLabel = maneuver.includes('left') ? 'turn left'
              : maneuver.includes('right') ? 'turn right'
              : maneuver.includes('uturn') ? 'make a U-turn'
              : maneuver === 'straight' ? 'continue straight'
              : currentStepData.instruction?.toLowerCase() || 'next maneuver'
            pushAlert('turn', `In ${t}m, ${dirLabel}`, maneuver)
          }
        }

        if (distToStep < STEP_ADVANCE_METERS && currentStepIdx < steps.length - 1) {
          setCurrentStepIdx(prev => prev + 1)
        }
      }
    }

    // ETA based on remaining distance + speed
    const avgSpeed = speedKmh > 3 ? speedKmh : 20
    setEtaMin(Math.max(1, Math.ceil((remKm / avgSpeed) * 60)))

  }, [driverPos, route, currentStepIdx, destination, arrived, fetchRoute, speedKmh, pushAlert])

  // Announce current step via audio
  useEffect(() => {
    if (!route?.steps || arrived) return
    const step = route.steps[currentStepIdx]
    if (step && currentStepIdx !== announcedStepRef.current) {
      announcedStepRef.current = currentStepIdx
      speakInstruction(step.instruction)
    }
  }, [currentStepIdx, route, arrived])

  const currentStep = route?.steps?.[currentStepIdx] || null
  const nextStep = route?.steps?.[currentStepIdx + 1] || null

  return {
    route,
    loading,
    driverPos,
    bearing,
    currentStep,
    nextStep,
    currentStepIdx,
    totalSteps: route?.steps?.length || 0,
    etaMin,
    distToNextTurn,
    timeToTurnSec,
    isOffRoute,
    arrived,
    speedKmh,
    remainingKm,
    tripProgress,
    closestIdx,
    navAlerts,
    refetchRoute: () => driverPos && fetchRoute(driverPos.lat, driverPos.lng),
  }
}
