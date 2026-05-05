import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { getOrCreateQRHash, buildQRPayload } from '@/services/qrCodeService'
import styles from './RestaurantDashboard.module.css'
import { CUISINE_TYPES as CUISINES } from '@/constants/cuisineTypes'
import {
  getRestaurantOrders,
  subscribeToRestaurantOrders,
  ensurePickupCode,
  confirmPaymentReceived,
} from '@/services/foodOrderService'
import PostDealWidget from '@/domains/dealhunt/components/PostDealWidget'
import VendorAnalytics from './VendorAnalytics'
import { FREE_ITEM_BADGES, DAILY_PROMO_TEMPLATES, PROMO_OFFERS, DAYS_OF_WEEK } from '@/constants/restaurantPromos'

const FOOD_CATEGORIES = [
  { id: 'rice',       label: '🍚 Rice Dishes'  },
  { id: 'noodles',    label: '🍜 Noodles'      },
  { id: 'grilled',    label: '🔥 Grilled'       },
  { id: 'burgers',    label: '🍔 Burgers'       },
  { id: 'seafood',    label: '🦐 Seafood'       },
  { id: 'desserts',   label: '🧁 Desserts'      },
  { id: 'drinks',     label: '🥤 Drinks & Juice'},
  { id: 'breakfast',  label: '🌅 Breakfast'     },
  { id: 'snacks',     label: '🍿 Snacks'        },
  { id: 'vegetarian', label: '🥗 Vegetarian'    },
]

const MENU_CATEGORIES = ['Main','Sides','Drinks','Snacks','Desserts']

const EVENT_OPTIONS = [
  { id: 'live_music',     label: '🎵 Live Music'      },
  { id: 'birthday_setup', label: '🎂 Birthday Setup'  },
  { id: 'private_room',   label: '🚪 Private Room'    },
  { id: 'sound_system',   label: '🎤 Sound System'    },
  { id: 'party_package',  label: '🥂 Party Packages'  },
  { id: 'wedding',        label: '💍 Weddings'        },
]

const BANKS = ['BCA','BRI','BNI','Mandiri','BSI','CIMB','Danamon','Permata','Other']

