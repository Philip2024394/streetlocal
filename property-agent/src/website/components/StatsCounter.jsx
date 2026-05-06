/**
 * StatsCounter — Animated number that counts up when scrolled into view.
 */
import { useState, useEffect } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function StatsCounter({ value, label, suffix = '', color = '#8DC63F', duration = 1500 }) {
  const [ref, visible] = useScrollReveal()
  const [count, setCount] = useState(0)
  const numVal = parseInt(String(value).replace(/\D/g, ''), 10) || 0

  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.ceil(numVal / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= numVal) { setCount(numVal); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [visible, numVal, duration])

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{count}{suffix}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 6 }}>{label}</div>
    </div>
  )
}
