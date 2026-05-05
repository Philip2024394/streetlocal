import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import styles from './IntentGrid.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// IntentGrid — popularity-driven tile grid for social intent selection
// Tile sizes reflect real % of people with that intent in the user's city.
// ─────────────────────────────────────────────────────────────────────────────

const TILES = [
  {
    value: 'marriage',
    label: 'Marriage',
    img: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png',
    description: 'I want forever',
    bg:     'rgba(244,114,182,0.15)',
    bgSel:  'rgba(244,114,182,0.28)',
    border: 'rgba(244,114,182,0.35)',
    active: '#F472B6',
    glow:   'rgba(244,114,182,0.45)',
  },
  {
    value: 'dating',
    label: 'Relationship',
    img: 'https://ik.imagekit.io/nepgaxllc/Romantic%20sunset%20lakeside%20embrace.png',
    description: 'Real dating',
    bg:     'rgba(232,69,140,0.15)',
    bgSel:  'rgba(232,69,140,0.28)',
    border: 'rgba(232,69,140,0.35)',
    active: '#E8458C',
    glow:   'rgba(232,69,140,0.45)',
  },
  {
    value: 'friendship',
    label: 'Friendship',
    img: 'https://ik.imagekit.io/nepgaxllc/UntitledDASDASDASDF.png',
    description: 'Platonic only',
    bg:     'rgba(141,198,63,0.12)',
    bgSel:  'rgba(141,198,63,0.24)',
    border: 'rgba(141,198,63,0.3)',
    active: '#F472B6',
    glow:   'rgba(244,114,182,0.4)',
  },
  {
    value: 'date_night',
    label: 'Date Night',
    img: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasd.png',
    description: 'Casual fun',
    bg:     'rgba(244,114,182,0.12)',
    bgSel:  'rgba(244,114,182,0.24)',
    border: 'rgba(244,114,182,0.3)',
    active: '#F472B6',
    glow:   'rgba(244,114,182,0.4)',
  },
  {
    value: 'travel',
    label: 'Travel Partner',
    img: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasdaasdasdasdasd.png',
    description: 'Explore together',
    bg:     'rgba(244,114,182,0.12)',
    bgSel:  'rgba(244,114,182,0.24)',
    border: 'rgba(244,114,182,0.3)',
    active: '#F472B6',
    glow:   'rgba(244,114,182,0.4)',
  },
  {
    value: 'business',
    label: 'Business',
    emoji: '💼',
    description: 'Career connections',
    bg:     'rgba(167,139,250,0.12)',
    bgSel:  'rgba(167,139,250,0.24)',
    border: 'rgba(167,139,250,0.3)',
    active: '#A78BFA',
    glow:   'rgba(167,139,250,0.4)',
  },
  {
    value: 'coaching',
    label: 'Mentorship',
    emoji: '🧠',
    description: 'Learn / Teach',
    bg:     'rgba(251,191,36,0.12)',
    bgSel:  'rgba(251,191,36,0.24)',
    border: 'rgba(251,191,36,0.3)',
    active: '#FBBF24',
    glow:   'rgba(251,191,36,0.4)',
  },
  {
    value: 'pen_pal',
    label: 'Pen Pal',
    emoji: '✉️',
    description: 'Letters, not meets',
    bg:     'rgba(110,231,183,0.12)',
    bgSel:  'rgba(110,231,183,0.24)',
    border: 'rgba(110,231,183,0.3)',
    active: '#6EE7B7',
    glow:   'rgba(110,231,183,0.4)',
  },
]

// Dating-only subset — no business / coaching / pen_pal
const DATING_TILE_VALUES = ['marriage', 'dating', 'date_night', 'friendship', 'travel', 'meet_new']

// Add meet_new tile if not in the main list
const MEET_NEW_TILE = {
  value: 'meet_new',
  label: 'Free Tonight',
  img:   'https://ik.imagekit.io/nepgaxllc/UntitledxcvzcvzxcvzxcASDASD.png',
  description: 'Just socialising',
  bg:     'rgba(99,102,241,0.15)',
  bgSel:  'rgba(99,102,241,0.28)',
  border: 'rgba(99,102,241,0.3)',
  active: '#F472B6',
  glow:   'rgba(99,102,241,0.4)',
}

const ALL_TILES = [...TILES, MEET_NEW_TILE]

// Fallback demo popularities (sum ~100)
const DEMO_POP = {
  marriage: 35, dating: 28, friendship: 16, travel: 8,
  date_night: 5, business: 4, coaching: 3, pen_pal: 1, meet_new: 6,
}

// Rank → grid span — for 6 tiles all cols span 2; for 8 tiles bottom 4 span 1
function getColSpan(rank, total) { return total <= 6 ? 2 : (rank <= 3 ? 2 : 1) }
function getRowSpan(rank)        { return rank <= 1 ? 2 : 1 }

// ── Particle seed (stable per open) ──────────────────────────────────────────
const SHAPES  = ['♡', '♡', '♡', '✦', '·', '·']
function seedParticles() {
  return Array.from({ length: 18 }, (_, i) => ({
    id:      i,
    shape:   SHAPES[i % SHAPES.length],
    left:    `${5 + (i * 5.3) % 90}%`,
    size:    8 + (i * 3.7) % 14,           // 8–22px
    dur:     `${7 + (i * 1.3) % 6}s`,      // 7–13s
    delay:   `${-(i * 0.9) % 8}s`,         // staggered, some already mid-flight
    driftX:  `${-14 + (i * 5) % 28}px`,    // –14 to +14px lateral sway
    opacity: 0.12 + (i * 0.04) % 0.22,     // 0.12–0.34
    blur:    i % 3 === 0 ? '1px' : '0px',  // every 3rd is slightly blurred (depth)
  }))
}

