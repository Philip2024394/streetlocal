/**
 * ShareButtons — Social share buttons for property detail page.
 */
import { useState } from 'react'

export default function ShareButtons({ title, price, url }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || window.location.href
  const text = `${title} — ${price} on INDOO Property`
  const encoded = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(shareUrl)

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btn = (bg, color, borderColor) => ({
    width: 44, height: 44, borderRadius: 12, cursor: 'pointer', border: `1px solid ${borderColor}`,
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, textDecoration: 'none', transition: 'transform 0.15s',
  })

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginRight: 4 }}>Share:</span>

      {/* WhatsApp */}
      <a href={`https://wa.me/?text=${encoded}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" style={btn('rgba(37,211,102,0.12)', '#25D366', 'rgba(37,211,102,0.25)')}>💬</a>

      {/* Facebook */}
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" style={btn('rgba(24,119,242,0.12)', '#1877F2', 'rgba(24,119,242,0.25)')}>📘</a>

      {/* X / Twitter */}
      <a href={`https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" style={btn('rgba(255,255,255,0.04)', '#fff', 'rgba(255,255,255,0.1)')}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>𝕏</span>
      </a>

      {/* Copy Link */}
      <button onClick={copyLink} style={{ ...btn('rgba(255,255,255,0.04)', '#fff', 'rgba(255,255,255,0.1)'), fontFamily: 'inherit' }}>
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  )
}
