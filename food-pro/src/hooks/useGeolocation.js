import { useState, useEffect, useRef, useCallback } from 'react'
import { DEMO_CENTER } from '@/demo/mockData'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export function useGeolocation({ watch = false } = {}) {
  const [coords, setCoords] = useState(
    IS_DEMO ? { lat: DEMO_CENTER.lat, lng: DEMO_CENTER.lng, accuracy: 8 } : null
  )
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!IS_DEMO)
  const watchIdRef = useRef(null)

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  }

  const onSuccess = useCallback((position) => {
    setCoords({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    })
    setError(null)
    setLoading(false)
  }, [])

  const onError = useCallback((err) => {
    let message
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable in settings.'
        break
      case err.POSITION_UNAVAILABLE:
        message = 'Location unavailable. Please try again.'
        break
      case err.TIMEOUT:
        message = 'Location timed out. Please try again.'
        break
      default:
        message = 'Could not get your location.'
    }
    setError(message)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (IS_DEMO) return // Use mock coords

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
        }
      }
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }, [watch]) // eslint-disable-line

  const refresh = useCallback(() => {
    if (!navigator.geolocation) return
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      ...options,
      maximumAge: 0, // Force fresh reading
    })
  }, [onSuccess, onError]) // eslint-disable-line

  return { coords, error, loading, refresh }
}
