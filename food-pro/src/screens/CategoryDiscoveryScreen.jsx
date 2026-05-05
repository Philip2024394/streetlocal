import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './CategoryDiscoveryScreen.module.css'
import { FOOD_CATEGORIES } from './foodCategories'

// ── Demo avatars — replaced by real users when live ──────────────────────────
const DEMO_AVATARS = [
  { id: 'd1', photo_url: 'https://i.pravatar.cc/100?img=1',  name: 'Sari' },
  { id: 'd2', photo_url: 'https://i.pravatar.cc/100?img=5',  name: 'Budi' },
  { id: 'd3', photo_url: 'https://i.pravatar.cc/100?img=9',  name: 'Rina' },
  { id: 'd4', photo_url: 'https://i.pravatar.cc/100?img=14', name: 'Dian' },
  { id: 'd5', photo_url: 'https://i.pravatar.cc/100?img=20', name: 'Agus' },
  { id: 'd6', photo_url: 'https://i.pravatar.cc/100?img=25', name: 'Tini' },
  { id: 'd7', photo_url: 'https://i.pravatar.cc/100?img=33', name: 'Wahyu' },
  { id: 'd8', photo_url: 'https://i.pravatar.cc/100?img=44', name: 'Dewi' },
  { id: 'd9', photo_url: 'https://i.pravatar.cc/100?img=52', name: 'Fajar' },
]

// ── Time-of-day viewer count — Yogyakarta activity curve ─────────────────────
// Based on: Jogja pop 3.72M, 175K+ students, GoFood peak data
// Breakfast 06–08 | Lunch rush 11:30–13:30 | Dinner 18–21 | Late night 21–23
const HOUR_RANGES = {
  //  hour  : [min, max]
  0:  [7,  12],   // early morning — night owls, students
  1:  [7,  10],   // very quiet
  2:  [7,   9],
  3:  [7,   8],
  4:  [7,   9],
  5:  [7,  14],   // pre-dawn, early risers
  6:  [12, 28],   // breakfast rush begins
  7:  [18, 35],   // peak breakfast
  8:  [15, 28],   // post-breakfast
  9:  [10, 20],   // mid-morning lull
  10: [12, 24],   // pre-lunch browsing
  11: [28, 48],   // lunch rush building
  12: [38, 60],   // PEAK LUNCH
  13: [32, 55],   // peak lunch continues
  14: [20, 35],   // post-lunch
  15: [14, 25],   // afternoon dip
  16: [15, 28],   // after school/campus
  17: [22, 40],   // early dinner browsing
  18: [35, 58],   // PEAK DINNER
  19: [38, 60],   // peak dinner
  20: [32, 55],   // dinner continues
  21: [25, 48],   // late night — student heavy
  22: [20, 38],   // late night
  23: [12, 22],   // winding down
}

// Generate N unique viewer counts spread across 1–90.
// Time-of-day biases the density band but counts never repeat
// and are always at least MIN_GAP apart so no two cards look the same.
const MIN_GAP = 7

function generateSpreadCounts(n) {
  const hour = new Date().getHours()
  const [bandMin, bandMax] = HOUR_RANGES[hour] ?? [7, 30]
  // Scale band to 1–90 with some spread outside it for variety
  const lo = Math.max(1,  bandMin - 5)
  const hi = Math.min(90, bandMax + 10)

  const counts = new Set()
  let attempts = 0
  while (counts.size < n && attempts < 500) {
    attempts++
    const v = Math.floor(Math.random() * (hi - lo + 1)) + lo
    // Ensure no existing count is within MIN_GAP
    const tooClose = [...counts].some(c => Math.abs(c - v) < MIN_GAP)
    if (!tooClose) counts.add(v)
  }
  // If we ran out of room in the band, fill remaining from full 1–90
  while (counts.size < n) {
    const v = Math.floor(Math.random() * 90) + 1
    const tooClose = [...counts].some(c => Math.abs(c - v) < MIN_GAP)
    if (!tooClose) counts.add(v)
  }
  // Shuffle so high/low numbers aren't always in the same card slot
  return [...counts].sort(() => Math.random() - 0.5)
}