export default function IntentGrid({ open, value, city, onChange, onBrowseAll, mode = 'all' }) {
  const tileSet = mode === 'dating'
    ? ALL_TILES.filter(t => DATING_TILE_VALUES.includes(t.value))
    : ALL_TILES.filter(t => t.value !== 'meet_new') // original 8
  const [pops, setPops]       = useState(DEMO_POP)
  const [visible, setVisible] = useState(false)
  const [statsOn, setStatsOn] = useState(false)
  const particles = useMemo(() => seedParticles(), [])

  useEffect(() => {
    if (!open) { setVisible(false); setStatsOn(false); return }
    setVisible(false)
    setStatsOn(false)

    // Fetch real city data
    ;(async () => {
      try {
        let q = supabase.from('profiles').select('lookingFor').not('lookingFor', 'is', null).limit(2000)
        if (city) q = q.eq('city', city)
        const { data } = await q
        if (data && data.length >= 10) {
          const counts = {}
          data.forEach(r => { if (r.lookingFor) counts[r.lookingFor] = (counts[r.lookingFor] ?? 0) + 1 })
          const total = data.length
          const result = {}
          TILES.forEach(t => { result[t.value] = Math.round(((counts[t.value] ?? 0) / total) * 100) })
          setPops(result)
        }
      } catch { /* keep demo */ }
    })()

    // Staggered entrance
    const t1 = setTimeout(() => setVisible(true),  80)
    const t2 = setTimeout(() => setStatsOn(true), 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open, city, value])

  if (!open) return null

  // Sort by popularity to assign ranks (rank 0 = most popular)
  const sorted = [...tileSet].sort((a, b) => (pops[b.value] ?? 0) - (pops[a.value] ?? 0))


  return createPortal(
    <div className={styles.overlay}>

      <div className={styles.sheet}>

        {/* Particle layer — hearts + sparks drifting up */}
        <div className={styles.particles} aria-hidden="true">
          {particles.map(p => (
            <span
              key={p.id}
              className={styles.particle}
              style={{
                left:            p.left,
                fontSize:        p.size,
                animationDelay:  p.delay,
                '--dur':         p.dur,
                '--drift-x':     p.driftX,
                '--peak':        p.opacity,
                filter:          p.blur !== '0px' ? `blur(${p.blur})` : undefined,
                color:           p.shape === '♡' ? '#F472B6' : 'rgba(255,255,255,0.55)',
              }}
            >{p.shape}</span>
          ))}
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.title}>
              {mode === 'dating' ? 'I am searching for' : 'I joined the app for'}
            </div>
            <div className={styles.sub}>
              {mode === 'dating'
                ? 'love awaits who wishes to find'
                : city ? `Sized by what people want in ${city}` : 'Sized by local popularity'
              }
            </div>
          </div>
          {onBrowseAll && (
            <button
              onClick={onBrowseAll}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0 6px 12px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {sorted.map((tile, rank) => {
            const pct      = pops[tile.value] ?? 0
            const colSpan  = getColSpan(rank, sorted.length)
            const rowSpan  = getRowSpan(rank)
            const isBig    = rowSpan === 2
            const delay    = `${rank * 55}ms`

            return (
              <button
                key={tile.value}
                className={[styles.tile, visible ? styles.tileIn : ''].join(' ')}
                style={{
                  gridColumn:      `span ${colSpan}`,
                  gridRow:         `span ${rowSpan}`,
                  background:      tile.img ? '#000' : tile.bg,
                  borderColor:     tile.border,
                  padding:         0,
                  animationDelay:  delay,
                  transitionDelay: visible ? delay : '0ms',
                }}
                onClick={() => onChange(tile.value)}
              >
                {tile.img ? (
                  /* Full-cover image with gradient overlay + text */
                  <>
                    <img src={tile.img} alt={tile.label} className={styles.tileBgImg} />
                    <div className={styles.tileBgGrad} />
                    <div className={styles.tileOverlayText}>
                      <span className={styles.tileLabel} style={{ fontSize: isBig ? 17 : 12, color: '#fff' }}>{tile.label}</span>
                      {isBig && <span className={styles.tileDesc} style={{ color: '#F472B6' }}>{tile.description}</span>}
                      {pct > 0 && (
                        <span className={[styles.tileStat, statsOn ? styles.tileStatOn : ''].join(' ')} style={{ color: tile.active, position: 'static', opacity: statsOn ? 0.9 : 0, transform: 'none' }}>
                          {pct}%{city ? ` in ${city}` : ''}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  /* Emoji + text layout */
                  <>
                    <span className={styles.tileEmoji} style={{ fontSize: isBig ? 40 : 22 }}>{tile.emoji}</span>
                    <span className={styles.tileLabel} style={{ fontSize: isBig ? 15 : 11 }}>{tile.label}</span>
                    {isBig && <span className={styles.tileDesc}>{tile.description}</span>}
                    {pct > 0 && (
                      <span
                        className={[styles.tileStat, statsOn ? styles.tileStatOn : ''].join(' ')}
                        style={{ color: tile.active }}
                      >
                        {pct}%{city ? ` in ${city}` : ''}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

      </div>
    </div>,
    document.body
  )
}
