import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import IndooChat from '@/components/chat/IndooChat'
import styles from './RestaurantMenuSheet.module.css'
import WeeklyPromoSheet from './WeeklyPromoSheet'
import WhatsAppInput from '@/components/ui/WhatsAppInput'
import PaymentCard from './PaymentCard'
import FoodOrderStatus from '@/components/orders/FoodOrderStatus'
import { createFoodOrder, searchFoodDrivers } from '@/services/foodOrderService'
import { FOOD_CATEGORIES_FULL } from '@/constants/foodCategories'
import { fmtRp, getFoodOrders, saveFoodOrders } from './menuSheetConstants'
import MenuItemCard from './MenuItemCard'
import { FREE_ITEM_BADGES } from '@/constants/restaurantPromos'
import { DISH_TAGS } from '@/constants/foodCustomizations'
import { STAGE1_IMAGES, STAGE2_IMAGES, STAGE3_IMAGES, FALLBACK_IMG, DEMO_INTERVAL_MS, getStageImages, preloadCinematicImages } from '@/constants/deliveryCinematic'
import DeliveryMap from './DeliveryMap'
import FoodDashboard from './FoodDashboard'
import DailyDealOverlay from './DailyDealOverlay'
import { getTodayDealForRestaurant, hasAnyDailyDeals } from '@/services/dailyDealService'
import { getLocalDefaultAddress } from '@/services/addressService'
import { estimateFare, fetchPricingZones, fetchGlobalSettings } from '@/services/pricingService'
import { haversineKm } from '@/utils/distance'
import { calculateDeliveryETA, formatETA } from '@/services/etaService'
import { getAvailableTimeSlots } from '@/services/preBookingService'
import { validatePromoCode, applyPromoCode } from '@/services/promoCodeService'
import { addToMultiCart, getMultiCartCount, getRestaurantCount } from '@/services/multiCartService'
import LiveChatSheet from './LiveChatSheet'
import PromoBannerPage from './PromoBannerPage'
import RatingPopup from '@/components/ui/RatingPopup'

// Auto-detect tags from item name/description/category
const SPICY_WORDS = ['pedas','sambal','geprek','balado','rica','cabai','chili','hot','spicy','cabe']
const GARLIC_WORDS = ['bawang','garlic','aglio']
const VEGGIE_WORDS = ['vegetarian','vegan','sayur','salad','gado','pecel','karedok','tahu','tempe']
const SEAFOOD_WORDS = ['ikan','udang','kepiting','cumi','seafood','fish','shrimp','crab','squid','gurame']
const NUT_WORDS = ['kacang','nut','almond','peanut']

