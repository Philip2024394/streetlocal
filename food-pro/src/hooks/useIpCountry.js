import { useState, useEffect } from 'react'

/**
 * Detects the user's country from their IP address using ipapi.co (free, no key).
 * Result is cached in sessionStorage so it's only fetched once per browser session.
 * Returns null until resolved.
 */
export function useIpCountry() {
  const [ipCountry, setIpCountry] = useState(() => {
    return sessionStorage.getItem('ip_country') ?? null
  })

  useEffect(() => {
    if (ipCountry) return // already have it (from cache or prior resolve)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000) // 4s timeout

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        const name = d?.country_name
        if (name) {
          sessionStorage.setItem('ip_country', name)
          setIpCountry(name)
        }
      })
      .catch(() => {}) // silent fail — app works without it
      .finally(() => clearTimeout(timer))
  }, []) // eslint-disable-line

  return ipCountry
}
