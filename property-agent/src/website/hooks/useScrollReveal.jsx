/**
 * useScrollReveal — Disabled for mobile agent app.
 * Passthrough only — no IntersectionObserver, no DOM manipulation.
 */
import { useRef } from 'react'

export function useScrollReveal() {
  const ref = useRef(null)
  return [ref, true]
}

export function ScrollReveal({ children, delay = 0, direction = 'up', style = {} }) {
  return <div style={style}>{children}</div>
}