function getAutoTags(item) {
  const text = `${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase()
  const tags = []
  if (SPICY_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'spicy'))
  if (GARLIC_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'garlic'))
  if (VEGGIE_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'vegetarian'))
  if (SEAFOOD_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'seafood_allergen'))
  if (NUT_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'nuts'))
  // Manual tags from item.tags field if vendor sets them
  if (item.tags) {
    item.tags.forEach(tagId => {
      const t = DISH_TAGS.find(dt => dt.id === tagId)
      if (t && !tags.find(x => x?.id === t.id)) tags.push(t)
    })
  }
  return tags.filter(Boolean)
}
import OrderConfirmOverlay from './OrderConfirmOverlay'
import OrdersPanel from './OrdersPanel'
import CategoryDrawer from './CategoryDrawer'
import EventsDrawer from './EventsDrawer'
import SocialsDrawer from './SocialsDrawer'
import ReviewModal from './ReviewModal'
import CustomizeSheet from './CustomizeSheet'

// ── Delivery Chat — in-app messaging with driver during delivery ─────────────
function DeliveryChat({ driverName, chatKey, initialMessages, onClose }) {
  const MOCK_MESSAGES = []
  const [messages, setMessages] = useState(initialMessages.length > 0 ? initialMessages : MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  // Poll localStorage for new messages posted by journey auto-updates
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(chatKey) || '[]')
        if (stored.length > messages.length) setMessages(stored)
      } catch {}
    }, 1500)
    return () => clearInterval(id)
  }, [chatKey, messages.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const sendMessage = () => {
    if (!input.trim()) return
    const msg = { id: Date.now(), from: 'customer', text: input.trim(), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
    const updated = [...messages, msg]
    setMessages(updated)
    localStorage.setItem(chatKey, JSON.stringify(updated))
    setInput('')
    // Demo driver auto-reply
    setTimeout(() => {
      const replies = ['Siap, kak!', 'Oke, sedang menuju lokasi', 'Baik kak, sebentar lagi sampai', 'Sudah di depan, kak']
      const reply = { id: Date.now() + 1, from: 'driver', text: replies[Math.floor(Date.now() / 1000) % replies.length], time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
      const withReply = [...updated, reply]
      setMessages(withReply)
      localStorage.setItem(chatKey, JSON.stringify(withReply))
    }, 1500)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10010, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        {/* Driver profile image */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #8DC63F', overflow: 'hidden', flexShrink: 0 }}>
          <img src={`https://i.pravatar.cc/100?img=${(driverName ?? 'D').charCodeAt(0) % 50 + 1}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{driverName}</span>
          <span style={{ fontSize: 14, color: '#8DC63F' }}>Driver · Online</span>
        </div>
        {/* Close button — right side */}
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Close</button>
      </div>

      {/* Monitored notice */}
      <div style={{ background: 'rgba(141,198,63,0.06)', borderBottom: '1px solid rgba(141,198,63,0.1)', padding: '7px 16px', flexShrink: 0, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.5)' }}>🔒 Secured and monitored by INDOO Operations</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.4 }}>
            <span style={{ fontSize: 14, color: '#fff' }}>Dispatch channel loading...</span>
          </div>
        )}
        {messages.map(msg => {
          const isCustomer = msg.from === 'customer'
          const isSystem = msg.from === 'system' || msg.from === 'indoo'
          const isDriver = msg.from === 'driver'
          const INDOO_LOGO = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2012_04_23%20PM.png'

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
              {/* Avatar — driver or INDOO logo */}
              {isDriver && (
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #991B1B' }}>
                  <img src={`https://i.pravatar.cc/60?img=${(driverName ?? 'D').charCodeAt(0) % 50 + 1}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {isSystem && (
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(141,198,63,0.4)', background: '#111' }}>
                  <img src={INDOO_LOGO} alt="INDOO" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {/* Bubble */}
              <div style={{
                maxWidth: '75%', padding: (msg.image || msg.imageLeft || msg.imageRight) ? '4px 4px 8px' : '10px 14px', borderRadius: 16,
                background: isCustomer ? '#8DC63F' : isSystem ? 'rgba(141,198,63,0.08)' : 'rgba(0,0,0,0.55)',
                border: isSystem ? '1px solid rgba(141,198,63,0.15)' : isDriver ? '1px solid rgba(153,27,27,0.25)' : 'none',
                borderBottomRightRadius: isCustomer ? 4 : 16,
                borderBottomLeftRadius: isCustomer ? 16 : 4,
              }}>
                {isSystem && <span style={{ fontSize: 10, fontWeight: 900, color: '#8DC63F', display: 'block', marginBottom: 4, letterSpacing: '0.05em', padding: (msg.image || msg.imageLeft || msg.imageRight) ? '6px 10px 0' : 0 }}>INDOO HQ</span>}
                {isDriver && <span style={{ fontSize: 10, fontWeight: 900, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, letterSpacing: '0.05em' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsddaa-removebg-preview.png?updatedAt=1776781020066" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> {msg.callsign ?? 'DRIVER'}</span>}
                {msg.image && (
                  <img src={msg.image} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 6 }} />
                )}
                {(msg.imageLeft || msg.imageRight) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
                    {msg.imageLeft && <img src={msg.imageLeft} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, color: '#fff', flex: 1, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{msg.text}</span>
                    {msg.imageRight && <img src={msg.imageRight} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />}
                  </div>
                ) : !msg.image && (
                  <span style={{ fontSize: 14, color: isCustomer ? '#000' : '#fff', display: 'block', lineHeight: 1.4, whiteSpace: 'pre-line', padding: msg.image ? '0 10px' : 0 }}>{msg.text}</span>
                )}
                <span style={{ fontSize: 10, color: isCustomer ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4, textAlign: 'right', padding: (msg.image || msg.imageLeft || msg.imageRight) ? '0 10px' : 0 }}>{msg.time}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} style={{
          width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantMenuSheet({ restaurant, onClose, onOrderViaChat, initialCart, startTracking, activeDeal }) {
  const items      = restaurant.menu_items ?? []
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const [cart,           setCart]           = useState(() => {
    // Use initialCart if provided (from cart page checkout)
    if (initialCart?.length > 0) return initialCart
    // Pre-populate demo cart for preview
    const demoItems = (restaurant.menu_items ?? []).filter(i => i.photo_url).slice(0, 3)
    return demoItems.length ? demoItems.map((item, i) => ({ ...item, qty: i === 0 ? 2 : 1 })) : []
  })
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartExpanded,   setCartExpanded]   = useState(!!initialCart?.length)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [eventsOpen,     setEventsOpen]     = useState(false)
  const [socialsOpen,    setSocialsOpen]    = useState(false)

  // Close all side drawers — ensures only one is open at a time
  const closeAllDrawers = () => { setDrawerOpen(false); setEventsOpen(false); setSocialsOpen(false); setPromosOpen(false); setOrdersOpen(false); setDashboardOpen(false); setDailyDealOpen(false); setCuisineDrawerOpen(false); setChatOpen(false); setPromoBannerOpen2(false) }
  const [address,        setAddress]        = useState(() => getLocalDefaultAddress())
  const [showAddrInput,  setShowAddrInput]  = useState(false)
  const [editingNoteId,  setEditingNoteId]  = useState(null)
  const [promosOpen,     setPromosOpen]     = useState(false)
  const [locating,       setLocating]       = useState(false)
  const [customerCoords, setCustomerCoords] = useState(null) // { lat, lng }
  const [calculatedFare, setCalculatedFare] = useState(null) // delivery fare from admin pricing
  const [paymentData,    setPaymentData]    = useState(null)  // { total, orderRef }
  const [ordersOpen,     setOrdersOpen]     = useState(false)
  const [foodOrders,     setFoodOrders]     = useState([])
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [orderConfirm,   setOrderConfirm]   = useState(null)   // { id, total, estimatedMin }
  const [reviewOrder,    setReviewOrder]    = useState(null)    // order to review
  const [reviewStars,    setReviewStars]    = useState(0)
  const [reviewComment,  setReviewComment]  = useState('')
  const [toast,          setToast]          = useState(null)
  const [orderType,      setOrderType]      = useState('delivery')
  const [paymentMethod,  setPaymentMethod]  = useState('cod') // COD only
  const [customerWa,     setCustomerWa]     = useState('') // customer WhatsApp for driver
  const [paymentStep,    setPaymentStep]    = useState(false)   // show payment step on confirmation
  const [paymentProofFile, setPaymentProofFile] = useState(null)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [driverSearching, setDriverSearching] = useState(false)
  const [assignedDriver,  setAssignedDriver]  = useState(null)
  const [trackingOrder,   setTrackingOrder]   = useState(null)
  const [customizeItem,   setCustomizeItem]   = useState(null)
  const [mapFullView,     setMapFullView]     = useState(false) // toggle: cinematic (false) vs map (true)
  const [dashboardOpen,   setDashboardOpen]   = useState(false)
  const [cuisineDrawerOpen, setCuisineDrawerOpen] = useState(false)
  const [dailyDealOpen,   setDailyDealOpen]   = useState(false)
  const [todayDeal,       setTodayDeal]       = useState(null) // { day, items, active }
  const [hasDailyDeals,   setHasDailyDeals]   = useState(false)

  // ── Delivery ETA from etaService ──
  const [realDeliveryEta, setRealDeliveryEta] = useState(null) // { totalMinutes, etaText, ... }

  // ── New features state ──
  const [allergenFilter, setAllergenFilter] = useState([]) // active allergen filter IDs
  const [scheduleMode,   setScheduleMode]   = useState(false) // scheduled delivery toggle
  const [scheduleSlot,   setScheduleSlot]   = useState(null) // selected time slot ISO
  const [promoCode,      setPromoCode]      = useState('')
  const [promoResult,    setPromoResult]    = useState(null) // { valid, discountAmount, ... }
  const [chatOpen,       setChatOpen]       = useState(false) // live chat sheet
  const [deliveryChatOpen, setDeliveryChatOpen] = useState(false) // driver chat during delivery
  const [promoBannerOpen, setPromoBannerOpen2] = useState(false) // promo banner page
  const [multiCartCount, setMultiCartCount] = useState(0) // items in other restaurant carts

  const feedRef     = useRef(null)
  const itemRefs    = useRef([])
  const collapseRef = useRef(null)

  // ── Cart persistence — restore on mount, save on change, auto-clear 24 h ──
  const CART_KEY = `makan_cart_${restaurant.id}`
  const CART_TTL = 24 * 60 * 60 * 1000
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY))
      if (saved && Date.now() - saved.ts < CART_TTL) setCart(saved.cart)
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load daily deal status for this restaurant
  useEffect(() => {
    getTodayDealForRestaurant(restaurant.id).then(d => setTodayDeal(d))
    hasAnyDailyDeals(restaurant.id).then(h => setHasDailyDeals(h))
  }, [restaurant.id])
  useEffect(() => {
    if (cart.length > 0) localStorage.setItem(CART_KEY, JSON.stringify({ cart, ts: Date.now() }))
    else localStorage.removeItem(CART_KEY)
  }, [cart]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load food orders on mount (seeds demo if empty)
  useEffect(() => { setFoodOrders(getFoodOrders()); setMultiCartCount(getMultiCartCount()) }, [])

  // ── Auto-add deal item to cart when activeDeal is provided ──
  const [dealDiscount, setDealDiscount] = useState(null) // { itemName, discountPercent, originalPrice, dealPrice, discountAmount }
  useEffect(() => {
    if (!activeDeal) return
    const { itemName, discountPercent, originalPrice, dealPrice } = activeDeal
    // Find the matching menu item
    const menuItem = items.find(i => i.name === itemName)
    if (menuItem) {
      const discountedPrice = dealPrice ?? Math.round(menuItem.price * (1 - discountPercent / 100))
      const discountAmount = (menuItem.price ?? originalPrice) - discountedPrice
      // Add to cart with discounted price
      setCart(prev => {
        const exists = prev.find(c => c.id === menuItem.id)
        if (exists) return prev
        return [{ ...menuItem, price: discountedPrice, original_price: menuItem.price, qty: 1, _isDeal: true }, ...prev.filter(c => c.id !== menuItem.id)]
      })
      setDealDiscount({ itemName, discountPercent, originalPrice: menuItem.price, dealPrice: discountedPrice, discountAmount })
      setCartExpanded(true)
      setToast(`Deal applied: ${discountPercent}% OFF ${itemName}`)
    } else {
      // Item not found in menu — still show the deal info
      setDealDiscount({ itemName, discountPercent, originalPrice, dealPrice, discountAmount: (originalPrice ?? 0) - (dealPrice ?? 0) })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Calculate real delivery ETA when driver assigned + coords available ──
  useEffect(() => {
    if (!customerCoords || !restaurant.lat || orderType !== 'delivery') {
      setRealDeliveryEta(null)
      return
    }
    let cancelled = false
    // Use assigned driver coords if available, otherwise estimate from restaurant
    const driverLat = assignedDriver?.lat ?? restaurant.lat
    const driverLng = assignedDriver?.lng ?? restaurant.lng
    calculateDeliveryETA(
      restaurant.lat, restaurant.lng,
      customerCoords.lat, customerCoords.lng,
      driverLat, driverLng,
    ).then(result => {
      if (!cancelled) setRealDeliveryEta(result)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [customerCoords?.lat, customerCoords?.lng, restaurant.lat, restaurant.lng, assignedDriver, orderType])

  // ── Dish badges from localStorage ──
  const [dishBadges, setDishBadges] = useState([])
  useEffect(() => {
    try {
      const sellerId = restaurant.user_id ?? restaurant.id
      const saved = JSON.parse(localStorage.getItem(`indoo_dish_badges_${sellerId}`) || '[]')
      setDishBadges(saved)
    } catch {}
  }, [restaurant])

  // ── Daily specials from localStorage ──
  const [todaySpecial, setTodaySpecial] = useState(null)
  useEffect(() => {
    try {
      const sellerId = restaurant.user_id ?? restaurant.id
      const saved = JSON.parse(localStorage.getItem(`indoo_daily_specials_${sellerId}`) || '[]')
      const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
      const special = saved.find(s => s.day === today && s.enabled && s.dishName)
      setTodaySpecial(special)
    } catch {}
  }, [restaurant])

  // Allergen filter IDs: 'spicy','nuts','seafood_allergen','vegetarian','halal','egg','garlic'
  const ALLERGEN_FILTERS = [
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
    { id: 'halal', label: 'Halal', emoji: '☪️' },
    { id: 'no_spicy', label: 'No Spicy', emoji: '🌶️', exclude: true },
    { id: 'no_nuts', label: 'No Nuts', emoji: '🥜', exclude: true },
    { id: 'no_seafood', label: 'No Seafood', emoji: '🦐', exclude: true },
    { id: 'no_egg', label: 'No Egg', emoji: '🥚', exclude: true },
    { id: 'no_garlic', label: 'No Garlic', emoji: '🧄', exclude: true },
  ]

  // Filter items by active category — only show items with owner-uploaded photos
  // Sort by popularity: featured/first items shown first (hero dish at top)
  const visibleItems = (activeCategory
    ? items.filter(i => i.category === activeCategory && i.photo_url)
    : items.filter(i => i.photo_url)
  ).filter(item => {
    if (allergenFilter.length === 0) return true
    const tags = getAutoTags(item)
    const tagIds = tags.map(t => t?.id)
    for (const filterId of allergenFilter) {
      const filterDef = ALLERGEN_FILTERS.find(f => f.id === filterId)
      if (!filterDef) continue
      if (filterDef.exclude) {
        // Exclude items that HAVE this tag
        const tagToExclude = filterId.replace('no_', '') // no_spicy → spicy
        const fullId = tagToExclude === 'seafood' ? 'seafood_allergen' : tagToExclude
        if (tagIds.includes(fullId)) return false
      } else {
        // Include only items that HAVE this tag
        if (!tagIds.includes(filterId)) return false
      }
    }
    return true
  }).sort((a, b) => {
    // Deal item always first when activeDeal is set
    if (dealDiscount && a.name === dealDiscount.itemName) return -1
    if (dealDiscount && b.name === dealDiscount.itemName) return 1
    // Hero dish (matches restaurant hero_dish_name) always first
    if (a.name === restaurant.hero_dish_name) return -1
    if (b.name === restaurant.hero_dish_name) return 1
    // Then by price descending (premium items = popular)
    return (b.price ?? 0) - (a.price ?? 0)
  }).map(item => {
    // Apply deal pricing to matching item in feed
    if (dealDiscount && item.name === dealDiscount.itemName) {
      return { ...item, original_price: dealDiscount.originalPrice, price: dealDiscount.dealPrice }
    }
    return item
  })

  // ── Cart helpers ──
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex
        ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { ...item, qty: 1 }]
    })
    // Sync to multi-cart service
    addToMultiCart(restaurant, item)
    setMultiCartCount(getMultiCartCount())
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id)
      return ex?.qty <= 1
        ? prev.filter(c => c.id !== id)
        : prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const updateNote = (id, note) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c))
  }

  const cartCount   = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFare = orderType === 'delivery' ? (calculatedFare ?? null) : 0
  const grandTotal  = cartTotal + (deliveryFare ?? 0)
  const maxPrepMin  = cart.length > 0
    ? Math.max(...cart.map(i => i.prep_time_min ?? 0))
    : 0
  const avgPrepTime = cart.length > 0
    ? Math.round(cart.reduce((sum, item) => sum + (item.prep_time_min ?? 15), 0) / cart.length)
    : 15
  const fallbackDeliveryMinutes = orderType === 'delivery' && customerCoords && restaurant.lat
    ? Math.round(haversineKm(restaurant.lat, restaurant.lng, customerCoords.lat, customerCoords.lng) * 1.3 * 3)
    : 0
  const deliveryMinutes = realDeliveryEta ? realDeliveryEta.totalMinutes : fallbackDeliveryMinutes
  const eta = avgPrepTime + deliveryMinutes
  const qtyFor = (id) => cart.find(c => c.id === id)?.qty ?? 0

  // ── Jump to category in feed ──
  const jumpToCategory = useCallback((cat) => {
    setActiveCategory(cat)
    setDrawerOpen(false)
    // Small delay so filtered items render before scroll
    setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = 0
    }, 60)
  }, [])

  // ── Calculate delivery fare from admin pricing ──
  const calculateDeliveryFare = async (custLat, custLng) => {
    if (!restaurant.lat || !restaurant.lng || !custLat || !custLng) return
    const distKm = haversineKm(restaurant.lat, restaurant.lng, custLat, custLng)
    try {
      const [zones, settings] = await Promise.all([fetchPricingZones(), fetchGlobalSettings()])
      const fare = estimateFare('bike_ride', restaurant.city ?? '', distKm * 1.3, zones, settings)
      setCalculatedFare(fare)
    } catch {
      // Fallback: cannot calculate without admin zones
      setCalculatedFare(null)
    }
  }

  // ── GPS location → address ──
  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setCustomerCoords({ lat: coords.latitude, lng: coords.longitude })
        calculateDeliveryFare(coords.latitude, coords.longitude)
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          )
          const data = await res.json()
          setAddress(data.display_name ?? `${coords.latitude}, ${coords.longitude}`)
        } catch {
          setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  // ── Cancel a pending order ──
  const handleCancelOrder = (orderId) => {
    const orders = getFoodOrders().map(o =>
      o.id === orderId && (o.status === 'pending' || o.status === 'awaiting_payment')
        ? { ...o, status: 'cancelled' }
        : o
    )
    saveFoodOrders(orders)
    setFoodOrders(orders)
    setToast('Order cancelled')
  }

  // ── Submit review for delivered order ──
  const handleSubmitReview = () => {
    if (!reviewStars || !reviewOrder) return
    const reviews = JSON.parse(localStorage.getItem('indoo_food_reviews') || '[]')
    reviews.push({
      order_id: reviewOrder.id,
      restaurant: reviewOrder.restaurant,
      stars: reviewStars,
      comment: reviewComment.trim() || null,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem('indoo_food_reviews', JSON.stringify(reviews))
    setReviewOrder(null)
    setReviewStars(0)
    setReviewComment('')
    setToast('Thank you for your review!')
  }

  // ── Payment proof upload + driver assignment ──
  const handlePaymentProofUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) setPaymentProofFile(file)
  }

  const handleSubmitPayment = async () => {
    if (!orderConfirm) return
    setPaymentSubmitted(true)

    // Update order status in localStorage
    const orders = getFoodOrders()
    const updatedOrders = orders.map(o =>
      o.id === orderConfirm.id ? { ...o, status: o.payment_method === 'cod' ? 'cod_pending' : 'payment_submitted', payment_method: o.payment_method || 'transfer' } : o
    )
    saveFoodOrders(updatedOrders)
    setFoodOrders(updatedOrders)

    // Search for driver and assign
    setDriverSearching(true)
    try {
      const drivers = await searchFoodDrivers(restaurant.lat, restaurant.lng)
      let driver = drivers?.[0] ?? null

      // Demo fallback — always provide a driver
      if (!driver) {
        driver = { id: 'driver-demo', display_name: 'Pak Andi', phone: '081234567890', vehicle_model: 'Honda Beat' }
      }

      setAssignedDriver(driver)

      // Build order data for createFoodOrder
      const currentOrder = updatedOrders.find(o => o.id === orderConfirm.id)
      try {
        const createdOrder = await createFoodOrder({
          restaurant,
          items: currentOrder?.items ?? [],
          driver,
          sender: null,
          deliveryFee: currentOrder?.delivery ?? 10000,
          deliveryDistanceKm: null,
          driverDistanceKm: null,
          comment: null,
        })

        // Update localStorage order with driver info
        const finalOrders = getFoodOrders().map(o =>
          o.id === orderConfirm.id ? {
            ...o,
            status: 'driver_heading',
            driver_name: driver.display_name ?? driver.name,
            driver_phone: driver.phone,
            driver_vehicle: driver.vehicle_model ?? driver.vehicle,
            driver_id: driver.id,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address ?? null,
            delivery_address: currentOrder?.address ?? null,
            cash_ref: createdOrder?.cash_ref ?? `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          } : o
        )
        saveFoodOrders(finalOrders)
        setFoodOrders(finalOrders)
      } catch {
        // Local fallback — still assign driver even if createFoodOrder fails (demo mode)
        const finalOrders = getFoodOrders().map(o =>
          o.id === orderConfirm.id ? {
            ...o,
            status: 'driver_heading',
            driver_name: driver.display_name ?? driver.name,
            driver_phone: driver.phone,
            driver_vehicle: driver.vehicle_model ?? driver.vehicle,
            driver_id: driver.id,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address ?? null,
            delivery_address: currentOrder?.address ?? null,
            cash_ref: `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          } : o
        )
        saveFoodOrders(finalOrders)
        setFoodOrders(finalOrders)
      }

      // Save a notification for restaurant alert
      const notifs = JSON.parse(localStorage.getItem('indoo_notifications') || '[]')
      notifs.unshift({
        id: `notif-${Date.now()}`,
        type: 'food_order_incoming',
        orderId: orderConfirm.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        items: currentOrder?.items ?? [],
        total: currentOrder?.total ?? orderConfirm.total,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('indoo_notifications', JSON.stringify(notifs))

    } catch {
      // Fallback demo driver
      const demoDriver = { id: 'driver-demo', display_name: 'Pak Andi', phone: '081234567890', vehicle_model: 'Honda Beat' }
      setAssignedDriver(demoDriver)
      const finalOrders = getFoodOrders().map(o =>
        o.id === orderConfirm.id ? {
          ...o,
          status: 'driver_heading',
          driver_name: demoDriver.display_name,
          driver_phone: demoDriver.phone,
          driver_vehicle: demoDriver.vehicle_model,
          driver_id: demoDriver.id,
          restaurant_name: restaurant.name,
        } : o
      )
      saveFoodOrders(finalOrders)
      setFoodOrders(finalOrders)
    } finally {
      setDriverSearching(false)
    }
  }

  const handleOpenTracking = () => {
    const currentOrder = getFoodOrders().find(o => o.id === orderConfirm?.id)
    if (currentOrder) {
      setTrackingOrder(currentOrder)
      setOrderConfirm(null)
      setPaymentStep(false)
      setPaymentSubmitted(false)
      setAssignedDriver(null)
      setPaymentProofFile(null)
    }
  }

  const [orderReceived, setOrderReceived] = useState(false)
  const [driverOnWay, setDriverOnWay] = useState(() => {
    if (startTracking?.driver) return startTracking.driver
    return null
  })
  const [driverPhase, setDriverPhase] = useState('to_restaurant')
  const [driverImgIdx, setDriverImgIdx] = useState(0)
  const [processingMsgIdx, setProcessingMsgIdx] = useState(0)
  const [showDeliveryRating, setShowDeliveryRating] = useState(null) // null or { driverName, driverPhoto, orderId, serviceType }

  // Auto-progress stages when started from cart checkout (startTracking)
  useEffect(() => {
    if (!startTracking?.driver || !driverOnWay) return
    const s1Time = 32000 // 32s to restaurant
    const s2Time = 20000 // 20s to customer
    const t1 = setTimeout(() => setDriverPhase('to_customer'), s1Time)
    const t2 = setTimeout(() => setDriverPhase('arrived'), s1Time + s2Time)
    // Show rating popup 10s after arrived (before closing tracking)
    const t3 = setTimeout(() => {
      setShowDeliveryRating({
        driverName:  driverOnWay?.driverName ?? 'Driver',
        driverPhoto: driverOnWay?.driverPhoto ?? '',
        orderId:     driverOnWay?.orderId ?? null,
        serviceType: 'food_delivery',
      })
    }, s1Time + s2Time + 10000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [!!startTracking?.driver])

  // Auto-post timed dispatch comms: INDOO HQ ↔ Driver (user reads along)
  useEffect(() => {
    if (!driverOnWay) return
    const chatKey = `indoo_delivery_chat_${driverOnWay.orderId ?? orderConfirm?.id ?? 'current'}`
    const fmt = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const isStreet = vendorType === 'street_vendor'
    const pickupName = isStreet ? 'the street vendor' : restaurant.name
    const plate = driverOnWay?.driverPlate ?? 'AB 1234 XY'
    const bike = driverOnWay?.bikeBrand ?? 'Honda Vario'
    const bikeColor = driverOnWay?.bikeColor ?? 'White'
    const callsign = driverOnWay?.driverCallsign ?? 'INDOO 4578'
    const ordNum = `#${driverOnWay.orderId ? driverOnWay.orderId.slice(-4).toUpperCase() : String(Math.floor(1000 + Math.random() * 9000))}`

    const INDOO_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_07_28%20AM.png?updatedAt=1776532065659'
    const ARRIVED_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2011_17_44%20AM.png'

    const postMsg = (from, text, extra) => {
      try {
        const existing = JSON.parse(localStorage.getItem(chatKey) || '[]')
        const entry = { id: Date.now() + Math.random(), from, text, time: fmt(), ...extra }
        if (from === 'driver') entry.callsign = callsign
        existing.push(entry)
        localStorage.setItem(chatKey, JSON.stringify(existing))
      } catch {}
    }

    const timers = []
    const q = (delay, from, text, extra) => timers.push(setTimeout(() => postMsg(from, text, extra), delay))

    // ── Phase 1: Dispatch → to restaurant (0–32s) ──
    q(0,     'indoo',  `${callsign}, order ${ordNum} confirmed. Proceed to ${pickupName} for pickup.`)
    q(4000,  'driver', `Copy HQ, ${callsign} heading to ${pickupName} now.`)
    q(10000, 'indoo',  `${callsign}, roads looking clear on your route. Estimated ${driverOnWay?.eta ?? 12} minutes.`)
    q(15000, 'driver', `Thanks HQ, making good time. Should be there shortly.`)
    q(22000, 'indoo',  `${callsign}, how's the approach? You should be close.`)
    q(25000, 'driver', `Almost there HQ, 2 minutes out from ${pickupName}.`)
    q(30000, 'driver', `${callsign} at pickup location. Collecting order ${ordNum} now.`)
    q(31000, 'indoo',  `Confirmed ${callsign}. Let us know once you have the order.`)

    // ── Phase 2: Picked up → to customer (32s–52s) ──
    q(33000, 'driver', `Order ${ordNum} Confirm Collection. Leaving ${pickupName} now.`)
    q(34500, 'indoo',  `Great work ${callsign}. Proceed to customer location. Stay safe on the road.`)
    q(38000, 'driver', `On my way HQ, traffic is flowing nicely.`)
    q(42000, 'indoo',  `${callsign}, you're making good progress. Customer has been notified.`)
    q(46000, 'driver', `Copy that, about 3 minutes from drop-off.`)
    q(48000, 'indoo',  `${callsign}, nearly there. Customer should be ready for you.`)
    q(50000, 'indoo',  `Customer — please look out for your driver\n${callsign} · ${bikeColor} ${bike} · Plate ${plate}`, { imageLeft: INDOO_IMG })

    // ── Phase 3: Arrived (52s+) ──
    q(52000, 'driver', `${callsign} has arrived at customer location. Delivering order ${ordNum}.`)
    q(53500, 'indoo',  `Confirmed ${callsign}. Order ${ordNum} delivered successfully.`, { imageRight: ARRIVED_IMG })
    q(55000, 'driver', `Order handed over. Customer has received. ${callsign} signing off thank you 🙏`)
    q(56500, 'indoo',  `Good job ${callsign}! Returning you to active fleet.`)
    q(59000, 'indoo',  `Thank you for ordering with INDOO! We hope to serve you again very soon.\n— INDOO Operations Team 😊`, { image: INDOO_IMG })

    return () => timers.forEach(clearTimeout)
  }, [!!driverOnWay])

  // Image 1 messages — printer waiting (before kitchen confirms)
  const PROCESSING_MESSAGES_1 = [
    'Processing Order',
    'Sending to restaurant',
    'Confirming with kitchen',
    'Searching for nearby driver',
    'Matching best driver for you',
  ]
  // Image 2 messages — paper printed (kitchen confirmed)
  const PROCESSING_MESSAGES_2 = [
    'Order Received!',
    'Kitchen has started your order',
    'Driver confirmed and on the way',
  ]

  useEffect(() => {
    if (!orderProcessing) return
    setProcessingMsgIdx(0)
    const msgs = orderReceived ? PROCESSING_MESSAGES_2 : PROCESSING_MESSAGES_1
    const id = setInterval(() => {
      setProcessingMsgIdx(i => (i + 1) % msgs.length)
    }, 3000)
    return () => clearInterval(id)
  }, [orderProcessing, orderReceived])


  // ── Master cleanup: cancel ALL pending timers on unmount ──
  const timerRefs = useRef([])
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
    }
  }, [])

  const safeTimeout = (fn, ms) => {
    const id = setTimeout(() => { if (mountedRef.current) fn() }, ms)
    timerRefs.current.push(id)
    return id
  }

  // Rotate driver images safely
  const vendorType = restaurant.vendor_type ?? 'restaurant'
  const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6

  // Processing & received images per vendor type + day/night
  const ORDER_IMAGES = {
    restaurant: {
      processing: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png',
      received:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png',
    },
    street_vendor: {
      day: {
        processing: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_35_28%20AM.png?updatedAt=1776814549960',
        received:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_05_25%20AM.png?updatedAt=1776812742688',
      },
      night: {
        processing: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_02_47%20AM.png?updatedAt=1776812600889',
        received:   'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_03_51%20AM.png?updatedAt=1776812648331',
      },
    },
  }
  const currentOrderImages = vendorType === 'street_vendor'
    ? (isNight ? ORDER_IMAGES.street_vendor.night : ORDER_IMAGES.street_vendor.day)
    : ORDER_IMAGES.restaurant

  // Get current stage images from dedicated constants file (deliveryCinematic.js)
  const currentStageImages = getStageImages(driverPhase, vendorType, isNight)

  // Preload all cinematic images as soon as driver tracking starts
  useEffect(() => {
    if (!driverOnWay) return
    preloadCinematicImages()
  }, [!!driverOnWay]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cycle images — equal intervals per stage, no repeats, no skips
  useEffect(() => {
    if (!driverOnWay || driverPhase === 'arrived') return
    setDriverImgIdx(0)
    const imgs = getStageImages(driverPhase, vendorType, isNight)
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL
    // Demo: fixed equal interval. Live: ETA ÷ image count (min 3s).
    const timePerImage = isDemo
      ? DEMO_INTERVAL_MS
      : Math.max(3000, Math.floor(((driverOnWay?.eta ?? 15) * 60 * 1000) / imgs.length))
    const id = setInterval(() => {
      if (mountedRef.current) setDriverImgIdx(i => { const next = i + 1; return next >= imgs.length ? i : next })
    }, timePerImage)
    return () => clearInterval(id)
  }, [driverPhase, !!driverOnWay]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Order handler — crash-safe with cleanup ──
  const handleOrder = () => {
    // Address is already shown at top of cart — proceed directly

    // Snapshot cart data BEFORE any async delays
    // Calculate final total with promo discount
    const promoDiscount = promoResult?.valid ? (promoResult.discountAmount ?? 0) : 0
    const freeDeliveryDiscount = promoResult?.isFreeDelivery ? (deliveryFare ?? 0) : 0
    const finalTotal = Math.max(0, grandTotal - promoDiscount - freeDeliveryDiscount)

    const orderSnapshot = {
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, extras: i.extras ?? [], extrasPrice: i.extrasPrice ?? 0, note: i.note ?? null })),
      total: finalTotal,
      delivery: promoResult?.isFreeDelivery ? 0 : (deliveryFare ?? (orderType === 'delivery' ? 10000 : 0)),
      orderType,
      paymentMethod: 'cod',
      customerWa: customerWa.trim(),
      address: orderType === 'delivery' ? (address || null) : null,
      restaurantName: restaurant.name,
      eta: eta + 10,
      scheduled_at: scheduleMode && scheduleSlot ? scheduleSlot : null,
      promo_code: promoResult?.valid ? promoCode : null,
      promo_discount: promoDiscount + freeDeliveryDiscount,
    }

    setOrderProcessing(true)
    setOrderReceived(false)
    setCartExpanded(false)

    const driverSearchTime = 6000 + Math.random() * 4000

    // Step 2: Driver found
    safeTimeout(() => {
      setOrderReceived(true)
    }, driverSearchTime)

    // Step 3: Transition to driver page
    safeTimeout(() => {
      const orderId = `FOOD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const order = {
        id: orderId,
        restaurant: orderSnapshot.restaurantName,
        items: orderSnapshot.items,
        total: orderSnapshot.total,
        delivery: orderSnapshot.delivery,
        order_type: orderSnapshot.orderType,
        payment_method: 'cod',
        customer_wa: orderSnapshot.customerWa,
        status: orderSnapshot.scheduled_at ? 'scheduled' : 'driver_assigned',
        address: orderSnapshot.address,
        created_at: new Date().toISOString(),
        scheduled_at: orderSnapshot.scheduled_at ?? null,
        promo_code: orderSnapshot.promo_code ?? null,
        promo_discount: orderSnapshot.promo_discount ?? 0,
      }

      // Post customer WhatsApp to delivery chat for driver
      if (orderSnapshot.customerWa) {
        const chatKey = `indoo_delivery_chat_${orderId}`
        const systemMsg = [
          { id: Date.now(), from: 'system', text: `Customer WhatsApp: ${orderSnapshot.customerWa}`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
          { id: Date.now() + 1, from: 'system', text: `Tap to call: wa.me/${orderSnapshot.customerWa.replace(/\D/g, '')}`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
        ]
        localStorage.setItem(chatKey, JSON.stringify(systemMsg))
      }

      const orders = getFoodOrders()
      orders.unshift(order)
      saveFoodOrders(orders)
      setFoodOrders(orders)

      setOrderProcessing(false)
      setOrderReceived(false)
      setDriverPhase('to_restaurant')
      setDriverOnWay({
        orderId,
        eta: realDeliveryEta ? realDeliveryEta.totalMinutes + avgPrepTime : orderSnapshot.eta,
        restaurant: orderSnapshot.restaurantName,
        driverName: 'Agus Prasetyo',
        driverCallsign: `INDOO ${Math.floor(1000 + Math.random() * 9000)}`,
        driverPlate: 'AB 1234 XY',
        driverPhoto: 'https://i.pravatar.cc/100?img=12',
        phone: '6281234567999',
        bikeBrand: 'Honda Vario 150',
        bikeColor: 'White',
        rating: 4.9,
        driverId: assignedDriver?.id ?? trackingOrder?.driver_id ?? null,
      })

      // Subscribe to real delivery phase updates via Supabase
      import('@/services/deliveryTrackingService').then(({ subscribeToDeliveryPhase }) => {
        if (!mountedRef.current) return
        const unsub = subscribeToDeliveryPhase(orderId, (phase) => {
          if (!mountedRef.current) return
          if (phase === 'picked_up' || phase === 'on_the_way') setDriverPhase('to_customer')
          else if (phase === 'almost_there' || phase === 'arrived') setDriverPhase('arrived')
        })
        timerRefs.current.push(() => unsub?.())
      }).catch(() => { /* no Supabase — demo fallback handles it */ })

      // Demo: auto-progress — timing matches image count
      // Stage 1: 8 images, Stage 2: 5 images, each ~4s = 32s + 20s
      if (import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL) {
        const s1Time = STAGE1_IMAGES.length * 4000  // 8 × 4s = 32s
        const s2Time = STAGE2_IMAGES.length * 4000   // 5 × 4s = 20s
        safeTimeout(() => setDriverPhase('to_customer'), s1Time)
        safeTimeout(() => setDriverPhase('arrived'), s1Time + s2Time)
      }

      setCart([])
      setShowAddrInput(false)
      setPaymentMethod(null)
      setTransactionCode('')
    }, driverSearchTime + 4000)
  }

  useEffect(() => () => clearTimeout(collapseRef.current), [])

  return (
    <div className={styles.screen}>

      {/* ── Header — deals style ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9600,
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        background: '#0a0a0a', borderRadius: '0 0 16px 16px', borderBottom: '2px solid #8DC63F',
        display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden',
      }}>
        {/* Running green light */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.7 }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{restaurant.name}</span>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} style={{ fontSize: 11, fontWeight: 700, color: '#FACC15', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
              {activeCategory} · All items ×
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
        @keyframes runningLightVertical { from { top: -20%; } to { top: 100%; } }
      `}</style>

      {/* Cart backdrop */}
      {cartExpanded && <div className={styles.cartBackdrop} onClick={() => { setCartExpanded(false); setShowAddrInput(false) }} />}

      {/* ── Growing cart badge (top-right) ── */}
      <div
        className={`${styles.cartBadge} ${cartExpanded ? styles.cartBadgeOpen : ''}`}
        onClick={() => {
          setCartExpanded(e => { if (e) setShowAddrInput(false); return !e })
          clearTimeout(collapseRef.current)
        }}
      >
        {/* Icon row */}
        <div className={styles.cartBadgeTop}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="Cart" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
        </div>

      </div>

      {/* ── Full-page cart ── */}
      {cartExpanded && (
        <div className={styles.cartPage}>
          {/* Cart header */}
          <div className={styles.cartPageHeader}>
            <button className={styles.cartPageBack} onClick={() => { setCartExpanded(false); setShowAddrInput(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <span className={styles.cartPageTitle}>{restaurant.name}</span>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: restaurant.is_open ? '#8DC63F' : '#ef4444', marginTop: 3 }}>
                {restaurant.is_open ? <><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#8DC63F', marginRight: 5, animation: 'pulse 1.5s ease-in-out infinite' }} />Kitchen full speed — orders dispatched on time</> : '🔴 Kitchen is closed'}
              </span>
            </div>
          </div>

          {/* Delivery address */}
          <div style={{ padding: '10px 16px', flexShrink: 0, position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className={styles.addrWrap}>
              <input
                className={styles.addrInput}
                placeholder="📍 Your delivery address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
              <button className={styles.locateBtn} onClick={handleUseLocation} onTouchEnd={(e) => { e.preventDefault(); handleUseLocation() }} disabled={locating}>
                {locating ? '…' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              </button>
            </div>
          </div>

          {/* Scheduled delivery toggle */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: scheduleMode ? '#fff' : '#fff' }}>Schedule for later</span>
                </div>
                <button onClick={() => { setScheduleMode(!scheduleMode); if (scheduleMode) setScheduleSlot(null) }} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: scheduleMode ? '#8DC63F' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: scheduleMode ? 22 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
              {scheduleMode && (
                <div style={{ marginTop: 10 }}>
                  <select
                    value={scheduleSlot ?? ''}
                    onChange={e => setScheduleSlot(e.target.value || null)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                      appearance: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Select delivery time</option>
                    {getAvailableTimeSlots().slice(0, 28).map(slot => (
                      <option key={slot.value} value={slot.value} style={{ background: '#1a1a1a', color: '#fff' }}>{slot.label}</option>
                    ))}
                  </select>
                  {scheduleSlot && (
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 700, marginTop: 6, display: 'block' }}>
                      Scheduled: {new Date(scheduleSlot).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at {new Date(scheduleSlot).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>

          {/* Promo code input */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
                placeholder="Promo code"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${promoResult?.valid ? '#8DC63F' : promoResult?.valid === false ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none',
                  letterSpacing: '0.06em',
                }}
              />
              <button onClick={() => {
                const result = validatePromoCode(promoCode, cartTotal)
                setPromoResult(result)
                if (result.valid) applyPromoCode(promoCode)
              }} style={{
                padding: '10px 16px', borderRadius: 12,
                background: promoCode.trim() ? '#8DC63F' : 'rgba(255,255,255,0.06)',
                border: 'none', color: promoCode.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                fontSize: 12, fontWeight: 800, cursor: promoCode.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}>
                Apply
              </button>
              <button onClick={() => { closeAllDrawers(); setPromoBannerOpen2(true) }} style={{
                padding: '10px 12px', borderRadius: 12,
                background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)',
                color: '#FACC15', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} title="Browse promos">
                🏷️
              </button>
            </div>
            {promoResult && (
              <span style={{ fontSize: 14, fontWeight: 700, color: promoResult.valid ? '#8DC63F' : '#ef4444', marginTop: 6, display: 'block' }}>
                {promoResult.valid ? `${promoResult.label} — Save ${promoResult.isFreeDelivery ? 'delivery fee' : `Rp ${promoResult.discountAmount?.toLocaleString('id-ID')}`}` : promoResult.error}
              </span>
            )}
          </div>

          {/* Multi-restaurant cart indicator */}
          {getRestaurantCount() > 1 && (
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FACC15' }}>
                {getRestaurantCount()} restaurants in cart · Orders will be placed separately
              </span>
            </div>
          )}

          {/* Cart items list */}
          <div className={styles.cartPageBody}>
            {cart.length === 0 ? (
              <div className={styles.cartEmpty}>Your cart is empty</div>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className={styles.cartPageItem}>
                    <div className={styles.cartPageItemRow}>
                      <span className={styles.cartPageQty}>{item.qty}×</span>
                      <span className={styles.cartPageName} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.name}
                        {item._isDeal && <span style={{ padding: '2px 6px', borderRadius: 6, backgroundColor: '#FACC15', fontSize: 10, fontWeight: 900, color: '#000', flexShrink: 0 }}>🏷️ {dealDiscount?.discountPercent ?? 0}% OFF</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {item._isDeal && item.original_price && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(item.original_price * item.qty)}</span>}
                        <span className={styles.cartPagePrice} style={item._isDeal ? { color: '#8DC63F' } : {}}>{fmtRp(item.price * item.qty)}</span>
                      </div>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ width: 30, height: 30, borderRadius: 8, background: '#333', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => addToCart(item)} style={{ width: 30, height: 30, borderRadius: 8, background: '#333', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <button onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)} style={{
                        marginLeft: 'auto', padding: '4px 10px', borderRadius: 8,
                        background: '#8DC63F',
                        border: 'none',
                        color: '#000',
                        fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        {item.note?.trim() ? '📝' : '+'} Note
                      </button>
                    </div>
                    {/* Note preview */}
                    {item.note?.trim() && editingNoteId !== item.id && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4, display: 'block', paddingLeft: 4 }}>📝 {item.note}</span>
                    )}
                    {/* Note slide-down editor */}
                    {editingNoteId === item.id && (
                      <div style={{ marginTop: 8, animation: 'fadeIn 0.2s ease' }}>
                        <textarea
                          className={styles.cartNoteInput}
                          style={{ resize: 'none', height: 60, lineHeight: 1.4, width: '100%', boxSizing: 'border-box' }}
                          placeholder="e.g. no chili, extra sauce, less rice, extra spicy…"
                          value={item.note ?? ''}
                          onChange={e => { if (e.target.value.length <= 150) updateNote(item.id, e.target.value) }}
                          autoFocus
                          maxLength={150}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{(item.note ?? '').length}/150</span>
                          <button className={styles.cartNoteDone} onClick={() => setEditingNoteId(null)}>Done</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Delivery card */}
                {(deliveryFare ?? 0) > 0 && (
                  <div className={styles.cartPageItem} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>Delivery</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>~{formatETA(eta)} · Payment To Driver</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 900, color: promoResult?.isFreeDelivery ? '#8DC63F' : '#FACC15' }}>{promoResult?.isFreeDelivery ? 'FREE' : fmtRp(deliveryFare)}</span>
                  </div>
                )}

                {/* Deal discount line */}
                {dealDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FACC15' }}>🏷️ {dealDiscount.discountPercent}% OFF Deal</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>-{fmtRp(dealDiscount.discountAmount)}</span>
                  </div>
                )}

                {/* Promo discount line */}
                {promoResult?.valid && promoResult.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#8DC63F' }}>🏷️ {promoResult.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>-{fmtRp(promoResult.discountAmount)}</span>
                  </div>
                )}
                {promoResult?.valid && promoResult.isFreeDelivery && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#8DC63F' }}>🏷️ Free Delivery</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>-{fmtRp(deliveryFare ?? 0)}</span>
                  </div>
                )}

                {/* Scheduled delivery badge */}
                {scheduleMode && scheduleSlot && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15' }}>
                      Scheduled: {new Date(scheduleSlot).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(scheduleSlot).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Total Order */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Total Order</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(Math.max(0, grandTotal - (promoResult?.valid ? (promoResult.discountAmount ?? 0) : 0) - (promoResult?.isFreeDelivery ? (deliveryFare ?? 0) : 0)))}</span>
                </div>

                <div className={styles.cartDivider} style={{ margin: '0 0 12px' }} />

                {/* Payment — COD only */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1.5px solid rgba(141,198,63,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <img src="https://ik.imagekit.io/nepgaxllc/mmma-removebg-preview.png?updatedAt=1777002391090" alt="COD" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>Cash on Delivery</span>
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Pay driver when food arrives</span>
                      </div>
                    </div>
                    {/* Customer WhatsApp number with country prefix */}
                    <WhatsAppInput
                      label="Your WhatsApp"
                      value={customerWa}
                      onChange={setCustomerWa}
                    />
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4 }}>Driver will contact you to confirm delivery</span>
                  </div>
                </div>

              </>
            )}
          </div>

          {/* Fixed bottom */}
          {cart.length > 0 && (
            <div className={styles.cartPageFooter}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 12px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Pay Driver On Arrival</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(grandTotal)}</span>
              </div>
              <button
                className={styles.orderBtn}
                style={{
                  fontSize: 16, padding: 16, borderRadius: 16,
                  opacity: customerWa.trim().length >= 10 ? 1 : 0.4,
                  cursor: customerWa.trim().length >= 10 ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (customerWa.trim().length >= 10) handleOrder()
                }}
              >
                <img src="https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png" alt="" />
                <span>{customerWa.trim().length >= 10 ? 'Confirm Order' : 'Enter WhatsApp Number'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Right floating panel ── */}
      <div className={styles.floatingPanel}>
        {/* Cuisine — opens drawer */}
        <button
          className={styles.panelBtn}
          onClick={() => { if (cuisineDrawerOpen) { setCuisineDrawerOpen(false) } else { closeAllDrawers(); setCuisineDrawerOpen(true) } }}
          title="Browse categories"
          style={cuisineDrawerOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            <circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="5" r="1"/><circle cx="19" cy="5" r="1"/>
            <circle cx="5" cy="19" r="1"/><circle cx="19" cy="19" r="1"/>
          </svg>
          <span className={styles.panelLabel}>Cuisine</span>
        </button>

        {/* Deals — state: live deal today (yellow glow), has deals but not today (normal), no deals (dimmed) */}
        <button
          className={styles.panelBtn}
          onClick={() => {
            if (dailyDealOpen) { setDailyDealOpen(false) } else { closeAllDrawers(); setDailyDealOpen(true) }
          }}
          title="Daily deals"
          style={dailyDealOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          {/* Pulsing dot for live deal */}
          {todayDeal && !dailyDealOpen && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#FACC15', animation: 'ping 1.5s ease-in-out infinite', boxShadow: '0 0 6px #FACC15' }} />
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dailyDealOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span className={styles.panelLabel} style={dailyDealOpen ? { color: '#FACC15' } : {}}>Deals</span>
        </button>

        {/* Categories */}
        <button
          className={styles.panelBtn}
          onClick={() => { if (drawerOpen) { setDrawerOpen(false) } else { closeAllDrawers(); setDrawerOpen(true) } }}
          title="Browse categories"
          style={drawerOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={drawerOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span className={styles.panelLabel} style={drawerOpen ? { color: '#FACC15' } : {}}>Menu</span>
        </button>

        {/* Events */}
        {(restaurant.seating_capacity || restaurant.catering_available || restaurant.event_features?.length > 0) && (
          <button
            className={styles.panelBtn}
            onClick={() => { if (eventsOpen) { setEventsOpen(false) } else { closeAllDrawers(); setEventsOpen(true) } }}
            title="Events & venue"
            style={eventsOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={eventsOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className={styles.panelLabel} style={eventsOpen ? { color: '#FACC15' } : {}}>Events</span>
          </button>
        )}

        {/* Socials */}
        {(restaurant.instagram || restaurant.tiktok || restaurant.facebook) && (
          <button
            className={styles.panelBtn}
            onClick={() => { if (socialsOpen) { setSocialsOpen(false) } else { closeAllDrawers(); setSocialsOpen(true) } }}
            title="Social media"
            style={socialsOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={socialsOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className={styles.panelLabel} style={socialsOpen ? { color: '#FACC15' } : {}}>Follow</span>
          </button>
        )}

        {/* My Orders */}
        <button
          className={styles.panelBtn}
          onClick={() => { if (ordersOpen) { setOrdersOpen(false) } else { closeAllDrawers(); setFoodOrders(getFoodOrders()); setOrdersOpen(true) } }}
          title="My Orders"
          style={ordersOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ordersOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            <line x1="8" y1="10" x2="16" y2="10"/>
            <line x1="8" y1="14" x2="16" y2="14"/>
            <line x1="8" y1="18" x2="12" y2="18"/>
          </svg>
          <span className={styles.panelLabel} style={ordersOpen ? { color: '#FACC15' } : {}}>Orders</span>
        </button>

        {/* Dashboard */}
        <button
          className={styles.panelBtn}
          onClick={() => { closeAllDrawers(); setDashboardOpen(true) }}
          title="My Food Dashboard"
          style={dashboardOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dashboardOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span className={styles.panelLabel} style={dashboardOpen ? { color: '#FACC15' } : {}}>My Food</span>
        </button>

        {/* Promos */}
        <button
          className={styles.panelBtn}
          onClick={() => { if (promoBannerOpen) { setPromoBannerOpen2(false) } else { closeAllDrawers(); setPromoBannerOpen2(true) } }}
          title="Promo codes & banners"
          style={promoBannerOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={promoBannerOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span className={styles.panelLabel} style={promoBannerOpen ? { color: '#FACC15' } : {}}>Promos</span>
        </button>

      </div>


      {/* ── Today's special banner ── */}
      {todaySpecial && (
        <div style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top) + 60px)', left: 12, right: 12,
          zIndex: 15, padding: '10px 14px', borderRadius: 14,
          background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.3)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.3s ease',
        }}>
          <span style={{ fontSize: 24 }}>🔥</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>Today's Special: {todaySpecial.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{todaySpecial.dishName} — {todaySpecial.offerId?.replace('_', ' ')?.replace('discount ', '')}</div>
          </div>
        </div>
      )}

      {/* ── Allergen / dietary filter chips ── */}
      <div style={{
        position: 'absolute', top: 'calc(env(safe-area-inset-top) + 56px)', left: 8, right: 54,
        zIndex: 16, display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 4px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {ALLERGEN_FILTERS.map(f => {
          const active = allergenFilter.includes(f.id)
          return (
            <button key={f.id} onClick={() => {
              setAllergenFilter(prev => active ? prev.filter(x => x !== f.id) : [...prev, f.id])
            }} style={{
              padding: '5px 10px', borderRadius: 14, whiteSpace: 'nowrap',
              background: active ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: `1.5px solid ${active ? '#8DC63F' : 'rgba(255,255,255,0.1)'}`,
              color: active ? '#8DC63F' : 'rgba(255,255,255,0.6)',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 13 }}>{f.emoji}</span>
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── Full-screen snap-scroll menu feed ── */}
      <div className={styles.feed} ref={feedRef}>
        {visibleItems.length === 0 ? (
          <div className={styles.emptyFeed}>No items in this category</div>
        ) : (
          visibleItems.map((item, i) => {
            const itemBadge = dishBadges.find(b => b.dishId === item.id)
            const badgeData = itemBadge ? FREE_ITEM_BADGES.find(fb => fb.id === itemBadge.badgeId) : null
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={qtyFor(item.id)}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
                onCustomize={(itm) => setCustomizeItem(itm)}
                itemRef={el => { itemRefs.current[i] = el }}
                badge={badgeData}
                tags={getAutoTags(item)}
                dealBadge={dealDiscount && item.name === dealDiscount.itemName ? dealDiscount : null}
              />
            )
          })
        )}
      </div>

      {/* ── Category floating grid (left side) ── */}
      {drawerOpen && (
        <CategoryDrawer
          items={items}
          categories={categories}
          activeCategory={activeCategory}
          onClose={() => setDrawerOpen(false)}
          onJumpToCategory={jumpToCategory}
        />
      )}

      {/* ── Events / venue left drawer ── */}
      {eventsOpen && (
        <EventsDrawer
          restaurant={restaurant}
          onClose={() => setEventsOpen(false)}
          onOrderViaChat={onOrderViaChat}
        />
      )}

      {/* ── Weekly promos sheet ── */}
      {promosOpen && <WeeklyPromoSheet onClose={() => setPromosOpen(false)} restaurant={restaurant} />}

      {/* ── Payment card ── */}
      {paymentData && (
        <PaymentCard
          restaurant={restaurant}
          total={paymentData.total}
          orderRef={paymentData.orderRef}
          onDone={() => setPaymentData(null)}
        />
      )}

      {/* ── My Orders slide-up panel ── */}
      {ordersOpen && (
        <OrdersPanel
          foodOrders={foodOrders}
          onClose={() => setOrdersOpen(false)}
          onCancelOrder={handleCancelOrder}
          onReviewOrder={(order) => { setReviewOrder(order); setReviewStars(0); setReviewComment('') }}
          onReorder={(items) => {
            // Clear existing cart and load reorder items
            setCart(items.map(item => ({ ...item, qty: item.qty ?? 1 })))
            setOrdersOpen(false)
            setCartExpanded(true)
            setToast('Order loaded — confirm to place again')
          }}
        />
      )}

      {/* ── Order processing overlay ── */}
      {orderProcessing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9900, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Full-screen background image */}
          <img
            src={!orderReceived ? currentOrderImages.processing : currentOrderImages.received}
            alt={!orderReceived ? 'Processing' : 'Order Received'}
            key={`order-${orderReceived ? 'received' : 'processing'}-${vendorType}-${isNight ? 'night' : 'day'}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.8s ease' }}
          />
          {/* Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)' }} />

          {/* Bottom text — works for both images */}
          <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
            {(() => {
              const msgs = orderReceived ? PROCESSING_MESSAGES_2 : PROCESSING_MESSAGES_1
              const msg = msgs[processingMsgIdx % msgs.length]
              return (
                <h3 style={{ fontSize: 20, fontWeight: 900, color: orderReceived ? '#8DC63F' : '#fff', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.8)', animation: 'fadeIn 0.5s ease' }} key={processingMsgIdx + (orderReceived ? 'r' : 'p')}>{msg}</h3>
              )
            })()}
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', animation: 'dotDance 1.8s ease-in-out infinite', boxShadow: '0 0 10px rgba(141,198,63,0.5)' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', animation: 'dotDance 1.8s ease-in-out 0.3s infinite', boxShadow: '0 0 10px rgba(141,198,63,0.5)' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', animation: 'dotDance 1.8s ease-in-out 0.6s infinite', boxShadow: '0 0 10px rgba(141,198,63,0.5)' }} />
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{restaurant.name}</p>
          </div>
        </div>
      )}

      {/* ── Driver tracking — full page ── */}
      {/* Minimized driver notification bar */}
      {driverOnWay?.minimized && (
        <button onClick={() => setDriverOnWay(prev => ({ ...prev, minimized: false }))} style={{
          position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', left: 16, right: 16, zIndex: 9860,
          padding: '12px 16px', borderRadius: 14, background: '#8DC63F', border: 'none',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#000', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 900, color: '#000', flex: 1 }}>Driver on the way — tap to view</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {driverOnWay && !driverOnWay.minimized && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9850, background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />
          {/* Minimize button — top left */}
          <button onClick={() => setDriverOnWay(prev => ({ ...prev, minimized: true }))} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 16, zIndex: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Minimize</span>
          </button>

          {/* Delivery tracking — full height behind footer */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#0a0a0a', overflow: 'hidden' }}>

            {/* Live Google Map — always mounted, visibility toggled (1 map load only) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: mapFullView ? 1 : 0, opacity: mapFullView ? 1 : 0, pointerEvents: mapFullView ? 'auto' : 'none', transition: 'opacity 0.4s ease' }}>
              <DeliveryMap driverPhase={driverPhase} driverImgIdx={driverImgIdx} totalImages={currentStageImages.length} driverId={driverOnWay?.driverId ?? trackingOrder?.driver_id ?? null} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Cinematic image — always mounted, visibility toggled */}
            <div style={{ position: 'absolute', inset: 0, zIndex: mapFullView ? 0 : 1, opacity: mapFullView ? 0 : 1, pointerEvents: mapFullView ? 'none' : 'auto', transition: 'opacity 0.4s ease' }}>
              <img
                src={currentStageImages[Math.min(driverImgIdx, currentStageImages.length - 1)]?.img ?? FALLBACK_IMG}
                alt=""
                key={`${driverPhase}-${driverImgIdx}`}
                onError={e => { e.currentTarget.src = FALLBACK_IMG }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.8s ease' }}
              />

            </div>

            {/* Status banner — top (always visible in both views) */}
            <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 64px)', left: 12, right: 12, zIndex: 4 }}>
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1, animation: 'fadeIn 0.5s ease' }} key={`txt-${driverPhase}-${driverImgIdx}`}>
                  {currentStageImages[Math.min(driverImgIdx, currentStageImages.length - 1)]?.text ?? ''}
                </span>
                {driverPhase !== 'arrived' && <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>~{formatETA(driverOnWay?.eta ?? 0)}</span>}
              </div>
            </div>

            {/* Bottom stats: KM | Tappable thumbnail (toggle) | KM/H */}
            {(() => {
              const currentImg = currentStageImages[Math.min(driverImgIdx, currentStageImages.length - 1)]
              const speed = currentImg?.speed ?? 0
              return (
                <div style={{ position: 'absolute', bottom: 260, left: 0, right: 0, zIndex: 4, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    {/* KM */}
                    <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block' }}>2.3</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>KM</span>
                    </div>

                    {/* Center thumbnail — tap to toggle between cinematic / map */}
                    <button
                      onClick={() => setMapFullView(v => !v)}
                      style={{
                        width: 90, height: 70, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                        border: '2px solid rgba(141,198,63,0.4)', background: '#0a0a0a', padding: 0,
                        position: 'relative', boxShadow: '0 0 12px rgba(141,198,63,0.3)',
                      }}
                    >
                      {/* Always show the OPPOSITE view as thumbnail preview */}
                      {mapFullView ? (
                        <img
                          src={currentStageImages[Math.min(driverImgIdx, currentStageImages.length - 1)]?.img ?? FALLBACK_IMG}
                          alt=""
                          onError={e => { e.currentTarget.src = FALLBACK_IMG }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        /* Map thumbnail preview */
                        <img
                          src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_39_04%20AM.png"
                          alt=""
                          onError={e => { e.currentTarget.src = FALLBACK_IMG }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 0',
                        background: 'rgba(0,0,0,0.8)', textAlign: 'center',
                      }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: '#8DC63F', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {mapFullView ? 'Journey' : 'Live Map'}
                        </span>
                      </div>
                    </button>

                    {/* KM/H */}
                    <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${speed > 30 ? 'rgba(141,198,63,0.2)' : speed > 0 ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.08)'}`, textAlign: 'center', transition: 'border-color 0.5s' }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: speed > 30 ? '#8DC63F' : speed > 0 ? '#FACC15' : 'rgba(255,255,255,0.3)', display: 'block', transition: 'color 0.5s' }}>{speed}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>KM/H</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Bottom panel — floating container at footer */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, padding: '0 12px calc(env(safe-area-inset-bottom, 0px) + 12px)',
          }}>
          <div style={{
            padding: '16px', borderRadius: 20,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(141,198,63,0.2)',
          }}>
            <div className={styles.driverCard} style={{ flexDirection: 'column', gap: 12 }}>
              {/* Top row: photo + info + action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                {/* Animated glow ring behind profile */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #8DC63F', animation: 'ping 2s ease-in-out infinite', opacity: 0.4 }} />
                  <img src={driverOnWay?.driverPhoto ?? ''} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #8DC63F', position: 'relative', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{driverOnWay?.driverName ?? 'Driver'}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>⭐ {driverOnWay?.rating ?? '—'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.7)', display: 'block', marginTop: 2, fontWeight: 700 }}>INDOO Verified Driver</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 3 }}>{driverOnWay?.bikeBrand ?? ''} · <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{driverOnWay?.driverPlate ?? ''}</span></span>
                </div>
              </div>

              {/* Action buttons — centered under driver details */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, marginBottom: 4 }}>
                <a href={`tel:${driverOnWay?.phone ?? ''}`} style={{ width: 48, height: 48, borderRadius: 14, background: '#991B1B', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
                <button onClick={() => window.open(`https://wa.me/${(driverOnWay?.phone ?? '').replace(/\D/g, '')}?text=Hi%20driver%2C%20I%20have%20a%20question%20about%20my%20order`, '_blank')} style={{ width: 48, height: 48, borderRadius: 14, background: '#25D366', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.555 4.122 1.527 5.857L.063 23.7a.5.5 0 0 0 .612.612l5.843-1.464A11.948 11.948 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.586l-.386-.231-3.466.868.883-3.466-.253-.402A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                </button>
                <button onClick={() => setDeliveryChatOpen(true)} style={{ width: 48, height: 48, borderRadius: 14, background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>

              {/* Progress steps — inside the driver card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px', width: '100%' }}>
                {/* Confirmed */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize: 8, color: '#8DC63F', fontWeight: 700 }}>Confirmed</span>
                </div>

                <div style={{ flex: 1, height: 4, borderRadius: 2, margin: '0 6px 12px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                  {driverPhase === 'to_restaurant' && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: 'linear-gradient(90deg, #8DC63F, #FACC15)', borderRadius: 2, animation: 'journeyFill 8s ease-in-out infinite' }} />
                  )}
                  {(driverPhase === 'to_customer' || driverPhase === 'arrived') && (
                    <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', borderRadius: 2 }} />
                  )}
                </div>

                {/* Pickup */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {driverPhase === 'to_customer' || driverPhase === 'arrived' ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  ) : (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  <span style={{ fontSize: 8, color: driverPhase === 'to_customer' || driverPhase === 'arrived' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Pickup</span>
                </div>

                <div style={{ flex: 1, height: 4, borderRadius: 2, margin: '0 6px 12px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                  {driverPhase === 'to_customer' && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: 'linear-gradient(90deg, #8DC63F, #FACC15)', borderRadius: 2, animation: 'journeyFill 8s ease-in-out infinite' }} />
                  )}
                  {driverPhase === 'arrived' && (
                    <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', borderRadius: 2 }} />
                  )}
                </div>

                {/* On Way */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {driverPhase === 'arrived' ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  ) : (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  <span style={{ fontSize: 8, color: driverPhase === 'arrived' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>On Way</span>
                </div>

                <div style={{ flex: 1, height: 4, borderRadius: 2, margin: '0 6px 12px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                  {driverPhase === 'arrived' && (
                    <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', borderRadius: 2 }} />
                  )}
                </div>

                {/* Arrived */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {driverPhase === 'arrived' ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  ) : (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  <span style={{ fontSize: 8, color: driverPhase === 'arrived' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Arrived</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Delivery rating popup — shown before tracking closes ── */}
      {showDeliveryRating && (
        <RatingPopup
          {...showDeliveryRating}
          onSubmit={() => { setShowDeliveryRating(null); setDriverOnWay(null) }}
          onSkip={() => { setShowDeliveryRating(null); setDriverOnWay(null) }}
        />
      )}

      {/* ── Order confirmation overlay with payment flow ── */}
      <OrderConfirmOverlay
        orderConfirm={orderConfirm}
        setOrderConfirm={setOrderConfirm}
        paymentStep={paymentStep}
        setPaymentStep={setPaymentStep}
        paymentSubmitted={paymentSubmitted}
        setPaymentSubmitted={setPaymentSubmitted}
        driverSearching={driverSearching}
        assignedDriver={assignedDriver}
        setAssignedDriver={setAssignedDriver}
        paymentProofFile={paymentProofFile}
        setPaymentProofFile={setPaymentProofFile}
        restaurant={restaurant}
        handleSubmitPayment={handleSubmitPayment}
        handlePaymentProofUpload={handlePaymentProofUpload}
        handleOpenTracking={handleOpenTracking}
        getFoodOrders={getFoodOrders}
        saveFoodOrders={saveFoodOrders}
        setFoodOrders={setFoodOrders}
      />

      {/* ── Customize sheet ── */}
      <CustomizeSheet
        open={!!customizeItem}
        item={customizeItem}
        onClose={() => setCustomizeItem(null)}
        onConfirm={(customized) => {
          addToCart({ ...customized.item, price: customized.totalPrice, customization: customized })
          setCustomizeItem(null)
        }}
      />

      {/* ── Review modal ── */}
      <ReviewModal
        reviewOrder={reviewOrder}
        reviewStars={reviewStars}
        setReviewStars={setReviewStars}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        onSubmit={handleSubmitReview}
        onClose={() => setReviewOrder(null)}
      />

      {/* ── Toast notification ── */}
      {toast && (
        <div className={styles.toastNotif}>
          {toast}
        </div>
      )}

      {/* ── Socials left drawer ── */}
      {socialsOpen && (
        <SocialsDrawer
          restaurant={restaurant}
          onClose={() => setSocialsOpen(false)}
        />
      )}

      {dashboardOpen && (
        <FoodDashboard onClose={() => setDashboardOpen(false)} />
      )}

      {/* Cuisine drawer */}
      {cuisineDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9580, background: 'rgba(0,0,0,0.5)' }} onClick={() => setCuisineDrawerOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 210,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderRight: '2px solid rgba(141,198,63,0.3)',
            display: 'flex', flexDirection: 'column',
            boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05), 4px 0 20px rgba(0,0,0,0.4)',
          }}>
            {/* Running green light on right edge */}
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 2, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
              <div style={{ width: '100%', height: '20%', background: 'linear-gradient(180deg, transparent, #8DC63F, #fff, #8DC63F, transparent)', animation: 'runningLightVertical 3s linear infinite', position: 'absolute' }} />
            </div>

            {/* Drawer header */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>Cuisine</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 2, display: 'block' }}>{restaurant.name}</span>
            </div>

            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 100px', display: 'flex', flexDirection: 'column', gap: 4, WebkitOverflowScrolling: 'touch' }}>
            {[
              { type: 'item', id: null, label: 'All', emoji: '🍛' },
              { type: 'header', label: '🇮🇩 Indonesian' },
              { type: 'item', id: 'rice', label: 'Rice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvv-removebg-preview.png' },
              { type: 'item', id: 'noodles', label: 'Noodles', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvd-removebg-preview.png' },
              { type: 'item', id: 'chicken', label: 'Chicken', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddd-removebg-preview.png' },
              { type: 'item', id: 'satay', label: 'Satay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasda-removebg-preview.png' },
              { type: 'item', id: 'grilled', label: 'Snacks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdasss-removebg-preview.png' },
              { type: 'item', id: 'seafood', label: 'Seafood', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassss-removebg-preview.png' },
              { type: 'item', id: 'padang', label: 'Padang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfss-removebg-preview.png' },
              { type: 'item', id: 'gudeg', label: 'Gudeg', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssd-removebg-preview.png' },
              { type: 'item', id: 'rendang', label: 'Rendang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdss-removebg-preview.png' },
              { type: 'item', id: 'soup', label: 'Soup', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdas-removebg-preview.png' },
              { type: 'item', id: 'tofu_tempe', label: 'Tempe', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddd-removebg-preview.png' },
              { type: 'item', id: 'siomay', label: 'Siomay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddddd-removebg-preview.png' },
              { type: 'item', id: 'ketoprak', label: 'Ketoprak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssddffdddd-removebg-preview.png' },
              { type: 'item', id: 'martabak', label: 'Martabak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddf-removebg-preview.png' },
              { type: 'item', id: 'duck', label: 'Duck', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssss-removebg-preview.png' },
              { type: 'item', id: 'fish', label: 'Fish', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssdd-removebg-preview.png' },
              { type: 'item', id: 'porridge', label: 'Porridge', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssdd-removebg-preview.png' },
              { type: 'header', label: '🍔 Western' },
              { type: 'item', id: 'burgers', label: 'Burgers', img: 'https://ik.imagekit.io/nepgaxllc/od-removebg-preview.png' },
              { type: 'item', id: 'steak', label: 'Steak', img: 'https://ik.imagekit.io/nepgaxllc/odf-removebg-preview.png' },
              { type: 'item', id: 'pizza', label: 'Pizza', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsada-removebg-preview.png' },
              { type: 'item', id: 'pasta', label: 'Pasta', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadadd-removebg-preview.png' },
              { type: 'item', id: 'breakfast', label: 'Breakfast', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaa-removebg-preview.png' },
              { type: 'item', id: 'healthy', label: 'Healthy', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddd-removebg-preview.png' },
              { type: 'item', id: 'vegetarian', label: 'Vegetarian', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasds-removebg-preview.png' },
              { type: 'header', label: '🇨🇳 Chinese' },
              { type: 'item', id: 'chinese', label: 'Chinese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxccc-removebg-preview.png' },
              { type: 'header', label: '🇯🇵 Japanese' },
              { type: 'item', id: 'japanese', label: 'Japanese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddss-removebg-preview.png' },
              { type: 'header', label: '🇰🇷 Korean' },
              { type: 'item', id: 'korean', label: 'Korean', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxc-removebg-preview.png' },
              { type: 'header', label: '🇮🇳 Indian' },
              { type: 'item', id: 'indian', label: 'Indian', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddss-removebg-preview.png' },
              { type: 'header', label: '🥤 Drinks & Desserts' },
              { type: 'item', id: 'drinks', label: 'Iced Drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfs-removebg-preview.png' },
              { type: 'item', id: 'traditional_drinks', label: 'Traditional', img: 'https://ik.imagekit.io/nepgaxllc/odfss-removebg-preview.png' },
              { type: 'item', id: 'coffee', label: 'Tea & Coffee', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssda-removebg-preview.png' },
              { type: 'item', id: 'juice', label: 'Juice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssdaasda-removebg-preview.png' },
              { type: 'item', id: 'cakes', label: 'Cakes', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasd-removebg-preview.png' },
              { type: 'item', id: 'desserts', label: 'Desserts', img: 'https://ik.imagekit.io/nepgaxllc/odfssd-removebg-preview.png' },
              { type: 'item', id: 'snacks', label: 'Snacks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaad-removebg-preview.png' },
            ].map(c => c.type === 'header' ? (
              <div key={c.label} style={{ padding: '10px 8px 4px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
              </div>
            ) : (
              <button key={c.label} onClick={() => { setActiveCategory(c.id ? c.label : null); setCuisineDrawerOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12,
                background: activeCategory === c.label ? 'rgba(141,198,63,0.1)' : 'transparent',
                border: activeCategory === c.label ? '1px solid rgba(141,198,63,0.3)' : '1px solid transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}>
                {c.img ? <img src={c.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} /> : <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }}>{c.emoji}</span>}
                <span style={{ fontSize: 13, fontWeight: 800, color: activeCategory === c.label ? '#8DC63F' : '#fff' }}>{c.label}</span>
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {dailyDealOpen && (
        todayDeal ? (
          <DailyDealOverlay
            restaurant={restaurant}
            dealItems={todayDeal.items}
            onClose={() => setDailyDealOpen(false)}
            onAddToCart={(item) => {
              setCart(prev => {
                const existing = prev.find(c => c.id === item.id)
                if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
                return [...prev, { ...item, qty: 1 }]
              })
            }}
            onViewMenu={() => { setDailyDealOpen(false); setCartExpanded(true) }}
          />
        ) : (
          <DailyDealOverlay
            restaurant={restaurant}
            dealItems={[]}
            onClose={() => setDailyDealOpen(false)}
            onAddToCart={() => {}}
            onViewMenu={() => setDailyDealOpen(false)}
          />
        )
      )}

      {/* ── Live Chat / Issue reporting ── */}
      {chatOpen && (
        <LiveChatSheet
          order={foodOrders.find(o => o.status === 'delivered' || o.status === 'driver_heading') ?? foodOrders[0] ?? null}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* ── Delivery Chat with Driver ── */}
      {deliveryChatOpen && (() => {
        const CHAT_KEY = `indoo_delivery_chat_${orderConfirm?.id ?? 'current'}`
        const loadMessages = () => {
          try {
            const stored = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]')
            // Clear messages 1 hour after delivery
            const lastOrder = foodOrders.find(o => o.status === 'delivered')
            if (lastOrder?.delivered_at) {
              const deliveredTime = new Date(lastOrder.delivered_at).getTime()
              if (Date.now() - deliveredTime > 3600000) {
                localStorage.removeItem(CHAT_KEY)
                return []
              }
            }
            return stored
          } catch { return [] }
        }
        return <IndooChat
          driverName={driverOnWay?.display_name ?? driverOnWay?.name ?? assignedDriver?.display_name ?? 'Driver'}
          chatKey={CHAT_KEY}
          initialMessages={loadMessages()}
          onClose={() => setDeliveryChatOpen(false)}
        />
      })()}

      {/* ── Promo Banner Page ── */}
      {promoBannerOpen && (
        <PromoBannerPage
          onClose={() => setPromoBannerOpen2(false)}
          onApplyCode={(code) => {
            setPromoCode(code)
            const result = validatePromoCode(code, cartTotal)
            setPromoResult(result)
            if (result.valid) applyPromoCode(code)
            setPromoBannerOpen2(false)
            setCartExpanded(true)
          }}
        />
      )}
    </div>
  )
}
