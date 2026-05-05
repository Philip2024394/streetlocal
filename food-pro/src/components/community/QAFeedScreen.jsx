/**
 * QAFeedScreen
 *
 * mode='profile'  — opened from a dating card. Shows that profile's posts
 *                   first (targetUserId), then continues into the global feed.
 *                   Background = that profile's photo (clear).
 *
 * mode='live'     — "Indoo Live" opened from the home nav. Shows all users'
 *                   posts. A ProfileIntroSlide is inserted whenever the author
 *                   changes so each person gets their own "page". Category
 *                   filter: All | Dating.
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import CategoryDiscoveryScreen from '@/screens/CategoryDiscoveryScreen'
import RestaurantBrowseScreen  from '@/screens/RestaurantBrowseScreen'
import SellerProfileSheet      from '@/components/commerce/SellerProfileSheet'
import ProductDetailSheet      from '@/components/commerce/ProductDetailSheet'
import LiveMarketplaceFeed     from './LiveMarketplaceFeed'
import { ShareSheet, ProfileIntroSlide, PostSlide, GRAD_PALETTES } from './QAFeedItems'
import QAFeedCornerPanel       from './QAFeedCornerPanel'
import QAFeedInputBar          from './QAFeedInputBar'
import styles from './QAFeedScreen.module.css'

// ── Seed posts ───────────────────────────────────────────────────────────────
const SEED_POSTS = [
  { id: 'seed-1', userId: 'u1', displayName: 'Maya R.',  photoURL: 'https://i.pravatar.cc/400?img=1',  text: 'Anyone know the best rooftop bar in Seminyak right now? Looking for sunset vibes 🌅', likes: 14, dislikes: 0, createdAt: Date.now() - 8 * 60000 },
  { id: 'seed-2', userId: 'u2', displayName: 'James T.', photoURL: 'https://i.pravatar.cc/400?img=7',  text: 'Is the Indoo marketplace open for international shipping or Bali only? 🌍', likes: 6, dislikes: 1, createdAt: Date.now() - 22 * 60000 },
  { id: 'seed-3', userId: 'u3', displayName: 'Sari W.',  photoURL: 'https://i.pravatar.cc/400?img=5',  text: 'What are the best warungs near Canggu for a big breakfast? 🍳', likes: 21, dislikes: 0, createdAt: Date.now() - 45 * 60000 },
  { id: 'seed-4', userId: 'u4', displayName: 'Luca M.',  photoURL: 'https://i.pravatar.cc/400?img=12', text: 'Looking for a surf school that takes complete beginners — any recommendations? 🏄', likes: 9, dislikes: 0, createdAt: Date.now() - 90 * 60000 },
  { id: 'seed-5', userId: 'u5', displayName: 'Priya K.', photoURL: 'https://i.pravatar.cc/400?img=9',  text: 'Is there a night market happening this weekend in Ubud? 🌙', likes: 33, dislikes: 2, createdAt: Date.now() - 120 * 60000 },
]

// ── Admin ticker messages ────────────────────────────────────────────────────
const TICKER_MSGS = [
  '🍽️ New restaurant just joined — Warung Sunset Bali is now taking orders',
  '🛍️ New on marketplace — Handmade batik scarves now available',
  '💬 Be the first to ask a question! The community is listening',
  '🆕 Bali Coffee House just joined — check them out in the Food section',
  '🎉 Welcome to Q&A — ask about food spots, local tips, or anything on your mind',
  '🛵 New driver partners joined this week in your area',
  '🌟 New wellness products added to the marketplace — browse now',
  '📍 Three new restaurants opened in Seminyak this week',
  '💡 Ask the community — someone always has a great tip',
  '🏖️ Weekend markets, beach clubs, hidden gems — ask away!',
]

// ── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const text = TICKER_MSGS.join('   ·   ')
  return (
    <div className={styles.ticker}>
      <span className={styles.tickerLive}>LIVE</span>
      <div className={styles.tickerTrack}>
        <span className={styles.tickerText}>{text}   ·   {text}</span>
      </div>
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────
// viewerProfile = { displayName, photoURL, age, city, area, category } — the
//   logged-in user's own profile. In live mode their intro slide is always #1.
export default function QAFeedScreen({ open, onClose, user, viewerSession, viewerProfile, targetUserId, mode = 'profile', onConnect, onOrderViaChat }) {
  const isLiveMode = mode === 'live'

  const [posts,        setPosts]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [inputText,    setInputText]    = useState('')
  const [sending,      setSending]      = useState(false)
  const [askOpen,      setAskOpen]      = useState(false)
  const [flaggedIds,   setFlaggedIds]   = useState(new Set())
  const [likedIds,     setLikedIds]     = useState(new Set())
  const [dislikedIds,  setDislikedIds]  = useState(new Set())
  const [onlineCount,  setOnlineCount]  = useState(null)
  const [activeIdx,    setActiveIdx]    = useState(0)
  const [searchQuery,      setSearchQuery]      = useState('')
  const [shareTarget,      setShareTarget]      = useState(null)
  const [stickerOpen,      setStickerOpen]      = useState(false)
  const [selectedSticker,  setSelectedSticker]  = useState(null)
  const [hereIds,          setHereIds]          = useState(new Set())
  const [flashMode,        setFlashMode]        = useState(false)
  const [viewerMap,        setViewerMap]        = useState({})
  const [liveFoodOpen,       setLiveFoodOpen]       = useState(false)
  const [liveFoodBrowseOpen, setLiveFoodBrowseOpen] = useState(false)
  const [liveFoodCategory,   setLiveFoodCategory]   = useState(null)
  const [liveFoodScrollToId, setLiveFoodScrollToId] = useState(null)
  const [cornerPanel,        setCornerPanel]        = useState(null) // 'shop'|'gallery'|'people'|'hot'
  const [cornerSeller,       setCornerSeller]       = useState(null)
  const [liveMarketOpen,     setLiveMarketOpen]     = useState(false)
  const [liveMarketProduct,  setLiveMarketProduct]  = useState(null)

  const feedRef  = useRef(null)
  const inputRef = useRef(null)

  const myId    = user?.id ?? user?.uid ?? null
  const myName  = user?.displayName ?? viewerProfile?.displayName ?? 'Member'
  const myPhoto = user?.photoURL    ?? viewerProfile?.photoURL    ?? null

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setActiveIdx(0)
    loadPosts()
  }, [open, targetUserId]) // eslint-disable-line

  // Live online count simulation
  useEffect(() => {
    if (!open) return
    const base = Math.floor(Math.random() * 24) + 8
    setOnlineCount(base)
    const id = setInterval(() => {
      setOnlineCount(n => Math.max(1, n + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 1 : 0)))
    }, 8000)
    return () => clearInterval(id)
  }, [open])

  // Per-post viewer count — simulated from post age, refreshes every 20s
  useEffect(() => {
    if (!open || posts.length === 0) return
    const build = () => {
      const map = {}
      posts.forEach(p => {
        const ageMin = (Date.now() - p.createdAt) / 60000
        const base   = Math.max(1, Math.round(14 - ageMin * 0.06))
        map[p.id]    = Math.max(1, base + Math.floor(Math.random() * 6))
      })
      setViewerMap(map)
    }
    build()
    const id = setInterval(build, 20000)
    return () => clearInterval(id)
  }, [open, posts])

  // Track active slide via IntersectionObserver
  useEffect(() => {
    const feed = feedRef.current
    if (!feed || items.length === 0) return
    const slides = feed.querySelectorAll('[data-slide]')
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveIdx(Number(e.target.dataset.slide)) }) },
      { root: feed, threshold: 0.6 }
    )
    slides.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [posts]) // eslint-disable-line

  useEffect(() => {
    if (askOpen) setTimeout(() => inputRef.current?.focus(), 80)
  }, [askOpen])

  const mapRow = r => ({
    id:             r.id,
    userId:         r.user_id,
    displayName:    r.display_name ?? 'Member',
    photoURL:       r.photo_url ?? null,
    age:            r.age ?? null,
    city:           r.city ?? null,
    area:           r.area ?? null,
    category:       r.category ?? 'dating',
    bio:            r.bio ?? null,
    stickerEmoji:   r.sticker_emoji ?? null,
    text:           r.text,
    likes:          r.likes ?? 0,
    dislikes:       r.dislikes ?? 0,
    hereCount:      r.here_count ?? 0,
    isFlash:        r.is_flash ?? false,
    flashExpiresAt: r.flash_expires_at ? new Date(r.flash_expires_at).getTime() : null,
    createdAt:      new Date(r.created_at).getTime(),
  })

  async function loadPosts() {
    try {
      if (!supabase) throw new Error('no supabase')

      if (isLiveMode) {
        // In live mode: viewer's own posts first, then everyone else's
        const queries = []
        if (myId) {
          queries.push(
            supabase.from('qa_feed').select('*').eq('user_id', myId)
              .order('created_at', { ascending: false }).limit(20)
          )
        }
        queries.push(
          supabase.from('qa_feed').select('*')
            .not('user_id', 'eq', myId ?? '')
            .order('created_at', { ascending: false }).limit(60)
        )
        const results = await Promise.all(queries)
        const myPosts    = myId ? (results[0].data ?? []).map(mapRow) : []
        const otherPosts = (results[myId ? 1 : 0].data ?? []).map(mapRow)
        setPosts([...myPosts, ...otherPosts])
      } else {
        // Profile mode: filter to target user only
        let q = supabase.from('qa_feed').select('*').order('created_at', { ascending: false }).limit(30)
        if (targetUserId) q = q.eq('user_id', targetUserId)
        const { data, error } = await q
        if (error) throw error
        const mapped = (data ?? []).map(mapRow)
        if (targetUserId && mapped.length === 0) {
          setPosts(SEED_POSTS.map(p => ({
            ...p, userId: targetUserId,
            displayName: viewerSession?.displayName ?? p.displayName,
            photoURL:    viewerSession?.photoURL ?? p.photoURL,
          })))
        } else {
          setPosts(mapped)
        }
      }
    } catch {
      setPosts(isLiveMode ? SEED_POSTS : SEED_POSTS.map(p => ({
        ...p, userId: targetUserId ?? p.userId,
        displayName: viewerSession?.displayName ?? p.displayName,
        photoURL:    viewerSession?.photoURL ?? p.photoURL,
      })))
    }
    setLoading(false)
  }

  // ── Search filter + flash expiry ────────────────────────────────────────────
  const now = Date.now()
  const livePosts = posts.filter(p => !p.isFlash || !p.flashExpiresAt || p.flashExpiresAt > now)

  const q = searchQuery.trim().toLowerCase()
  const matchedPostIds = q
    ? new Set(livePosts.filter(p => p.text.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q)).map(p => p.id))
    : null

  const otherFiltered = matchedPostIds
    ? livePosts.filter(p => matchedPostIds.has(p.id))
    : livePosts

  // ── Auto-clear search when user swipes past all results ─────────────────────
  useEffect(() => {
    if (!searchQuery || items.length === 0) return
    if (activeIdx >= items.length - 1) {
      const t = setTimeout(() => setSearchQuery(''), 1400)
      return () => clearTimeout(t)
    }
  }, [activeIdx, searchQuery]) // eslint-disable-line

  const items = []
  if (isLiveMode) {
    const userPostCounts = {}
    posts.forEach(p => { userPostCounts[p.userId] = (userPostCounts[p.userId] ?? 0) + 1 })

    // ── Viewer's own section (always first) ──
    const viewerCategory = viewerProfile?.category ?? 'dating'
    const viewerMeta = {
      userId:      myId ?? 'me',
      displayName: myName,
      photoURL:    myPhoto,
      age:         viewerProfile?.age ?? null,
      city:        viewerProfile?.city ?? null,
      area:        viewerProfile?.area ?? null,
    }
    items.push({
      type: 'profile', key: 'profile-me',
      profile: viewerMeta,
      postCount: userPostCounts[myId] ?? 0,
      category: viewerCategory,
      bio: viewerProfile?.bio ?? null,
      isOwn: true,
    })
    otherFiltered
      .filter(p => p.userId === myId)
      .forEach(post => items.push({ type: 'post', key: post.id, post }))

    // ── Other profiles ──
    const introduced = new Set([myId ?? 'me'])
    let lastUserId = myId

    otherFiltered
      .filter(p => p.userId !== myId)
      .forEach(post => {
        if (post.userId !== lastUserId && !introduced.has(post.userId)) {
          introduced.add(post.userId)
          items.push({
            type: 'profile',
            key: `profile-${post.userId}`,
            profile: { userId: post.userId, displayName: post.displayName, photoURL: post.photoURL, age: post.age, city: post.city, area: post.area },
            postCount: userPostCounts[post.userId] ?? 0,
            category: post.category ?? 'dating',
            bio: post.bio ?? null,
            isOwn: false,
          })
          lastUserId = post.userId
        } else {
          lastUserId = post.userId
        }
        items.push({ type: 'post', key: post.id, post })
      })
  } else {
    otherFiltered.forEach(post => items.push({ type: 'post', key: post.id, post }))
  }

  async function handleSend() {
    const text = inputText.trim()
    if (!text && !selectedSticker) return
    setSending(true)
    const flashExpiresAt = flashMode ? Date.now() + 60 * 60 * 1000 : null
    const newPost = {
      id: `local-${Date.now()}`, userId: myId ?? `anon-${Date.now()}`,
      displayName: myName, photoURL: myPhoto,
      text: text || `${selectedSticker.emoji} ${selectedSticker.label}`,
      stickerEmoji: selectedSticker?.emoji ?? null,
      isFlash: flashMode, flashExpiresAt,
      likes: 0, dislikes: 0, hereCount: 0, createdAt: Date.now(),
    }
    setPosts(prev => [newPost, ...prev])
    setInputText('')
    setSelectedSticker(null)
    setStickerOpen(false)
    setAskOpen(false)
    setFlashMode(false)
    setTimeout(() => feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 60)
    try {
      if (supabase && myId && !myId.startsWith('anon')) {
        await supabase.from('qa_feed').insert({
          user_id: myId, display_name: myName, photo_url: myPhoto,
          text: newPost.text, sticker_emoji: newPost.stickerEmoji ?? null,
          is_flash: flashMode,
          flash_expires_at: flashExpiresAt ? new Date(flashExpiresAt).toISOString() : null,
        })
      }
    } catch { /* silent */ }
    setSending(false)
  }

  function handleHere(postId) {
    const isActive = hereIds.has(postId)
    setHereIds(prev => {
      const next = new Set(prev)
      isActive ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, hereCount: Math.max(0, p.hereCount + (isActive ? -1 : 1)) } : p
    ))
    try {
      if (supabase && myId) {
        if (isActive) {
          supabase.from('qa_reactions').delete().match({ post_id: postId, user_id: myId, type: 'here' }).then(() => {})
        } else {
          supabase.from('qa_reactions').upsert({ post_id: postId, user_id: myId, type: 'here' }).then(() => {})
        }
      }
    } catch { /* silent */ }
  }

  function handleLike(postId) {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(postId)) { next.delete(postId) }
      else { next.add(postId); setDislikedIds(d => { const nd = new Set(d); nd.delete(postId); return nd }) }
      return next
    })
  }

  function handleDislike(postId) {
    setDislikedIds(prev => {
      const next = new Set(prev)
      if (next.has(postId)) { next.delete(postId) }
      else { next.add(postId); setLikedIds(l => { const nl = new Set(l); nl.delete(postId); return nl }) }
      return next
    })
  }

  async function handleFlag(flaggedUserId, postId) {
    setFlaggedIds(prev => new Set([...prev, flaggedUserId]))
    try {
      if (supabase && user?.id) {
        await supabase.from('flagged_reports').insert({
          reporter_id: user.id ?? user.uid, reported_id: flaggedUserId, post_id: postId, context: 'qa_feed',
        })
        await supabase.from('profile_blocks').upsert({
          blocker_id: user.id ?? user.uid, blocked_id: flaggedUserId, reason: 'flagged_qa',
        })
      }
    } catch { /* silent */ }
  }

  // ── Corner panel helpers ────────────────────────────────────────────────────
  function scrollToSlide(idx) {
    const el = feedRef.current?.querySelector(`[data-slide="${idx}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setCornerPanel(null)
  }

  const shopSellers = (() => {
    const seen = new Set()
    return posts.filter(p => p.category === 'marketplace' && !seen.has(p.userId) && seen.add(p.userId))
  })()

  const galleryPhotos = posts.filter(p => p.photoURL)

  const peopleProfiles = (() => {
    const seen = new Set()
    return posts.filter(p => !seen.has(p.userId) && seen.add(p.userId))
  })()

  const hotPosts = [...posts]
    .sort((a, b) => (b.likes + b.hereCount * 2) - (a.likes + a.hereCount * 2))
    .slice(0, 15)

  if (!open) return null

  const isEmpty = !loading && items.length === 0
  const postItems = items.filter(i => i.type === 'post')

  return createPortal(
    <div className={`${styles.screen} ${isLiveMode ? styles.screenLive : ''}`}>

      {/* Background — profile photo in profile mode, clear */}
      {!isLiveMode && viewerSession?.photoURL && (
        <img src={viewerSession.photoURL} alt="" className={styles.screenBg} />
      )}
      <div className={styles.screenBgOverlay} />

      {/* ── Header ── */}
      <div className={styles.header}>
        {isLiveMode ? (
          /* Live mode — shopping bag icon, gray; opens marketplace overlay */
          <button
            className={`${styles.backBtn} ${styles.backBtnMarket} ${liveMarketOpen ? styles.backBtnMarketActive : ''}`}
            onClick={() => setLiveMarketOpen(p => !p)}
            aria-label="Marketplace"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </button>
        ) : (
          /* Profile mode — close arrow */
          <button className={styles.backBtn} onClick={onClose} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        )}
        <div className={styles.headerMid}>
          {isLiveMode ? (
            <div className={styles.headerProfile}>
              <span className={styles.headerName}>Indoo Live</span>
              <span className={styles.headerAge}>Community feed</span>
            </div>
          ) : viewerSession ? (
            <div className={styles.headerProfile}>
              <span className={styles.headerName}>{viewerSession.displayName ?? 'Q&A'}</span>
              {viewerSession.age && <span className={styles.headerAge}>{viewerSession.age} years old</span>}
              {(viewerSession.city ?? viewerSession.area ?? viewerSession.country) && (
                <span className={styles.headerLocation}>📍 {viewerSession.city ?? viewerSession.area ?? viewerSession.country}</span>
              )}
            </div>
          ) : (
            <span className={styles.headerTitle}>Q&amp;A</span>
          )}
          <div className={styles.headerStatus}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>{onlineCount ? `${onlineCount} online` : 'Online'}</span>
          </div>
        </div>
        <button
          className={`${styles.backBtn} ${cornerPanel ? styles.headerBtnActive : ''}`}
          onClick={() => isLiveMode ? setCornerPanel(p => p ? null : 'people') : undefined}
          aria-label="Explore"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
      </div>

      {/* ── Search bar — live mode only ── */}
      {isLiveMode && (
        <div className={styles.searchBar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts or people…"
              maxLength={80}
            />
            {searchQuery && (
              <button className={styles.searchClearBtn} onClick={() => setSearchQuery('')} aria-label="Clear search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <span className={styles.searchCount}>
              {items.filter(i => i.type === 'post').length} result{items.filter(i => i.type === 'post').length !== 1 ? 's' : ''}
            </span>
          )}
          <button className={styles.searchHomeBtn} onClick={onClose} aria-label="Go to home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Ticker — shown when empty ── */}
      {isEmpty && <Ticker />}

      {/* ── Feed ── */}
      <div className={styles.feed} ref={feedRef}>
        {loading && (
          <div className={styles.loadingSlide}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} style={{ animationDelay: '0.2s' }} />
            <div className={styles.loadingDot} style={{ animationDelay: '0.4s' }} />
          </div>
        )}

        {isEmpty && (
          <div className={styles.emptySlide}>
            <span className={styles.emptyEmoji}>💬</span>
            <p className={styles.emptyTitle}>Be the first to ask!</p>
            <p className={styles.emptySub}>Ask about food spots, local tips, or anything on your mind.</p>
          </div>
        )}

        {items.map((item, i) => (
          <div key={item.key} data-slide={i} className={styles.slideWrapper}>
            {item.type === 'profile' ? (
              <ProfileIntroSlide
                profile={item.profile}
                postCount={item.postCount}
                category={item.category}
                isOwn={item.isOwn ?? false}
                bio={item.bio ?? null}
                onChat={() => onConnect?.(item.profile)}
                onShare={() => setShareTarget(item.profile)}
              />
            ) : (
              <PostSlide
                post={item.post}
                index={i}
                myUserId={myId}
                onLike={handleLike}
                onDislike={handleDislike}
                onFlag={handleFlag}
                onHere={handleHere}
                flaggedIds={flaggedIds}
                likedIds={likedIds}
                dislikedIds={dislikedIds}
                hereIds={hereIds}
                viewerCount={viewerMap[item.post.id] ?? null}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Food ordering button — live mode only ── */}
      {isLiveMode && (
        <div className={styles.liveSidePanel}>
          <button className={styles.liveSidePanelBtn} onClick={() => setLiveFoodOpen(true)} aria-label="Order food">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            <span className={styles.liveSidePanelLabel}>Food</span>
          </button>
        </div>
      )}

      {/* ── Food overlays — render on top of live feed, no navigation away ── */}
      {liveFoodOpen && !liveFoodBrowseOpen && (
        <CategoryDiscoveryScreen
          onClose={() => setLiveFoodOpen(false)}
          onSelectCategory={(cat, restaurantId) => {
            setLiveFoodCategory(cat)
            setLiveFoodScrollToId(restaurantId ?? null)
            setLiveFoodBrowseOpen(true)
          }}
        />
      )}
      {liveFoodOpen && liveFoodBrowseOpen && (
        <RestaurantBrowseScreen
          category={liveFoodCategory}
          scrollToId={liveFoodScrollToId}
          onBackToCategories={() => setLiveFoodBrowseOpen(false)}
          onClose={() => { setLiveFoodBrowseOpen(false); setLiveFoodOpen(false) }}
          onOrderViaChat={onOrderViaChat ?? null}
        />
      )}

      {/* ── Live Marketplace Feed overlay ── */}
      {liveMarketOpen && !liveMarketProduct && (
        <LiveMarketplaceFeed
          onClose={() => setLiveMarketOpen(false)}
          onSelectProduct={p => setLiveMarketProduct(p)}
        />
      )}

      {/* ── Product detail — opened from marketplace feed ── */}
      {liveMarketProduct && (
        <ProductDetailSheet
          product={liveMarketProduct}
          onClose={() => setLiveMarketProduct(null)}
          sellerId={liveMarketProduct.user_id ?? null}
          sellerName={liveMarketProduct.sellerName ?? null}
          onOrderViaChat={onOrderViaChat ?? null}
        />
      )}

      {/* Profile mode: Ask toggle corner button (live mode handles this in the footer) */}
      {!isLiveMode && (
        <button
          className={`${styles.cornerBtn} ${styles.cornerBtnBL} ${askOpen ? styles.cornerBtnActive : ''}`}
          onClick={() => setAskOpen(p => !p)}
          aria-label="Ask a question"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      )}

      {/* ── Corner panel overlay ── */}
      {isLiveMode && (
        <QAFeedCornerPanel
          cornerPanel={cornerPanel}
          setCornerPanel={setCornerPanel}
          shopSellers={shopSellers}
          galleryPhotos={galleryPhotos}
          peopleProfiles={peopleProfiles}
          hotPosts={hotPosts}
          items={items}
          scrollToSlide={scrollToSlide}
          setCornerSeller={setCornerSeller}
        />
      )}

      {/* ── Seller profile sheet — opened from Shop corner panel ── */}
      {cornerSeller && (
        <SellerProfileSheet
          seller={cornerSeller}
          onClose={() => setCornerSeller(null)}
          onOpenChat={() => { setCornerSeller(null); onConnect?.({ userId: cornerSeller.id, displayName: cornerSeller.displayName, photoURL: cornerSeller.photoURL }) }}
          onOrderViaChat={onOrderViaChat ?? null}
        />
      )}

      {/* ── Dot indicators — post slides only ── */}
      {postItems.length > 1 && postItems.length <= 10 && (
        <div className={styles.dots}>
          {postItems.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ''}`} />
          ))}
        </div>
      )}

      {/* ── Footer input — always visible in live mode, toggled in profile mode ── */}
      <QAFeedInputBar
        ref={inputRef}
        isLiveMode={isLiveMode}
        askOpen={askOpen}
        inputText={inputText}
        setInputText={setInputText}
        sending={sending}
        handleSend={handleSend}
        stickerOpen={stickerOpen}
        setStickerOpen={setStickerOpen}
        selectedSticker={selectedSticker}
        setSelectedSticker={setSelectedSticker}
        flashMode={flashMode}
        setFlashMode={setFlashMode}
        setAskOpen={setAskOpen}
        myPhoto={myPhoto}
        myName={myName}
      />

      {/* Share sheet — portals itself to body, safe to render here */}
      {shareTarget && <ShareSheet profile={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>,
    document.body
  )
}