// ── Search demo data (replaced by Supabase when live) ────────────────────────
const DEMO_SEARCH = [
  { id: 1, name: 'Warung Bu Sari',        category: 'rice',      cuisine_type: 'Javanese',   rating: 4.8, is_open: true  },
  { id: 2, name: 'Bakso Pak Budi',        category: 'noodles',   cuisine_type: 'Indonesian', rating: 4.6, is_open: true  },
  { id: 3, name: 'Ayam Geprek Mbak Rina', category: 'grilled',   cuisine_type: 'Indonesian', rating: 4.9, is_open: false },
  { id: 4, name: 'Es Teler 77',           category: 'drinks',    cuisine_type: 'Indonesian', rating: 4.5, is_open: true  },
  { id: 5, name: 'Pisang Goreng Mbok Tum',category: 'snacks',    cuisine_type: 'Javanese',   rating: 4.7, is_open: true  },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function CategoryDiscoveryScreen({ onClose, onSelectCategory }) {
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [search,         setSearch]         = useState('')
  const [searchFocused,  setSearchFocused]  = useState(false)
  const [searchResults,  setSearchResults]  = useState([])
  const [allRestaurants, setAllRestaurants] = useState(DEMO_SEARCH)

  // One unique spread count per category — regenerated every 60s
  const catCount = FOOD_CATEGORIES.filter(c => c.id !== 'all').length
  const [viewerCounts, setViewerCounts] = useState(() => generateSpreadCounts(catCount))

  useEffect(() => {
    const id = setInterval(() => setViewerCounts(generateSpreadCounts(catCount)), 60000)
    return () => clearInterval(id)
  }, [catCount])

  const containerRef = useRef(null)
  const searchRef    = useRef(null)
  // One ref per category video element
  const videoRefs    = useRef(FOOD_CATEGORIES.map(() => null))

  // ── Load restaurant list for search ──
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('restaurants')
      .select('id, name, category, cuisine_type, rating, is_open')
      .eq('status', 'approved')
      .then(({ data }) => { if (data?.length) setAllRestaurants(data) })
  }, [])

  // ── Live search filter ──
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const q = search.toLowerCase()
    setSearchResults(
      allRestaurants.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine_type?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
      ).slice(0, 8)
    )
  }, [search, allRestaurants])

  // Video src lifecycle is now fully managed inside each CategoryCard.
  // The parent no longer needs to call play/pause — cards self-manage on isActive.

  // ── Scroll tracking ──
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== activeIndex) setActiveIndex(idx)
  }, [activeIndex])

  // ── Handlers ──
  const handleCategoryTap = (cat) => {
    setSearch('')
    setSearchFocused(false)
    onSelectCategory(cat)
  }

  const handleSearchSelect = (restaurant) => {
    setSearch('')
    setSearchFocused(false)
    const cat = FOOD_CATEGORIES.find(c => c.id === restaurant.category) || FOOD_CATEGORIES[0]
    onSelectCategory(cat, restaurant.id)
  }

  const showSearchOverlay = searchFocused && search.trim().length > 0

  return (
    <div className={styles.screen}>

      {/* ── Pinned search bar ────────────────────────────────────────────────── */}
      <div className={styles.searchBar}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className={styles.searchInputWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            id="food-search"
            name="food-search"
            className={styles.searchInput}
            placeholder="Search In The Street — warung, dish, cuisine…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            autoComplete="off"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => { setSearch(''); searchRef.current?.focus() }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Search overlay ───────────────────────────────────────────────────── */}
      {showSearchOverlay && (
        <div className={styles.searchOverlay}>
          {searchResults.length === 0
            ? <div className={styles.searchEmpty}>No results for "{search}"</div>
            : searchResults.map(r => (
              <button key={r.id} className={styles.searchResult} onClick={() => handleSearchSelect(r)}>
                <span className={styles.searchResultEmoji}>
                  {FOOD_CATEGORIES.find(c => c.id === r.category)?.emoji ?? '🍽'}
                </span>
                <span className={styles.searchResultInfo}>
                  <span className={styles.searchResultName}>{r.name}</span>
                  <span className={styles.searchResultSub}>{r.cuisine_type} · {r.is_open ? 'Open now' : 'Closed'}</span>
                </span>
                {r.rating && <span className={styles.searchResultRating}>⭐ {r.rating}</span>}
              </button>
            ))
          }
        </div>
      )}

      {/* ── Right-side scroll dots ───────────────────────────────────────────── */}
      <div className={styles.dots}>
        {FOOD_CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            style={i === activeIndex ? { background: cat.color } : {}}
          />
        ))}
      </div>

      {/* ── Full-screen snap-scroll cards ────────────────────────────────────── */}
      <div className={styles.cardContainer} ref={containerRef} onScroll={handleScroll}>
        {FOOD_CATEGORIES.map((cat, i) => {
          const nonAllIndex = FOOD_CATEGORIES.filter(c => c.id !== 'all').findIndex(c => c.id === cat.id)
          return (
            <CategoryCard
              key={cat.id}
              cat={cat}
              isActive={i === activeIndex}
              videoRef={el => { videoRefs.current[i] = el }}
              onClick={() => handleCategoryTap(cat)}
              viewerCount={nonAllIndex >= 0 ? viewerCounts[nonAllIndex] : null}
            />
          )
        })}
      </div>

    </div>
  )
}