const ORDER_STATUS_LABELS = {
  confirmed:      'Confirmed',
  driver_heading: 'Driver En Route',
  picked_up:      'Picked Up',
  delivered:      'Delivered',
  cancelled:      'Cancelled',
}

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// ── Demo stock photos ─────────────────────────────────────────────────────────
const DEMO_STOCK_PHOTOS = [
  { id: 1,  image_url: null, style_tag: 'Modern & Clean',     price: 100000, restaurant_id: null },
  { id: 2,  image_url: null, style_tag: 'Rustic Warung',      price: 100000, restaurant_id: null },
  { id: 3,  image_url: null, style_tag: 'Night Atmosphere',   price: 100000, restaurant_id: null },
  { id: 4,  image_url: null, style_tag: 'Street Food Energy', price: 100000, restaurant_id: null },
  { id: 5,  image_url: null, style_tag: 'Elegant Dining',     price: 100000, restaurant_id: null },
  { id: 6,  image_url: null, style_tag: 'Garden Setting',     price: 100000, restaurant_id: null },
  { id: 7,  image_url: null, style_tag: 'Bold & Colourful',   price: 100000, restaurant_id: null },
  { id: 8,  image_url: null, style_tag: 'Minimal & Dark',     price: 100000, restaurant_id: null },
  { id: 9,  image_url: null, style_tag: 'Family Kitchen',     price: 100000, restaurant_id: null },
  { id: 10, image_url: null, style_tag: 'Open Air',           price: 100000, restaurant_id: null },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantDashboard({ userId, onClose }) {
  const [restaurant,   setRestaurant]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [geocoding,    setGeocoding]    = useState(false)
  const [tab,          setTab]          = useState('profile')
  const [toast,        setToast]        = useState(null)
  const [stockPhotos,  setStockPhotos]  = useState(DEMO_STOCK_PHOTOS)
  const [buyingPhoto,  setBuyingPhoto]  = useState(null)
  const [dealHuntOpen, setDealHuntOpen] = useState(false)

  // ── Rewards tab fields ──
  const [rewardEnabled,   setRewardEnabled]   = useState(false)
  const [rewardMinOrder,  setRewardMinOrder]  = useState('50000')
  const [rewardDiscount,  setRewardDiscount]  = useState(10)
  const [rewardValidity,  setRewardValidity]  = useState(7)

  // ── Dish badges fields ──
  const [dishBadges,        setDishBadges]        = useState([])
  const [selectedBadgeDish, setSelectedBadgeDish] = useState(null)
  const [selectedBadgeId,   setSelectedBadgeId]   = useState(null)

  // ── Daily specials fields ──
  const [dailySpecials, setDailySpecials] = useState(() =>
    DAILY_PROMO_TEMPLATES.map(t => ({ day: t.day, name: t.name, dishId: '', dishName: '', offerId: '', enabled: true }))
  )

  // ── Happy Hour fields ──
  const [happyHourEnabled, setHappyHourEnabled] = useState(false)
  const [happyHourStart,   setHappyHourStart]   = useState('14:00')
  const [happyHourEnd,     setHappyHourEnd]     = useState('17:00')
  const [happyHourDays,    setHappyHourDays]    = useState(['Monday','Tuesday','Wednesday','Thursday','Friday'])
  const [happyHourDishes,  setHappyHourDishes]  = useState([])
  const [happyHourOffer,   setHappyHourOffer]   = useState('discount_25')

  // ── Profile fields ──
  const [name,           setName]           = useState('')
  const [cuisine,        setCuisine]        = useState('')
  const [category,       setCategory]       = useState('')
  const [address,        setAddress]        = useState('')
  const [phone,          setPhone]          = useState('')
  const [openingHours,   setOpeningHours]   = useState('')
  const [isOpen,         setIsOpen]         = useState(false)
  const [dineInDiscount, setDineInDiscount] = useState('')
  const [description,    setDescription]    = useState('')
  const [heroDishUrl,    setHeroDishUrl]    = useState('')
  const [heroDishName,   setHeroDishName]   = useState('')

  // ── Venue fields ──
  const [priceFrom,    setPriceFrom]    = useState('')
  const [priceTo,      setPriceTo]      = useState('')
  const [minOrder,     setMinOrder]     = useState('')
  const [seating,      setSeating]      = useState('')
  const [catering,     setCatering]     = useState(false)
  const [eventFeatures,setEventFeatures] = useState([])

  // ── Business / payment fields ──
  const [bankName,            setBankName]            = useState('')
  const [bankAccount,         setBankAccount]         = useState('')
  const [bankHolder,          setBankHolder]          = useState('')
  const [qrisImage,            setQrisImage]            = useState(null)
  const [qrisUploading,        setQrisUploading]        = useState(false)
  const [instagram,           setInstagram]           = useState('')
  const [tiktok,              setTiktok]              = useState('')
  const [facebook,            setFacebook]            = useState('')
  const [repeatDiscount,       setRepeatDiscount]       = useState('')
  const [repeatWindowDays,     setRepeatWindowDays]     = useState('3')
  const [acceptsDatingOrders,  setAcceptsDatingOrders]  = useState(false)

  // ── Orders tab ──
  const [foodOrders,   setFoodOrders]   = useState([])
  const [pickupCode,   setPickupCode]   = useState(null)
  const [qrPayload,    setQrPayload]    = useState(null)
  const [qrLoading,    setQrLoading]    = useState(false)
  const [codeLoading,  setCodeLoading]  = useState(false)

  // ── Menu fields ──
  const [menuItems,    setMenuItems]    = useState([])
  const [editingItem,  setEditingItem]  = useState(null)
  const [itemName,     setItemName]     = useState('')
  const [itemDesc,     setItemDesc]     = useState('')
  const [itemPrice,    setItemPrice]    = useState('')
  const [itemPrep,     setItemPrep]     = useState('')
  const [itemCategory, setItemCategory] = useState('Main')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800) }

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase
      .from('restaurants')
      .select('*, menu_items(*)')
      .eq('owner_id', userId)
      .maybeSingle()

    if (data) {
      setRestaurant(data)
      setName(data.name ?? '')
      setCuisine(data.cuisine_type ?? '')
      setCategory(data.category ?? '')
      setAddress(data.address ?? '')
      setPhone(data.phone ?? '')
      setOpeningHours(data.opening_hours ?? '')
      setIsOpen(data.is_open ?? false)
      setDineInDiscount(data.dine_in_discount ? String(data.dine_in_discount) : '')
      setDescription(data.description ?? '')
      setHeroDishUrl(data.hero_dish_url ?? '')
      setHeroDishName(data.hero_dish_name ?? '')
      setPriceFrom(data.price_from ? String(data.price_from) : '')
      setPriceTo(data.price_to ? String(data.price_to) : '')
      setMinOrder(data.min_order ? String(data.min_order) : '')
      setSeating(data.seating_capacity ? String(data.seating_capacity) : '')
      setCatering(data.catering_available ?? false)
      setEventFeatures(data.event_features ?? [])
      setBankName(data.bank_name ?? '')
      setBankAccount(data.bank_account_number ?? '')
      setBankHolder(data.bank_account_holder ?? '')
      setQrisImage(data.qris_image ?? null)
      setInstagram(data.instagram ?? '')
      setTiktok(data.tiktok ?? '')
      setFacebook(data.facebook ?? '')
      setRepeatDiscount(data.repeat_discount_percent ? String(data.repeat_discount_percent) : '')
      setRepeatWindowDays(data.repeat_discount_days ? String(data.repeat_discount_days) : '3')
      setAcceptsDatingOrders(data.accepts_dating_orders ?? false)
      setMenuItems(data.menu_items ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  // ── Load reward settings from localStorage ──
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`indoo_reward_settings_${userId}`) || 'null')
      if (saved) {
        setRewardEnabled(saved.enabled ?? false)
        setRewardMinOrder(saved.minOrder ? String(saved.minOrder) : '50000')
        setRewardDiscount(saved.discount ?? 10)
        setRewardValidity(saved.validity ?? 7)
      }
    } catch { /* ignore */ }

    // Load dish badges
    try {
      const savedBadges = JSON.parse(localStorage.getItem(`indoo_dish_badges_${userId}`) || '[]')
      if (savedBadges.length) setDishBadges(savedBadges)
    } catch { /* ignore */ }

    // Load daily specials
    try {
      const savedSpecials = JSON.parse(localStorage.getItem(`indoo_daily_specials_${userId}`) || 'null')
      if (savedSpecials) setDailySpecials(savedSpecials)
      const savedHappy = JSON.parse(localStorage.getItem(`indoo_happy_hour_${userId}`) || 'null')
      if (savedHappy) {
        setHappyHourEnabled(savedHappy.enabled ?? false)
        setHappyHourStart(savedHappy.start ?? '14:00')
        setHappyHourEnd(savedHappy.end ?? '17:00')
        setHappyHourDays(savedHappy.days ?? ['Monday','Tuesday','Wednesday','Thursday','Friday'])
        setHappyHourDishes(savedHappy.dishes ?? [])
        setHappyHourOffer(savedHappy.offer ?? 'discount_25')
      }
    } catch { /* ignore */ }
  }, [userId])

  useEffect(() => {
    if (!supabase) return
    supabase.from('stock_photos').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data?.length) setStockPhotos(data) })
  }, [])

  // ── Load orders + pickup code when Orders tab is opened ───────────────────
  useEffect(() => {
    if (tab !== 'orders' || !restaurant?.id) return
    getRestaurantOrders(restaurant.id).then(setFoodOrders)
    // Generate QR code
    setQrLoading(true)
    getOrCreateQRHash(restaurant.id).then(hash => {
      setQrPayload(buildQRPayload(restaurant.id, hash))
      setQrLoading(false)
    }).catch(() => setQrLoading(false))
    if (!restaurant.pickup_code) {
      setCodeLoading(true)
      ensurePickupCode(restaurant.id).then(code => {
        setPickupCode(code)
        setRestaurant(prev => ({ ...prev, pickup_code: code }))
        setCodeLoading(false)
      })
    } else {
      setPickupCode(restaurant.pickup_code)
    }
    const unsub = subscribeToRestaurantOrders(restaurant.id, updated => {
      setFoodOrders(prev => {
        const idx = prev.findIndex(o => o.id === updated.id)
        if (idx === -1) return [updated, ...prev]
        const next = [...prev]; next[idx] = updated; return next
      })
    })
    return unsub
  }, [tab, restaurant?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-geocode address → lat/lng ────────────────────────────────────────
  const geocodeAddress = async (addr, restaurantId) => {
    if (!addr.trim() || !restaurantId) return
    setGeocoding(true)
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`)
      const data = await res.json()
      if (data?.[0]) {
        const { lat, lon } = data[0]
        await supabase.from('restaurants')
          .update({ lat: parseFloat(lat), lng: parseFloat(lon) })
          .eq('id', restaurantId)
      }
    } catch { /* silent — lat/lng optional */ }
    setGeocoding(false)
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!supabase) return showToast('Not connected')
    setSaving(true)
    const payload = {
      owner_id: userId,
      name, cuisine_type: cuisine, category: category || null,
      address, phone, opening_hours: openingHours,
      is_open: isOpen,
      dine_in_discount: dineInDiscount ? Number(dineInDiscount) : null,
      description,
      hero_dish_url: heroDishUrl || null,
      hero_dish_name: heroDishName || null,
      updated_at: new Date().toISOString(),
    }
    let id = restaurant?.id
    if (id) {
      await supabase.from('restaurants').update(payload).eq('id', id)
    } else {
      const { data } = await supabase.from('restaurants').insert({ ...payload, status: 'pending' }).select().single()
      setRestaurant(data)
      id = data?.id
    }
    geocodeAddress(address, id)
    showToast(restaurant?.id ? 'Profile saved ✓' : 'Application submitted — pending admin approval')
    setSaving(false)
  }

  // ── Save venue ────────────────────────────────────────────────────────────
  const saveVenue = async () => {
    if (!supabase || !restaurant?.id) return showToast('Save profile first')
    setSaving(true)
    await supabase.from('restaurants').update({
      price_from:        priceFrom ? Number(priceFrom) : null,
      price_to:          priceTo   ? Number(priceTo)   : null,
      min_order:         minOrder  ? Number(minOrder)  : null,
      seating_capacity:  seating   ? Number(seating)   : null,
      catering_available: catering,
      event_features:    eventFeatures,
      updated_at:        new Date().toISOString(),
    }).eq('id', restaurant.id)
    showToast('Venue details saved ✓')
    setSaving(false)
  }

  // ── Save business ─────────────────────────────────────────────────────────
  const saveBusiness = async () => {
    if (!supabase || !restaurant?.id) return showToast('Save profile first')
    setSaving(true)
    await supabase.from('restaurants').update({
      bank_name:              bankName    || null,
      bank_account_number:    bankAccount || null,
      bank_account_holder:    bankHolder  || null,
      instagram:              instagram   || null,
      tiktok:                 tiktok      || null,
      facebook:               facebook    || null,
      repeat_discount_percent: repeatDiscount    ? Number(repeatDiscount)    : null,
      repeat_discount_days:    repeatWindowDays  ? Number(repeatWindowDays)  : null,
      accepts_dating_orders:   acceptsDatingOrders,
      qris_image:              qrisImage || null,
      updated_at: new Date().toISOString(),
    }).eq('id', restaurant.id)
    showToast('Business details saved ✓')
    setSaving(false)
  }

  // ── Open/closed toggle ────────────────────────────────────────────────────
  const toggleOpen = async () => {
    const next = !isOpen
    setIsOpen(next)
    if (supabase && restaurant?.id) {
      await supabase.from('restaurants').update({ is_open: next }).eq('id', restaurant.id)
    }
  }

  // ── Menu helpers ──────────────────────────────────────────────────────────
  const openItemEditor = (item = null) => {
    setEditingItem(item ?? {})
    setItemName(item?.name ?? '')
    setItemDesc(item?.description ?? '')
    setItemPrice(item?.price ?? '')
    setItemPrep(item?.prep_time_min ?? '')
    setItemCategory(item?.category ?? 'Main')
  }

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice) return
    if (!supabase || !restaurant?.id) return showToast('Save profile first')
    const payload = {
      restaurant_id: restaurant.id,
      name:          itemName.trim(),
      description:   itemDesc.trim() || null,
      price:         Number(itemPrice),
      prep_time_min: itemPrep ? Number(itemPrep) : null,
      category:      itemCategory,
      is_available:  true,
    }
    if (editingItem?.id) {
      await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
      setMenuItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
    } else {
      const { data } = await supabase.from('menu_items').insert(payload).select().single()
      if (data) setMenuItems(prev => [...prev, data])
    }
    setEditingItem(null)
    showToast('Dish saved ✓')
  }

  const deleteItem = async (id) => {
    if (!supabase) return
    await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(prev => prev.filter(i => i.id !== id))
  }

  const handleConfirmPayment = async (orderId) => {
    await confirmPaymentReceived(orderId)
    setFoodOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o))
    showToast('Payment confirmed — driver notified ✓')
  }

  const toggleItemAvailable = async (item) => {
    const next = !item.is_available
    if (supabase) await supabase.from('menu_items').update({ is_available: next }).eq('id', item.id)
    setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: next } : i))
  }

  const toggleEventFeature = (id) => {
    setEventFeatures(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // ── Stock photo purchase ──────────────────────────────────────────────────
  const handleBuyPhoto = (photo) => {
    if (!restaurant?.id) return showToast('Save your profile first')
    const msg = `Hi, I'd like to purchase the cover photo "${photo.style_tag}" (ID: ${photo.id}) for *${name || 'my restaurant'}* on MAKAN by Indoo.\n\nPayment: Rp 100,000`
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
    setBuyingPhoto(photo.id)
  }

  const statusColor = { pending: '#F59E0B', approved: '#F59E0B', rejected: '#ff6b6b' }

  if (loading) return <div className={styles.screen}><div className={styles.loading}>Loading…</div></div>

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerText}>
          <span className={styles.headerTitle}>Restaurant Dashboard</span>
          {restaurant?.status && (
            <span className={styles.statusPill} style={{ color: statusColor[restaurant.status], borderColor: statusColor[restaurant.status] }}>
              {restaurant.status}
            </span>
          )}
        </div>
      </div>

      {/* ── Open/closed toggle ── */}
      {restaurant?.status === 'approved' && (
        <button className={`${styles.openToggle} ${isOpen ? styles.openToggleOn : styles.openToggleOff}`} onClick={toggleOpen}>
          <span className={styles.openToggleDot} />
          {isOpen ? '🟢 Open — accepting orders' : '🔴 Closed'}
        </button>
      )}

      {restaurant?.status === 'pending' && (
        <div className={styles.pendingNotice}>⏳ Under review — we'll notify you when approved.</div>
      )}

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {[
          { id: 'profile',  label: '🏪 Profile'  },
          { id: 'venue',    label: '🏛 Venue'    },
          { id: 'business', label: '💳 Business' },
          { id: 'menu',     label: '🍽 Menu'     },
          { id: 'photos',   label: '📸 Cover'    },
          { id: 'orders',   label: '📦 Orders'   },
          { id: 'dealhunt', label: '🔥 Deal Hunt' },
          { id: 'rewards',  label: '🎁 Promos' },
          { id: 'analytics', label: '📊 Analytics' },
        ].map(t => (
          <button key={t.id}
            className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      <div className={styles.scroll}>

        {/* ══════════════════════════════════════════════════════════════════════
            PROFILE TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'profile' && (
          <div className={styles.form}>
            <Field label="Restaurant Name *" value={name} onChange={setName} placeholder="e.g. Warung Bu Sari" />

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Cuisine Type</label>
              <select className={styles.select} value={cuisine} onChange={e => setCuisine(e.target.value)}>
                <option value="">Select cuisine…</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Food Category (for browse filtering)</label>
              <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category…</option>
                {FOOD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Full Address * <span className={styles.labelHint}>(used to calculate delivery distance)</span></label>
              <input
                className={styles.input}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Jl. Malioboro 45, Yogyakarta"
              />
              {geocoding && <span className={styles.geocodingNote}>📍 Detecting location…</span>}
            </div>

            <Field label="WhatsApp Number *" value={phone} onChange={setPhone} placeholder="628xxx — include country code, no spaces" type="tel" />
            <Field label="Opening Hours"     value={openingHours} onChange={setOpeningHours} placeholder="e.g. 07:00–22:00" />
            <Field label="Dine-In Discount %" value={dineInDiscount} onChange={setDineInDiscount} placeholder="e.g. 15 — shows on listing card" type="number" />

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Short Description</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What makes your restaurant special? (shown on listing card)"
                rows={3}
              />
            </div>

            <Section title="Hero Dish" hint="The main image shown on your listing card">
              <Field label="Hero Dish Photo URL" value={heroDishUrl} onChange={setHeroDishUrl} placeholder="https://… (link to your dish photo)" />
              <Field label="Hero Dish Name"      value={heroDishName} onChange={setHeroDishName} placeholder="e.g. Nasi Gudeg Komplit" />
            </Section>

            <button className={styles.saveBtn} onClick={saveProfile} disabled={saving || !name.trim() || !phone.trim()}>
              {saving ? 'Saving…' : restaurant?.id ? '💾 Save Profile' : '📝 Submit for Approval'}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VENUE TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'venue' && (
          <div className={styles.form}>
            {!restaurant?.id && <div className={styles.menuLock}>Save your profile first to set venue details.</div>}
            {restaurant?.id && (<>

              <Section title="Pricing">
                <div className={styles.row2}>
                  <Field label="Price From (Rp)" value={priceFrom} onChange={setPriceFrom} placeholder="5000" type="number" />
                  <Field label="Price To (Rp)"   value={priceTo}   onChange={setPriceTo}   placeholder="45000" type="number" />
                </div>
                <Field label="Minimum Order (Rp)" value={minOrder} onChange={setMinOrder} placeholder="20000" type="number" />
              </Section>

              <Section title="Seating & Catering">
                <Field label="Seating Capacity (guests)" value={seating} onChange={setSeating} placeholder="e.g. 40" type="number" />
                <Toggle label="Catering available for external events" value={catering} onChange={setCatering} />
              </Section>

              <Section title="Events & Features" hint="Tick everything your venue offers">
                <div className={styles.checkGrid}>
                  {EVENT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={`${styles.checkPill} ${eventFeatures.includes(opt.id) ? styles.checkPillOn : ''}`}
                      onClick={() => toggleEventFeature(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>

              <button className={styles.saveBtn} onClick={saveVenue} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Venue Details'}
              </button>
            </>)}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BUSINESS TAB — Bank + Socials
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'business' && (
          <div className={styles.form}>
            {!restaurant?.id && <div className={styles.menuLock}>Save your profile first to add payment details.</div>}
            {restaurant?.id && (<>

              <Section title="Bank Transfer Details" hint="Shown to customers after they place an order">
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Bank Name</label>
                  <select className={styles.select} value={bankName} onChange={e => setBankName(e.target.value)}>
                    <option value="">Select bank…</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <Field label="Account Number" value={bankAccount} onChange={setBankAccount} placeholder="e.g. 1234 5678 90" />
                <Field label="Account Holder Name" value={bankHolder} onChange={setBankHolder} placeholder="Name exactly as registered" />

                {bankName && bankAccount && bankHolder && (
                  <div className={styles.bankPreview}>
                    <span className={styles.bankPreviewLabel}>Preview</span>
                    <span className={styles.bankPreviewBank}>{bankName}</span>
                    <span className={styles.bankPreviewNum}>{bankAccount}</span>
                    <span className={styles.bankPreviewHolder}>{bankHolder}</span>
                  </div>
                )}
              </Section>

              <Section title="QRIS Payment Code" hint="Upload your QRIS code so customers can pay you directly via any payment app">
                {qrisImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <img src={qrisImage} alt="QRIS Code" style={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 16, border: '2px solid rgba(141,198,63,0.3)', background: '#fff', padding: 8 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setQrisImage(null)} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                      <label style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Change
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return
                          e.target.value = ''
                          setQrisUploading(true)
                          try {
                            const { uploadImage } = await import('@/lib/uploadImage')
                            const url = await uploadImage(file, 'qris-codes')
                            setQrisImage(url)
                          } catch { showToast('Upload failed') }
                          setQrisUploading(false)
                        }} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', borderRadius: 16, border: '2px dashed rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.04)', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: 36 }}>📱</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{qrisUploading ? 'Uploading...' : 'Upload QRIS Code'}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Works with GoPay, OVO, DANA, ShopeePay, BCA, BRI & all banks</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return
                      e.target.value = ''
                      setQrisUploading(true)
                      try {
                        const { uploadImage } = await import('@/lib/uploadImage')
                        const url = await uploadImage(file, 'qris-codes')
                        setQrisImage(url)
                      } catch { showToast('Upload failed') }
                      setQrisUploading(false)
                    }} />
                  </label>
                )}
              </Section>

              <Section title="Repeat Order Discount" hint="Shown on your listing — rewards customers who return within the window">
                <div className={styles.row2}>
                  <Field label="Discount %" value={repeatDiscount} onChange={setRepeatDiscount} placeholder="e.g. 10" type="number" />
                  <Field label="Within (days)" value={repeatWindowDays} onChange={setRepeatWindowDays} placeholder="3" type="number" />
                </div>
                {repeatDiscount && (
                  <div className={styles.repeatPreview}>
                    🔁 Order again within {repeatWindowDays || 3} days — get {repeatDiscount}% off
                  </div>
                )}
              </Section>

              <Section title="Social Media" hint="Shown in the Follow Us panel on your menu page">
                <Field label="Instagram username" value={instagram} onChange={setInstagram} placeholder="e.g. warungbusari (no @)" />
                <Field label="TikTok username"    value={tiktok}   onChange={setTiktok}   placeholder="e.g. warungbusari (no @)" />
                <Field label="Facebook page"      value={facebook}  onChange={setFacebook}  placeholder="e.g. warungbusari" />
              </Section>

              <Section title="Dating Orders" hint="Accept food orders from dating app users">
                {!(bankName && bankAccount && bankHolder) ? (
                  <div className={styles.menuLock} style={{ margin: 0 }}>
                    Fill in your bank details above to enable dating orders
                  </div>
                ) : (
                  <>
                    <Toggle
                      label="Accept orders from dating profiles"
                      value={acceptsDatingOrders}
                      onChange={setAcceptsDatingOrders}
                    />
                    {acceptsDatingOrders && (
                      <div className={styles.datingOrdersNote}>
                        💕 Your restaurant will appear in the dating food section. Customers pay you directly via bank transfer before the driver is dispatched. You pay the driver cash on collection.
                      </div>
                    )}
                  </>
                )}
              </Section>

              <button className={styles.saveBtn} onClick={saveBusiness} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Business Details'}
              </button>
            </>)}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MENU TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'menu' && (
          <div className={styles.menuSection}>
            {!restaurant?.id
              ? <div className={styles.menuLock}>Save your profile first to manage menu items.</div>
              : (<>
                  <button className={styles.addItemBtn} onClick={() => openItemEditor(null)}>+ Add Dish</button>

                  {menuItems.length === 0 && (
                    <div className={styles.menuEmpty}>No dishes yet — add your first item above.</div>
                  )}

                  {menuItems.map(item => (
                    <div key={item.id} className={`${styles.menuItemRow} ${!item.is_available ? styles.menuItemRowOff : ''}`}>
                      <div className={styles.menuItemInfo}>
                        <span className={styles.menuItemName}>{item.name}</span>
                        <span className={styles.menuItemMeta}>
                          {fmtRp(item.price)}
                          {item.prep_time_min ? ` · ⏱ ${item.prep_time_min} min` : ''}
                          {item.category ? ` · ${item.category}` : ''}
                        </span>
                        {item.description && <span className={styles.menuItemDesc}>{item.description}</span>}
                      </div>
                      <div className={styles.menuItemActions}>
                        <button
                          className={`${styles.availBtn} ${item.is_available ? styles.availBtnOn : styles.availBtnOff}`}
                          onClick={() => toggleItemAvailable(item)}
                        >
                          {item.is_available ? 'Available' : 'Sold Out'}
                        </button>
                        <button className={styles.editBtn}   onClick={() => openItemEditor(item)}>Edit</button>
                        <button className={styles.deleteBtn} onClick={() => deleteItem(item.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </>)
            }
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            COVER PHOTOS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'photos' && (
          <div className={styles.photosSection}>
            <div className={styles.currentCover}>
              {restaurant?.cover_url
                ? <img src={restaurant.cover_url} alt="Current cover" className={styles.currentCoverImg} />
                : <div className={styles.currentCoverEmpty}>
                    <span>No cover photo yet</span>
                    <span className={styles.currentCoverSub}>Your listing uses a plain background</span>
                  </div>
              }
            </div>

            <div className={styles.photosPitch}>
              <p className={styles.photosPitchTitle}>Stand out with a professional cover</p>
              <p className={styles.photosPitchSub}>Each photo is exclusive — once you buy it, no other restaurant can use it. Pay once, yours forever.</p>
            </div>

            <div className={styles.priceCallout}>
              <span className={styles.priceCalloutAmount}>Rp 100.000</span>
              <span className={styles.priceCalloutLabel}>per photo · one-time · exclusive</span>
            </div>

            <div className={styles.photoGrid}>
              {stockPhotos.map(photo => {
                const isMine    = photo.restaurant_id === restaurant?.id
                const isTaken   = photo.restaurant_id && !isMine
                const isPending = buyingPhoto === photo.id
                return (
                  <div key={photo.id} className={`${styles.photoCard} ${isTaken ? styles.photoCardTaken : ''} ${isMine ? styles.photoCardMine : ''}`}>
                    <div className={styles.photoThumb}>
                      {photo.image_url
                        ? <img src={photo.image_url} alt={photo.style_tag} className={styles.photoThumbImg} />
                        : <div className={styles.photoThumbPlaceholder}><span className={styles.photoThumbIcon}>🖼</span></div>
                      }
                      {isTaken && <div className={styles.soldOverlay}><span className={styles.soldText}>Sold</span></div>}
                      {isMine  && <div className={styles.mineBadge}>✓ Your Photo</div>}
                    </div>
                    <div className={styles.photoInfo}>
                      <span className={styles.photoStyle}>{photo.style_tag}</span>
                      {!isTaken && !isMine && (
                        <button
                          className={`${styles.buyBtn} ${isPending ? styles.buyBtnPending : ''}`}
                          onClick={() => handleBuyPhoto(photo)}
                        >
                          {isPending ? 'Request sent ✓' : 'Buy — Rp 100k'}
                        </button>
                      )}
                      {isMine && <span className={styles.ownedLabel}>Active on your listing</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className={styles.photosNote}>
              Tap Buy → WhatsApp request sent to our team → we confirm payment and activate within 24 hours.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ORDERS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'orders' && (
          <div className={styles.form}>
            {!restaurant?.id
              ? <div className={styles.menuLock}>Save your profile first.</div>
              : (<>
                  {/* ── Pickup code card ── */}
                  <div className={styles.pickupCodeCard}>
                    <div className={styles.pickupCodeHeader}>
                      <span className={styles.pickupCodeTitle}>🔐 Pickup QR Code</span>
                      <span className={styles.pickupCodeHint}>Driver scans this when collecting an order</span>
                    </div>
                    {qrLoading ? (
                      <div className={styles.pickupCodeValue}>Generating QR…</div>
                    ) : qrPayload ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <QRCodeCanvas value={qrPayload} size={180} bgColor="#ffffff" fgColor="#000000" level="H" style={{ borderRadius: 12, padding: 8, background: '#fff' }} />
                        <button onClick={() => {
                          const canvas = document.querySelector('.qr-download-target canvas')
                          if (canvas) { const a = document.createElement('a'); a.download = `indoo-qr-${restaurant.id}.png`; a.href = canvas.toDataURL(); a.click() }
                        }} style={{ padding: '8px 20px', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Download QR
                        </button>
                      </div>
                    ) : (
                      <div className={styles.pickupCodeValue}>{pickupCode ?? '—'}</div>
                    )}
                    <p className={styles.pickupCodeNote}>
                      Print this QR and place it on your counter. The driver scans it to confirm pickup.
                    </p>
                    {pickupCode && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Backup code: {pickupCode}</p>}
                  </div>

                  {/* ── Incoming orders ── */}
                  <div className={styles.sectionHeader} style={{ marginTop: 8 }}>
                    <span className={styles.sectionTitle}>Incoming Orders</span>
                    <span className={styles.sectionHint}>Live · auto-refreshes</span>
                  </div>

                  {foodOrders.length === 0 && (
                    <div className={styles.menuEmpty}>No orders yet today.</div>
                  )}

                  {foodOrders.map(order => (
                    <div key={order.id} className={styles.orderRow}>
                      <div className={styles.orderRowTop}>
                        <span className={styles.orderRef}>{order.cash_ref}</span>
                        <span className={`${styles.orderStatus} ${styles['orderStatus_' + order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <div className={styles.orderItems}>
                        {(order.items ?? []).map((it, i) => (
                          <span key={i} className={styles.orderItem}>{it.qty}× {it.name}</span>
                        ))}
                      </div>
                      <div className={styles.orderMeta}>
                        <span>Driver: <strong>{order.driver_name ?? '—'}</strong></span>
                        <span>{fmtRp(order.subtotal ?? 0)} subtotal</span>
                      </div>

                      {/* Payment proof + confirm button */}
                      {order.status === 'payment_submitted' && (
                        <div className={styles.paymentProofRow}>
                          {order.payment_screenshot_url && (
                            <a
                              href={order.payment_screenshot_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.proofLink}
                            >
                              📸 View transfer screenshot
                            </a>
                          )}
                          <button
                            className={styles.confirmPaymentBtn}
                            onClick={() => handleConfirmPayment(order.id)}
                          >
                            ✓ Payment Received — Release to Driver
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>)
            }
          </div>
        )}

      </div>

      {/* ── Dish editor modal ── */}
      {editingItem !== null && (
        <div className={styles.modalBackdrop} onClick={() => setEditingItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editingItem?.id ? 'Edit Dish' : 'New Dish'}</h3>
            <Field label="Dish Name *"     value={itemName}  onChange={setItemName}  placeholder="e.g. Nasi Gudeg Komplit" />
            <Field label="Description"     value={itemDesc}  onChange={setItemDesc}  placeholder="Short description of the dish" />
            <Field label="Price (Rp) *"    value={itemPrice} onChange={setItemPrice} placeholder="25000" type="number" />
            <Field label="Prep Time (min)" value={itemPrep}  onChange={setItemPrep}  placeholder="e.g. 15" type="number" />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.saveBtn}   onClick={saveItem} disabled={!itemName.trim() || !itemPrice}>Save Dish</button>
              <button className={styles.cancelBtn} onClick={() => setEditingItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deal Hunt tab ── */}
      {tab === 'dealhunt' && (
        <div className={styles.form} style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🔥</span>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>Deal Hunt</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 280 }}>Post time-limited deals from your menu. Attract new customers with exclusive discounts.</p>
          <button onClick={() => setDealHuntOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.4)' }}>
            🔥 Post a Deal
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REWARDS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'rewards' && (
        <div className={styles.form} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 40 }}>🎁</span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '6px 0 2px' }}>Auto Reward Vouchers</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Automatically send eat-in discount vouchers to customers after they complete an order</p>
          </div>

          {/* Toggle */}
          <Toggle label="Auto-send eat-in voucher after orders" value={rewardEnabled} onChange={setRewardEnabled} />

          {rewardEnabled && (<>
            {/* Minimum order */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Minimum order amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Rp</span>
                <input
                  className={styles.input}
                  type="number"
                  value={rewardMinOrder}
                  onChange={e => setRewardMinOrder(e.target.value)}
                  placeholder="50000"
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            {/* Discount tier cards */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Select discount tier</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { pct: 10, img: 'https://ik.imagekit.io/nepgaxllc/Untitledcccc-removebg-preview.png?updatedAt=1775721239226' },
                  { pct: 15, img: 'https://ik.imagekit.io/nepgaxllc/dsasdasdasdasaaaaaa-removebg-preview.png?updatedAt=1775721303992' },
                  { pct: 20, img: 'https://ik.imagekit.io/nepgaxllc/Untitledbbbbbbbbbbb-removebg-preview.png?updatedAt=1775721392211' },
                  { pct: 25, img: 'https://ik.imagekit.io/nepgaxllc/Untitledxcvzcvzxcvzxc-removebg-preview.png?updatedAt=1775721470030' },
                ].map(tier => (
                  <button
                    key={tier.pct}
                    onClick={() => setRewardDiscount(tier.pct)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: rewardDiscount === tier.pct ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      padding: 8,
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <img src={tier.img} alt={`${tier.pct}% off`} style={{ width: '100%', height: 100, objectFit: 'contain', borderRadius: 10 }} />
                    <span style={{ fontSize: 15, fontWeight: 900, color: rewardDiscount === tier.pct ? '#8DC63F' : 'rgba(255,255,255,0.6)' }}>{tier.pct}% Off</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voucher validity */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Voucher validity</label>
              <select className={styles.select} value={rewardValidity} onChange={e => setRewardValidity(Number(e.target.value))}>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
              </select>
            </div>

            {/* Preview */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Preview</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                🎁 Thank you! Here's a reward from {name || 'Your Restaurant'}
              </div>
              <img
                src={{
                  10: 'https://ik.imagekit.io/nepgaxllc/Untitledcccc-removebg-preview.png?updatedAt=1775721239226',
                  15: 'https://ik.imagekit.io/nepgaxllc/dsasdasdasdasaaaaaa-removebg-preview.png?updatedAt=1775721303992',
                  20: 'https://ik.imagekit.io/nepgaxllc/Untitledbbbbbbbbbbb-removebg-preview.png?updatedAt=1775721392211',
                  25: 'https://ik.imagekit.io/nepgaxllc/Untitledxcvzcvzxcvzxc-removebg-preview.png?updatedAt=1775721470030',
                }[rewardDiscount]}
                alt={`${rewardDiscount}% off`}
                style={{ width: '85%', maxWidth: 260, borderRadius: 14, objectFit: 'contain' }}
              />
              <div style={{
                padding: '10px 16px', borderRadius: 12,
                background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)',
                textAlign: 'center', width: '85%', maxWidth: 260,
              }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{rewardDiscount}% Off Eat-In</div>
                <div style={{
                  margin: '6px 0', padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(141,198,63,0.4)',
                  fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#fff',
                  letterSpacing: '0.1em',
                }}>EATIN-XXXXXX</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  Valid for {rewardValidity} days after order
                </div>
              </div>
            </div>
          </>)}

          {/* Save button */}
          <button
            onClick={() => {
              const settings = {
                enabled: rewardEnabled,
                minOrder: Number(rewardMinOrder) || 50000,
                discount: rewardDiscount,
                validity: rewardValidity,
              }
              localStorage.setItem(`indoo_reward_settings_${userId}`, JSON.stringify(settings))
              showToast('Reward settings saved ✓')
            }}
            style={{
              padding: '14px 28px', borderRadius: 14,
              background: '#8DC63F', border: 'none',
              color: '#000', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
              opacity: 1,
            }}
          >
            💾 Save Reward Settings
          </button>

          {/* ── Separator ── */}
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: FREE ITEM BADGES
          ══════════════════════════════════════════════════════════════════ */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 40 }}>🏷</span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '6px 0 2px' }}>Free Item Badges</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Attach a free item badge to a specific dish</p>
          </div>

          {/* Step 1: Select a dish */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Step 1: Select a dish</label>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0',
              WebkitOverflowScrolling: 'touch',
            }}>
              {menuItems.length === 0 && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No menu items yet — add dishes in the Menu tab first.</span>
              )}
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBadgeDish(item)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    background: selectedBadgeDish?.id === item.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedBadgeDish?.id === item.id ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.08)',
                    color: selectedBadgeDish?.id === item.id ? '#8DC63F' : 'rgba(255,255,255,0.6)',
                    fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                    transition: 'border-color 0.2s, color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select a badge */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Step 2: Select a badge</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
              {FREE_ITEM_BADGES.map(badge => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadgeId(badge.id)}
                  style={{
                    background: selectedBadgeId === badge.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedBadgeId === badge.id ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: 8, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <img src={badge.image} alt={badge.label} style={{ width: '100%', height: 70, objectFit: 'contain', borderRadius: 10 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: selectedBadgeId === badge.id ? '#8DC63F' : 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{badge.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Apply badge */}
          <button
            onClick={() => {
              if (!selectedBadgeDish || !selectedBadgeId) return showToast('Select both a dish and a badge')
              const already = dishBadges.find(b => b.dishId === selectedBadgeDish.id && b.badgeId === selectedBadgeId)
              if (already) return showToast('Badge already applied to this dish')
              const next = [...dishBadges, { dishId: selectedBadgeDish.id, dishName: selectedBadgeDish.name, badgeId: selectedBadgeId }]
              setDishBadges(next)
              localStorage.setItem(`indoo_dish_badges_${userId}`, JSON.stringify(next))
              setSelectedBadgeDish(null)
              setSelectedBadgeId(null)
              showToast('Badge applied ✓')
            }}
            disabled={!selectedBadgeDish || !selectedBadgeId}
            style={{
              padding: '12px 24px', borderRadius: 14,
              background: selectedBadgeDish && selectedBadgeId ? '#8DC63F' : 'rgba(255,255,255,0.08)',
              border: 'none',
              color: selectedBadgeDish && selectedBadgeId ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: selectedBadgeDish && selectedBadgeId ? '0 4px 20px rgba(141,198,63,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Apply Badge
          </button>

          {/* Currently assigned badges */}
          {dishBadges.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <label className={styles.label}>Assigned Badges</label>
              {dishBadges.map((entry, idx) => {
                const badge = FREE_ITEM_BADGES.find(b => b.id === entry.badgeId)
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '8px 12px',
                  }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{entry.dishName}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>→</span>
                    {badge && <img src={badge.image} alt={badge.label} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />}
                    <button
                      onClick={() => {
                        const next = dishBadges.filter((_, i) => i !== idx)
                        setDishBadges(next)
                        localStorage.setItem(`indoo_dish_badges_${userId}`, JSON.stringify(next))
                        showToast('Badge removed')
                      }}
                      style={{
                        background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)',
                        borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                        color: '#ff6b6b', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Separator ── */}
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: DAILY SPECIALS
          ══════════════════════════════════════════════════════════════════ */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 40 }}>📅</span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '6px 0 2px' }}>Daily Specials</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Set a different promo for each day of the week — runs every week</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {dailySpecials.map((spec, idx) => {
              const template = DAILY_PROMO_TEMPLATES.find(t => t.day === spec.day)
              return (
                <div key={spec.day} style={{
                  background: spec.enabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: spec.enabled ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 14, padding: 12,
                  display: 'flex', flexDirection: 'column', gap: 8,
                  opacity: spec.enabled ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}>
                  {/* Row 1: Day label + toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
                      {template?.emoji} {spec.day}
                    </span>
                    <button
                      onClick={() => {
                        const next = [...dailySpecials]
                        next[idx] = { ...next[idx], enabled: !next[idx].enabled }
                        setDailySpecials(next)
                      }}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: spec.enabled ? '#8DC63F' : 'rgba(255,255,255,0.15)',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, left: spec.enabled ? 23 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>

                  {/* Row 2: Promo name input */}
                  <input
                    value={spec.name}
                    onChange={e => {
                      const next = [...dailySpecials]
                      next[idx] = { ...next[idx], name: e.target.value }
                      setDailySpecials(next)
                    }}
                    placeholder="Promo name"
                    className={styles.input}
                    style={{ fontSize: 13 }}
                  />

                  {/* Row 3: Dish dropdown + Offer dropdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select
                      className={styles.select}
                      value={spec.dishId}
                      onChange={e => {
                        const dish = menuItems.find(m => String(m.id) === e.target.value)
                        const next = [...dailySpecials]
                        next[idx] = { ...next[idx], dishId: e.target.value, dishName: dish?.name || '' }
                        setDailySpecials(next)
                      }}
                      style={{ fontSize: 12 }}
                    >
                      <option value="">Select dish...</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>

                    <select
                      className={styles.select}
                      value={spec.offerId}
                      onChange={e => {
                        const next = [...dailySpecials]
                        next[idx] = { ...next[idx], offerId: e.target.value }
                        setDailySpecials(next)
                      }}
                      style={{ fontSize: 12 }}
                    >
                      <option value="">Select offer...</option>
                      {PROMO_OFFERS.map(offer => (
                        <option key={offer.id} value={offer.id}>{offer.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save Daily Specials */}
          <button
            onClick={() => {
              localStorage.setItem(`indoo_daily_specials_${userId}`, JSON.stringify(dailySpecials))
              showToast('Daily specials saved ✓')
            }}
            style={{
              padding: '14px 28px', borderRadius: 14,
              background: '#8DC63F', border: 'none',
              color: '#000', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
            }}
          >
            💾 Save Daily Specials
          </button>

          {/* ── Section 4: Happy Hour ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 20, paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>⏰ Happy Hour</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Time-based discounts on selected dishes</p>
              </div>
              <button onClick={() => setHappyHourEnabled(e => !e)} style={{ width: 48, height: 28, borderRadius: 14, background: happyHourEnabled ? '#8DC63F' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 2, left: happyHourEnabled ? 22 : 2, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>

            {happyHourEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Time window */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Start</label>
                    <input type="time" value={happyHourStart} onChange={e => setHappyHourStart(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, marginTop: 18 }}>→</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>End</label>
                    <input type="time" value={happyHourEnd} onChange={e => setHappyHourEnd(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
                  </div>
                </div>

                {/* Active days */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Active Days</label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {DAYS_OF_WEEK.map(day => (
                      <button key={day} onClick={() => setHappyHourDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} style={{ padding: '6px 10px', borderRadius: 8, background: happyHourDays.includes(day) ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${happyHourDays.includes(day) ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.08)'}`, color: happyHourDays.includes(day) ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offer type */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Discount / Offer</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PROMO_OFFERS.slice(0, 6).map(o => (
                      <button key={o.id} onClick={() => setHappyHourOffer(o.id)} style={{ padding: '6px 12px', borderRadius: 8, background: happyHourOffer === o.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${happyHourOffer === o.id ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.08)'}`, color: happyHourOffer === o.id ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select dishes */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Select Dishes (tap to toggle)</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
                    {menuItems.map(item => (
                      <button key={item.id} onClick={() => setHappyHourDishes(prev => prev.includes(item.id) ? prev.filter(d => d !== item.id) : [...prev, item.id])} style={{ padding: '6px 10px', borderRadius: 8, background: happyHourDishes.includes(item.id) ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${happyHourDishes.includes(item.id) ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`, color: happyHourDishes.includes(item.id) ? '#FFD700' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {item.name}
                      </button>
                    ))}
                    {menuItems.length === 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Add menu items first</span>}
                  </div>
                </div>

                {/* Save */}
                <button onClick={() => {
                  localStorage.setItem(`indoo_happy_hour_${userId}`, JSON.stringify({ enabled: true, start: happyHourStart, end: happyHourEnd, days: happyHourDays, dishes: happyHourDishes, offer: happyHourOffer }))
                  showToast('Happy hour saved ✓')
                }} style={{ padding: '14px 28px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.4)' }}>
                  ⏰ Save Happy Hour
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ANALYTICS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className={styles.form} style={{ padding: 16 }}>
          <VendorAnalytics restaurantId={restaurant?.id} userId={userId} />
        </div>
      )}

      <PostDealWidget open={dealHuntOpen} onClose={() => setDealHuntOpen(false)} domain="food" sellerItems={[]} sellerId={userId} sellerName={name || 'Seller'} />

      {/* ── Toast ── */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}

// ── Reusable components ───────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function Section({ title, hint, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
        {hint && <span className={styles.sectionHint}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <button
        className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  )
}