// ── Now In Kitchen widget ─────────────────────────────────────────────────────
function NowInKitchen({ viewerCount }) {
  const [visibleSet, setVisibleSet] = useState(() => DEMO_AVATARS.slice(0, 5))
  const [fade,       setFade]       = useState(true)

  // Cycle visible avatars every 5s with a fade crossfade
  useEffect(() => {
    const avatarId = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setVisibleSet(prev => {
          const pool = DEMO_AVATARS.filter(u => !prev.find(p => p.id === u.id))
          if (!pool.length) return DEMO_AVATARS.slice(0, 5)
          const swap = Math.floor(Math.random() * prev.length)
          const next = [...prev]
          next[swap] = pool[Math.floor(Math.random() * pool.length)]
          return next
        })
        setFade(true)
      }, 300)
    }, 5000)

    return () => clearInterval(avatarId)
  }, [])

  if (!visibleSet.length || viewerCount == null) return null

  const extra = Math.max(0, viewerCount - 5)

  return (
    <div className={styles.kitchenWrap}>
      <div className={styles.kitchenAvatars} style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        {visibleSet.map(u => (
          <div key={u.id} className={styles.kitchenAvatar}>
            <img
              src={u.photo_url || 'https://ik.imagekit.io/nepgaxllc/sdfasdfasdf.png'}
              alt={u.name}
              className={styles.kitchenAvatarImg}
              onError={e => { e.target.src = 'https://ik.imagekit.io/nepgaxllc/sdfasdfasdf.png' }}
            />
          </div>
        ))}
        {extra > 0 && (
          <div className={styles.kitchenExtra}>+{extra}</div>
        )}
      </div>
      <span className={styles.kitchenLabel}>Now in the Kitchen</span>
    </div>
  )
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, isActive, videoRef: videoRefCallback, onClick, viewerCount }) {
  const everActivatedRef = useRef(false)
  const localRef = useRef(null)
  const [soundOn, setSoundOn] = useState(false)
  const hasVideo = cat.videoUrl

  // Stable local ref — forwards to parent callback without recreating
  const callbackRef = useRef(videoRefCallback)
  callbackRef.current = videoRefCallback

  const setRefs = useCallback((el) => {
    localRef.current = el
    callbackRef.current?.(el)
  }, [])

  // ── Effect 1: ACTIVATION
  useEffect(() => {
    if (!isActive || !hasVideo) return
    everActivatedRef.current = true
    let cancelled = false
    const el = localRef.current
    if (!el) return
    const timer = setTimeout(() => {
      if (cancelled || !localRef.current) return
      localRef.current.src = cat.videoUrl
      localRef.current.load()
      const handleLoaded = () => {
        requestAnimationFrame(() => {
          if (cancelled || !localRef.current) return
          if (cat.withSound) { localRef.current.muted = false; setSoundOn(true) }
          localRef.current.play().catch(() => {})
        })
      }
      localRef.current.addEventListener('loadeddata', handleLoaded, { once: true })
      if (localRef.current.readyState >= 2) handleLoaded()
    }, 50)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isActive, hasVideo, cat.videoUrl, cat.withSound])

  // ── Effect 2: DEACTIVATION
  useEffect(() => {
    if (!everActivatedRef.current) return
    if (isActive) return
    const v = localRef.current
    if (!v) return
    v.pause(); v.src = ''; v.load(); setSoundOn(false)
  }, [isActive])

  // ── Effect 3: UNMOUNT CLEANUP
  useEffect(() => {
    return () => {
      const v = localRef.current
      if (v) { v.pause(); v.src = ''; v.load() }
    }
  }, [])

  function toggleSound(e) {
    e.stopPropagation()
    const v = localRef.current
    if (!v) return
    const next = !soundOn
    v.muted = !next
    setSoundOn(next)
  }

  return (
    <div className={styles.card} onClick={onClick}>

      {/* ── Background: video (if supplied) or gradient ── */}
      {hasVideo ? (
        <>
          {/* No src in JSX — managed imperatively by the effect above */}
          <video
            ref={setRefs}
            className={styles.cardVideo}
            poster={cat.posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
          <div className={styles.videoScrim} />
          {cat.withSound && isActive && (
            <button className={styles.soundBtn} onClick={toggleSound} aria-label={soundOn ? 'Mute' : 'Unmute'}>
              {soundOn ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              )}
            </button>
          )}
        </>
      ) : (
        <>
          {cat.posterUrl && (
            <div className={styles.cardBg} style={{ backgroundImage: `url("${cat.posterUrl}")` }} />
          )}
          <div className={styles.cardBg} style={{ backgroundImage: cat.gradient }} />
        </>
      )}

      <div className={styles.cardOverlay} />
      <div className={styles.cardTopGlow} style={{ background: `linear-gradient(to bottom, ${cat.color}22 0%, transparent 40%)` }} />

      {/* Now in the Kitchen — only mount for active card */}
      {cat.id !== 'all' && isActive && <NowInKitchen viewerCount={viewerCount} />}

      <div className={styles.cardBottom}>
        <span className={styles.tagline}>{cat.tagline}</span>
        <h2 className={styles.categoryName}>{cat.label}</h2>
        <button className={styles.explorBtn} style={{ background: '#8DC63F' }} onClick={onClick}>
          <span>
            <span>Explore {cat.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </button>
      </div>

      <div className={styles.activeStrip} style={{ background: '#8DC63F', opacity: isActive ? 1 : 0 }} />
    </div>
  )
}
