import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import AdminDashboard from './AdminDashboard'
import ActivatePage from './ActivatePage'
import { useAppLocale, LANGUAGES } from './i18n'
import imgError from './imgFallback'
import { FOOD_TYPES, THEME_PRESETS } from '@shared/themes/productsThemes'
import { SUPPORTED_GATEWAYS, ID_BANKS } from '@shared/constants/paymentGateways'
import { S } from '@shared/constants/styles'
import { DEMO_MENU } from '@shared/data/productsDemoMenu'
import { haversineKm, adjustColor, fmt, loadJSON, saveJSON } from '@shared/utils/helpers'
import { PLACEHOLDER_SM, PLACEHOLDER_LG, ACCENT_PALETTE, SHOP_LAT, SHOP_LON } from '@shared/constants/placeholders'
import { DELIVERY_DEFAULTS, buildDeliveryZones, DEFAULT_DELIVERY_ZONES, getDeliveryDefaults, getDeliveryFee } from '@shared/delivery/delivery'

/* ─── Supabase Vendor Service (ProductsLocal module) ─── */
const MODULE = 'products'

async function vendorSignup(phone, password, name) {
  if (!supabase) return { id: 'local-' + Date.now(), slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') }
  const { data, error } = await supabase.from('vendor_accounts').insert({
    phone: phone.replace(/[^0-9]/g, ''),
    password_hash: password, // In production, hash this
    shop_name: name,
    shop_phone: phone.replace(/[^0-9]/g, ''),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30),
    module: MODULE,
  }).select().single()
  if (error) throw new Error(error.message)
  return data
}

async function vendorLogin(phone, password) {
  if (!supabase) return null
  const { data } = await supabase.from('vendor_accounts')
    .select('*')
    .eq('phone', phone.replace(/[^0-9]/g, ''))
    .eq('password_hash', password)
    .eq('module', MODULE)
    .single()
  return data || null
}

async function updateVendorConfig(vendorId, config) {
  if (!supabase || !vendorId || String(vendorId).startsWith('local')) return
  await supabase.from('vendor_accounts').update(config).eq('id', vendorId)
}

async function getVendorBySlug(slug) {
  if (!supabase) return null
  const { data } = await supabase.from('vendor_accounts').select('*').eq('slug', slug).eq('module', MODULE).single()
  return data
}

async function getVendorMenuItems(vendorId) {
  if (!supabase || !vendorId) return []
  const { data } = await supabase.from('vendor_menu_items').select('*').eq('vendor_id', vendorId).eq('available', true).order('sort_order')
  return data || []
}

async function saveMenuItem(vendorId, item) {
  if (!supabase || !vendorId || String(vendorId).startsWith('local')) return item
  if (item.supabaseId) {
    await supabase.from('vendor_menu_items').update({
      name: item.name, price: item.price, description: item.desc,
      category: item.category, photo_url: item.photo, available: item.available,
      promo_price: item.promoPrice, prep_time: item.prepTime,
      spice: item.spice, halal: item.halal, popular: item.popular,
    }).eq('id', item.supabaseId)
    return item
  }
  const { data } = await supabase.from('vendor_menu_items').insert({
    vendor_id: vendorId, name: item.name, price: item.price,
    description: item.desc, category: item.category, photo_url: item.photo,
    available: item.available !== false,
    promo_price: item.promoPrice, prep_time: item.prepTime,
    spice: item.spice, halal: item.halal, popular: item.popular,
  }).select().single()
  return { ...item, supabaseId: data?.id }
}

async function deleteMenuItemSupa(itemId) {
  if (!supabase || !itemId) return
  await supabase.from('vendor_menu_items').delete().eq('id', itemId)
}

async function uploadMenuImage(vendorId, file) {
  if (!supabase) return null
  const ext = 'jpg'
  const path = `vendor-menu/${vendorId}/${Date.now()}.${ext}`
  // Compress first
  const compressed = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 600
        let w = img.width, h = img.height
        if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(resolve, 'image/jpeg', 0.7)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
  const { error } = await supabase.storage.from('images').upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
  if (error) return null
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data?.publicUrl || null
}

/* ─── Food Type Categories — imported from @shared/themes/productsThemes ─── */
const FOOD_TYPE_KEYS = Object.keys(FOOD_TYPES)


// Common Indonesian banks (shown in the Bank Transfer setup). Logos sourced from Wikimedia / official.

/* ─── Vendor type presets ─── */
// Picked once at signup. Each type loads its own 6-7 category quick-chips.
// Vendor can still type any custom category. Existing menu items are preserved
// across switches — the preset is suggestions, not enforcement.
const VENDOR_TYPES = {
  fashion: {
    id: 'fashion', label: 'Fashion / Clothing', emoji: '👗',
    tagline: 'Apparel, shoes, accessories',
    categories: ['Tops', 'Bottoms', 'Dresses', 'Shoes', 'Bags', 'Accessories', 'Promo'],
  },
  electronics: {
    id: 'electronics', label: 'Electronics / Tech', emoji: '📱',
    tagline: 'Phones, gadgets, accessories',
    categories: ['Phones', 'Accessories', 'Audio', 'Computers', 'Gaming', 'Cables', 'Promo'],
  },
  grocery: {
    id: 'grocery', label: 'Grocery / Sembako', emoji: '🛒',
    tagline: 'Daily essentials and food items',
    categories: ['Sembako', 'Beverages', 'Snacks', 'Frozen', 'Fresh', 'Household', 'Promo'],
  },
  beauty: {
    id: 'beauty', label: 'Beauty / Cosmetics', emoji: '💄',
    tagline: 'Skincare, makeup, fragrance',
    categories: ['Skincare', 'Makeup', 'Hair Care', 'Fragrance', 'Tools', 'Promo'],
  },
  general: {
    id: 'general', label: 'General / Other', emoji: '🛍️',
    tagline: 'Mixed product retail',
    categories: ['Main', 'Accessories', 'New Arrivals', 'Sale', 'Promo'],
  },
}
const PRODUCT_CATEGORIES = [...new Set(THEME_PRESETS.map(t => t.category))]

/* Per-theme menu sub-categories (max 3, kept short to fit alongside "All" tab without scrolling) */
const THEME_MENU_TABS = {
  clothing:    ['Men', 'Women', 'Kids'],
  shoes:       ['Men', 'Women', 'Kids'],
  raincoats:   ['Men', 'Women', 'Kids'],
  running:     ['Men', 'Women', 'Kids'],
  handbags:    ['Bags', 'Wallets', 'Clutch'],
  hijab:       ['Hijabs', 'Abaya', 'Scarves'],
  batik:       ['Tops', 'Pants', 'Fabric'],
  electronics: ['Phones', 'Audio', 'Accs'],
  comprepair:  ['Phone', 'Laptop', 'Other'],
  phoneacc:    ['Cases', 'Chargers', 'Cables'],
  skincare:    ['Face', 'Body', 'Hair'],
  cosmetics:   ['Face', 'Lips', 'Eyes'],
  perfume:     ['Men', 'Women', 'Unisex'],
  homedecor:   ['Wall', 'Lights', 'Vases'],
  furniture:   ['Living', 'Bed', 'Dining'],
  kitchenware: ['Pots', 'Utensils', 'Plates'],
  packaging:   ['Boxes', 'Bags', 'Tape'],
  handicraft:  ['Decor', 'Gifts', 'Wall'],
  jewelry:     ['Rings', 'Necklace', 'Earring'],
  candles:     ['Jar', 'Pillar', 'Votive'],
  sports:      ['Gym', 'Outdoor', 'Team'],
  baby:        ['Boys', 'Girls', 'Newborn'],
  toys:        ['Boys', 'Girls', 'Both'],
  school:      ['Bags', 'Pens', 'Books'],
  books:       ['Books', 'Pens', 'Notes'],
  motortyres:  ['Sport', 'Touring', 'Scooter'],
  seatcovers:  ['Car', 'Motor', 'Truck'],
  bicycle:     ['Mens', 'Womens', 'Kids'],
  automotive:  ['Inside', 'Outside', 'Parts'],
  pets:        ['Dogs', 'Cats', 'Birds'],
  grocery:     ['Snacks', 'Drinks', 'Pantry'],
  tobacco:     ['Cigars', 'Rolling', 'Accs'],
  herbal:      ['Drinks', 'Powders', 'Capsules'],
  digital:     ['Cards', 'Codes', 'eBooks'],
  general:     ['Home', 'Personal', 'Daily'],
}
/* Legacy food categories — fallback for existing food-themed vendors (e.g. noodle/default) */
const FOOD_MENU_TABS = ['Meal', 'Snack', 'Drink', 'Extra Sauce', 'Dessert']
function getMenuTabsForTheme(themeId) {
  return THEME_MENU_TABS[themeId] || FOOD_MENU_TABS
}

/* Helper: filter themes by country + food type */
function getFilteredThemes(countryCode, foodType, langCountries) {
  // Determine user's country list from detected country or language
  const userCountries = countryCode ? [countryCode] : (langCountries || [])

  // 1. Themes matching the selected food type
  const byFoodType = foodType ? THEME_PRESETS.filter(t => t.foodTypes.includes(foodType)) : []

  // 2. Themes for user's country (popular in your region)
  const byCountry = userCountries.length > 0
    ? THEME_PRESETS.filter(t => t.countries.length === 0 || t.countries.some(c => userCountries.includes(c)))
    : THEME_PRESETS

  // 3. Everything else
  const allIds = new Set([...byFoodType.map(t => t.id), ...byCountry.map(t => t.id)])
  const rest = THEME_PRESETS.filter(t => !allIds.has(t.id))

  return { byFoodType, byCountry, rest }
}

/* ─── Styles ─── */

/* ─── Dev Page ID Badge (renders outside React tree via DOM for guaranteed visibility) ─── */
function DevBadge({ n }) {
  useEffect(() => {
    let el = document.getElementById('dev-page-badge')
    if (!el) {
      el = document.createElement('div')
      el.id = 'dev-page-badge'
      Object.assign(el.style, { position:'fixed', bottom:'8px', left:'8px', width:'28px', height:'28px', borderRadius:'14px', background:'#FFD600', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'900', color:'#1a1a1a', zIndex:'99999', boxShadow:'0 2px 8px rgba(0,0,0,0.4)', pointerEvents:'none', fontFamily:'monospace' })
      document.body.appendChild(el)
    }
    el.textContent = n
  }, [n])
  return null
}

/* ─── Main App ─── */
export default function App() {
  // Route to admin or activate page
  const params = new URLSearchParams(window.location.search)
  const viewMode = params.get('view') || (window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/activate' ? 'activate' : null)

  if (viewMode === 'admin') return <AdminDashboard />
  if (viewMode === 'activate') return <ActivatePage />

  /* --- Auto-healing + Health reporting --- */
  const APP_VERSION = '1.0.0'
  useEffect(() => {
    if (isDemo || isPreview || !supabase) return
    const vid = localStorage.getItem('productslocal_vendorId')
    if (!vid || String(vid).startsWith('local')) return

    // Auto-heal: detect and fix broken states
    const errors = []
    const theme = localStorage.getItem('productslocal_theme')
    const accentColor = localStorage.getItem('productslocal_accentColor')
    const themeBg = localStorage.getItem('productslocal_themeBg')

    // Fix invalid accent color
    if (accentColor && !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      localStorage.setItem('productslocal_accentColor', '#8DC63F')
      errors.push('Invalid accent color reset')
    }
    // Fix missing theme background
    if (theme && theme !== 'custom' && !themeBg) {
      const preset = THEME_PRESETS.find(t => t.id === theme)
      if (preset) { localStorage.setItem('productslocal_themeBg', preset.img); errors.push('Missing theme bg restored') }
    }
    // Fix NaN prices in menu
    try {
      const menu = JSON.parse(localStorage.getItem('productslocal_menu') || '[]')
      let fixed = false
      menu.forEach(item => { if (isNaN(item.price) || item.price < 0) { item.price = 0; fixed = true } })
      if (fixed) { localStorage.setItem('productslocal_menu', JSON.stringify(menu)); errors.push('NaN prices fixed') }
    } catch { errors.push('Corrupt menu JSON') }

    // Check for remote config (force reset, maintenance, announcements)
    supabase.from('vendor_status').select('force_reset, reset_theme, reset_accent').eq('vendor_id', vid).maybeSingle().then(({ data }) => {
      if (data?.force_reset) {
        const newTheme = data.reset_theme || 'noodle'
        const newAccent = data.reset_accent || '#8B0000'
        const preset = THEME_PRESETS.find(t => t.id === newTheme)
        if (preset) {
          localStorage.setItem('productslocal_theme', newTheme)
          localStorage.setItem('productslocal_themeBg', preset.img)
          localStorage.setItem('productslocal_accentColor', newAccent)
          const bgImg = document.getElementById('app-bg-img')
          if (bgImg) bgImg.src = preset.img
          supabase.from('vendor_status').update({ force_reset: false }).eq('vendor_id', vid)
          window.location.reload()
        }
      }
    })

    // Report health
    const menuCount = JSON.parse(localStorage.getItem('productslocal_menu') || '[]').length
    const status = errors.length > 0 ? 'warning' : 'healthy'
    supabase.from('vendor_health_logs').insert({
      vendor_id: vid, status, app_version: APP_VERSION,
      theme_id: theme, accent_color: accentColor, menu_count: menuCount,
      error_message: errors.length > 0 ? errors.join('; ') : null,
      user_agent: navigator.userAgent, screen_width: window.innerWidth,
    })
    // Update vendor status summary
    supabase.from('vendor_status').upsert({
      vendor_id: vid, last_health_check: new Date().toISOString(),
      current_status: status, theme_id: theme, accent_color: accentColor,
      menu_count: menuCount, app_version: APP_VERSION,
      error_count: errors.length, needs_attention: errors.length > 0,
    }, { onConflict: 'vendor_id' })
  }, [])

  /* --- Agent referral tracking --- */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && supabase) {
      // Store ref for attribution on purchase
      localStorage.setItem('sl_agent_ref', ref)
      // Record click
      supabase.from('affiliate_agents').select('id, total_clicks').eq('agent_code', ref).single().then(({ data }) => {
        if (data) {
          supabase.from('affiliate_agents').update({ total_clicks: (data.total_clicks || 0) + 1 }).eq('id', data.id)
        }
      })
    }
  }, [])

  /* --- Demo page setup --- */
  useEffect(() => {
    if (!isDemo || demoPage === 'landing') return
    if (demoPage === 'menu') { setShowLanding(false) }
    if (demoPage === 'item') { setShowLanding(false); setTimeout(() => setItemModal(DEMO_MENU[0]), 100) }
    if (demoPage === 'checkout') { setShowLanding(false); setCart([{ ...DEMO_MENU[0], qty: 2 }, { ...DEMO_MENU[5], qty: 1 }]); setTimeout(() => { setCheckoutOpen(true); setOrderDone(false) }, 100) }
    if (demoPage === 'sent') { setShowLanding(false); setCart([{ ...DEMO_MENU[0], qty: 1 }]); setTimeout(() => { setCheckoutOpen(true); setOrderDone(true) }, 100) }
    if (demoPage === 'visit') { setShowLanding(false); setTimeout(() => setShowLocation(true), 100) }
  }, [])

  /* --- i18n --- */
  const { locale, setLocale, t, nativeLang, countryCode, LANG_TO_COUNTRIES } = useAppLocale()

  /* --- Check vendor activation status for public visitors --- */
  const [publicVendorStatus, setPublicVendorStatus] = useState(null)
  const [publicVendorName, setPublicVendorName] = useState('')
  const [publicVendorLogo, setPublicVendorLogo] = useState('')
  useEffect(() => {
    // Check if this is a vendor's public page (has slug in URL or stored vendor ID)
    const storedId = localStorage.getItem('productslocal_vendorId')
    if (storedId && !String(storedId).startsWith('local') && supabase) {
      supabase.from('vendor_accounts').select('status,shop_name,shop_logo').eq('id', storedId).single().then(({ data }) => {
        if (data) {
          setPublicVendorStatus(data.status || 'pending')
          setPublicVendorName(data.shop_name || '')
          setPublicVendorLogo(data.shop_logo || '')
        }
      })
    }
  }, [])

  /* --- State --- */
  const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true'
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true' // isolated preview — ignores localStorage
  const demoPage = new URLSearchParams(window.location.search).get('page') || 'landing'
  const [showLanding, setShowLanding] = useState(() => {
    if (isDemo) return demoPage === 'landing'
    const id = new URLSearchParams(window.location.search).get('vendor') || localStorage.getItem('productslocal_vendorId') || localStorage.getItem('productslocal_vendor_id')
    return !id
  })
  const [menuItems, setMenuItems] = useState(() => isDemo ? DEMO_MENU : loadJSON('productslocal_menu', DEMO_MENU))
  const [cart, setCart] = useState([])
  const [isVendor, setIsVendor] = useState(() => {
    if (isDemo) return false
    const params = new URLSearchParams(window.location.search)
    const urlVendor = params.get('vendor')
    const urlCity = params.get('city')
    const urlCountry = params.get('country')
    if (urlVendor) {
      localStorage.setItem('productslocal_vendorId', urlVendor)
      localStorage.setItem('productslocal_vendor_id', urlVendor)
      if (urlCity) localStorage.setItem('productslocal_shopCity', urlCity)
      if (urlCountry) localStorage.setItem('productslocal_shopCountry', urlCountry)
      // Auto-set delivery rates for new vendors
      const countryCode = params.get('cc')
      if (countryCode && !localStorage.getItem('productslocal_delRatesSet')) {
        const rates = getDeliveryDefaults(countryCode, urlCity)
        localStorage.setItem('productslocal_delMin', rates.minCharge)
        localStorage.setItem('productslocal_delMinKm', rates.minKm)
        localStorage.setItem('productslocal_delPerKm', rates.perKm)
        localStorage.setItem('productslocal_delMax', rates.maxKm)
        localStorage.setItem('productslocal_delCurrency', rates.currency)
        localStorage.setItem('productslocal_delRatesSet', 'true')
      }
    }
    const id = urlVendor || localStorage.getItem('productslocal_vendorId') || localStorage.getItem('productslocal_vendor_id')
    return !!id
  })
  const [vendorLogin, setVendorLogin] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [itemModal, setItemModal] = useState(null) // item being viewed
  const [modalQty, setModalQty] = useState(1)
  const [modalVariant, setModalVariant] = useState(null)        // picked variant in the item modal
  const [modalModifiers, setModalModifiers] = useState([])      // checked modifiers in the modal
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0)         // primary=0; gallery starts at 1
  // Reset modal selections whenever a new item opens — auto-pick first variant if any
  useEffect(() => {
    if (itemModal) {
      setModalVariant((itemModal.variants && itemModal.variants.length > 0) ? itemModal.variants[0] : null)
      setModalModifiers([])
      setModalPhotoIdx(0)
    }
  }, [itemModal])
  const [editItem, setEditItem] = useState(null) // item being edited by vendor
  const [addingItem, setAddingItem] = useState(false)
  const [shopConfig, setShopConfig] = useState(false) // show shop config
  const [designStudio, setDesignStudio] = useState(false) // show design studio
  const [themeBrowser, setThemeBrowser] = useState(false) // show theme browser
  const [themeSearch, setThemeSearch] = useState('')
  const [themeCountry, setThemeCountry] = useState('all')
  const [themePreviewId, setThemePreviewId] = useState(null)
  const [themePreviewImg, setThemePreviewImg] = useState(null) // active variant image in preview
  const [themePreviewPage, setThemePreviewPage] = useState('landing') // landing | menu
  const [themeCountryDrawer, setThemeCountryDrawer] = useState(false)
  const [showDeliverySettings, setShowDeliverySettings] = useState(false)
  const [domainPage, setDomainPage] = useState(false)
  const [termsOfListing, setTermsOfListing] = useState(false)
  // Payment Methods — vendor connects their OWN gateway accounts. StreetLocal never touches funds.
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)
  const [setupGatewayId, setSetupGatewayId] = useState(null)        // which gateway is being configured
  const [paymentGateways, setPaymentGateways] = useState(() => {
    try { return JSON.parse(localStorage.getItem('productslocal_payment_gateways') || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem('productslocal_payment_gateways', JSON.stringify(paymentGateways)) } catch {}
  }, [paymentGateways])
  const [vendorDrawer, setVendorDrawer] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const urlThemeParam = new URLSearchParams(window.location.search).get('theme')
  const urlThemePreset = urlThemeParam ? THEME_PRESETS.find(t => t.id === urlThemeParam) : null
  const [shopTheme, setShopTheme] = useState(() => urlThemePreset ? urlThemePreset.id : (isDemo || isPreview) ? 'noodle' : (localStorage.getItem('productslocal_theme') || 'default'))
  const [shopAccentColor, setShopAccentColor] = useState(() => urlThemePreset ? urlThemePreset.accent : (isDemo || isPreview) ? '#8B0000' : (localStorage.getItem('productslocal_accentColor') || '#8DC63F'))
  const [themeEditor, setThemeEditor] = useState(null) // { url, posX, posY } or null
  const [editorColor, setEditorColor] = useState('#8DC63F')
  const [editorBaseColor, setEditorBaseColor] = useState('#8DC63F')
  const [editorPos, setEditorPos] = useState({ x: 50, y: 50 }) // percentage position

  // Apply ?theme= param background on mount (only if index.html didn't already via &bg=)
  useEffect(() => {
    const hasBgParam = new URLSearchParams(window.location.search).get('bg')
    if (hasBgParam) return // index.html already set it
    if (urlThemePreset) {
      const bgImg = document.getElementById('app-bg-img')
      if (bgImg) { bgImg.src = urlThemePreset.img; bgImg.style.objectFit = 'fill' }
    }
  }, [])

  // Derive accent color from theme or custom selection
  const accent = shopAccentColor
  const accentLight = accent + '25'
  const accentBorder = accent + '40'
  const isCustomAccent = shopAccentColor !== '#8DC63F'
  const savedBgPos = (() => { try { return JSON.parse(localStorage.getItem('productslocal_bgPos')) } catch { return null } })()
  const bgStyle = shopTheme === 'custom' && savedBgPos ? { objectFit: 'cover', objectPosition: `${savedBgPos.x}% ${savedBgPos.y}%` } : { objectFit: 'fill' }
  const [delBaseFee, setDelBaseFee] = useState(() => parseInt(localStorage.getItem('productslocal_delBase')) || 5000)
  const [delPerKm, setDelPerKm] = useState(() => parseInt(localStorage.getItem('productslocal_delPerKm')) || 2500)
  const [delMinCharge, setDelMinCharge] = useState(() => parseInt(localStorage.getItem('productslocal_delMin')) || 7000)
  const [delMaxKm, setDelMaxKm] = useState(() => parseInt(localStorage.getItem('productslocal_delMax')) || 15)
  const [delFreeAbove, setDelFreeAbove] = useState(() => parseInt(localStorage.getItem('productslocal_delFree')) || 0)
  const [delCurrency, setDelCurrency] = useState(() => localStorage.getItem('productslocal_delCurrency') || 'Rp')
  const [delMinKm, setDelMinKm] = useState(() => parseInt(localStorage.getItem('productslocal_delMinKm')) || 2)
  const [delEnabled, setDelEnabled] = useState(() => localStorage.getItem('productslocal_delEnabled') !== 'false')

  /* Shop info */
  const [shopName, setShopName] = useState(() => localStorage.getItem('productslocal_shopName') || 'Your Store')
  const [shopLogo, setShopLogo] = useState(() => localStorage.getItem('productslocal_shopLogo') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsadaaaa-removebg-preview.png')
  const [shopLogoStyle, setShopLogoStyle] = useState(() => localStorage.getItem('productslocal_logoStyle') || 'circle') // circle | bare | off
  const [heroSize, setHeroSize] = useState(() => localStorage.getItem('productslocal_heroSize') || 'normal') // normal | large | xl
  const [heroFont, setHeroFont] = useState(() => localStorage.getItem('productslocal_heroFont') || 'system') // system | nunito | poppins | playfair | caveat | bebas
  const [heroColor, setHeroColor] = useState(() => localStorage.getItem('productslocal_heroColor') || '#ffffff')
  const [heroSubColor, setHeroSubColor] = useState(() => localStorage.getItem('productslocal_heroSubColor') || '') // empty = auto from heroColor
  const [heroEffect, setHeroEffect] = useState(() => localStorage.getItem('productslocal_heroEffect') || 'shadow') // shadow | glow | runGlow | outline | neon | none
  const [heroEditor, setHeroEditor] = useState(false) // full editor open
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('productslocal_shopPhone') || '6281234567890')
  const [shopOpen, setShopOpen] = useState(() => loadJSON('productslocal_shopOpen', true))
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('productslocal_shopAddress') || 'Jl. Malioboro, Yogyakarta')
  const [shopHours, setShopHours] = useState(() => localStorage.getItem('productslocal_shopHours') || '17:00 – 23:00')
  const defaultSchedule = { mon: { open: '17:00', close: '23:00', off: false }, tue: { open: '17:00', close: '23:00', off: false }, wed: { open: '17:00', close: '23:00', off: false }, thu: { open: '17:00', close: '23:00', off: false }, fri: { open: '17:00', close: '23:00', off: false }, sat: { open: '17:00', close: '23:00', off: false }, sun: { open: '17:00', close: '23:00', off: true } }
  const [shopSchedule, setShopSchedule] = useState(() => loadJSON('productslocal_shopSchedule', defaultSchedule))
  const [shopMapsLink, setShopMapsLink] = useState(() => localStorage.getItem('productslocal_shopMaps') || '')
  const [shopInstagram, setShopInstagram] = useState(() => localStorage.getItem('productslocal_shopIG') || 'lummeenoodles')
  const [shopTiktok, setShopTiktok] = useState(() => localStorage.getItem('productslocal_shopTT') || 'lummeenoodles')
  const [shopFacebook, setShopFacebook] = useState(() => localStorage.getItem('productslocal_shopFB') || 'lummeenoodles')
  const [shopYoutube, setShopYoutube] = useState(() => localStorage.getItem('productslocal_shopYT') || 'lummeenoodles')
  const [shopWebsite, setShopWebsite] = useState(() => localStorage.getItem('productslocal_shopWeb') || 'www.lummeenoodles.com')
  const [shopQris, setShopQris] = useState(() => isDemo ? 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledxzxcczdsasdsadads.png' : (localStorage.getItem('productslocal_shopQris') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledxzxcczdsasdsadads.png'))
  const [shopBio, setShopBio] = useState(() => localStorage.getItem('productslocal_shopBio') || '')
  const [shopCity, setShopCity] = useState(() => localStorage.getItem('productslocal_shopCity') || '')
  const [shopCountry, setShopCountry] = useState(() => localStorage.getItem('productslocal_shopCountry') || '')
  const [shopFoodType, setShopFoodType] = useState(() => localStorage.getItem('productslocal_shopFoodType') || 'General Store')

  /* ─── Customization Features (all optional) ─── */
  const [btnShape, setBtnShape] = useState(() => localStorage.getItem('productslocal_btnShape') || 'rounded')
  const [btnColor, setBtnColor] = useState(() => localStorage.getItem('productslocal_btnColor') || '')
  const [btnText, setBtnText] = useState(() => localStorage.getItem('productslocal_btnText') || '')
  const [btnGlow, setBtnGlow] = useState(() => localStorage.getItem('productslocal_btnGlow') === 'true')
  const [overlayOpacity, setOverlayOpacity] = useState(() => parseInt(localStorage.getItem('productslocal_overlayOpacity')) || 40)
  const [landingLayout, setLandingLayout] = useState(() => localStorage.getItem('productslocal_landingLayout') || 'center')
  const [customTagline, setCustomTagline] = useState(() => localStorage.getItem('productslocal_customTagline') || '')
  const [menuCardStyle, setMenuCardStyle] = useState(() => localStorage.getItem('productslocal_menuCardStyle') || 'horizontal')
  const [menuBanner, setMenuBanner] = useState(() => localStorage.getItem('productslocal_menuBanner') || '')
  const [showClosedBanner, setShowClosedBanner] = useState(() => localStorage.getItem('productslocal_showClosedBanner') === 'true')
  const [promoBanner, setPromoBanner] = useState(() => localStorage.getItem('productslocal_promoBanner') || '')
  const [promoBannerEnabled, setPromoBannerEnabled] = useState(() => localStorage.getItem('productslocal_promoBannerEnabled') === 'true')
  const [splashEnabled, setSplashEnabled] = useState(() => localStorage.getItem('productslocal_splashEnabled') === 'true')
  const [showSplash, setShowSplash] = useState(() => localStorage.getItem('productslocal_splashEnabled') === 'true')
  const [configPreviewTab, setConfigPreviewTab] = useState('landing')
  const [configTool, setConfigTool] = useState(null) // null | 'color' | 'layout' | 'button' | 'text' | 'cards' | 'promo' | 'splash'
  const [configColorRow, setConfigColorRow] = useState('Blue')

  const [showLocation, setShowLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [userDistance, setUserDistance] = useState(null)
  const [showDeals, setShowDeals] = useState(false)
  const [menuView, setMenuView] = useState('all') // 'all' or 'promo'
  const [dailyDeals, setDailyDeals] = useState(() => loadJSON('productslocal_dailyDeals', []))
  const [showCustomers, setShowCustomers] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem('productslocal_installDismissed') === 'true')
  const [customerSearch, setCustomerSearch] = useState('')
  const [promoMsg, setPromoMsg] = useState('')

  /* Checkout form */
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [payMethod, setPayMethod] = useState('cod')
  const [deliveryZones, setDeliveryZones] = useState(DEFAULT_DELIVERY_ZONES)
  const [deliveryZone, setDeliveryZone] = useState(DEFAULT_DELIVERY_ZONES[0])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [orderDone, setOrderDone] = useState(false)

  /* Vendor login form */
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginMode, setLoginMode] = useState('login') // 'login' or 'signup'
  const [signupName, setSignupName] = useState('')
  const [signupCategory, setSignupCategory] = useState('')
  const [vendorId, setVendorId] = useState(() => new URLSearchParams(window.location.search).get('vendor') || localStorage.getItem('productslocal_vendorId') || localStorage.getItem('productslocal_vendor_id') || null)
  const [vendorStatus, setVendorStatus] = useState(null) // 'active' | 'expired' | 'pending'
  const [vendorExpiresAt, setVendorExpiresAt] = useState(null)

  /* Auto-detect user distance */
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineKm(SHOP_LAT, SHOP_LON, pos.coords.latitude, pos.coords.longitude)
        setUserDistance(Math.round(d * 10) / 10)
      },
      () => {}
    )
  }, [])

  /* Load delivery rates from admin settings (Supabase) */
  useEffect(() => {
    if (!supabase) return
    async function loadRates() {
      try {
        const { data } = await supabase.from('admin_settings').select('id,value').in('id', ['delivery_base_fee', 'delivery_per_km', 'delivery_min_charge', 'delivery_max_km', 'delivery_round_to'])
        if (data && data.length > 0) {
          const r = {}
          data.forEach(d => { r[d.id] = Number(d.value) })
          const zones = buildDeliveryZones(r.delivery_base_fee, r.delivery_per_km, r.delivery_min_charge, r.delivery_max_km, r.delivery_round_to)
          setDeliveryZones(zones)
          setDeliveryZone(zones[0])
        }
      } catch (e) { console.warn('Failed to load delivery rates:', e) }
    }
    loadRates()
  }, [])

  /* New / edit item form */
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formPromoPrice, setFormPromoPrice] = useState('')
  const [formPriceMode, setFormPriceMode] = useState('normal')
  const [formSpice, setFormSpice] = useState(0)
  const [formHalal, setFormHalal] = useState(false)
  const [formPopular, setFormPopular] = useState(false)
  const [formCategory, setFormCategory] = useState(() => getMenuTabsForTheme(localStorage.getItem('productslocal_theme') || 'default')[0])
  const [formPhoto, setFormPhoto] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPrepTime, setFormPrepTime] = useState(0)
  // Progressive-disclosure fields — hidden by default, revealed via "+ feature" ghost button
  const [formPhotos, setFormPhotos] = useState([])         // additional photos (primary stays in formPhoto)
  const [formAllergens, setFormAllergens] = useState([])   // array of strings (materials for products)
  const [formDietary, setFormDietary] = useState([])       // array of strings (tags for products)
  const [formPortion, setFormPortion] = useState('')       // "200g" / "Pack of 2"
  const [formStock, setFormStock] = useState('')           // empty = unlimited; number = count
  const [formVariants, setFormVariants] = useState([])     // [{id, name, priceDelta}]
  const [formModifiers, setFormModifiers] = useState([])   // [{id, name, priceDelta}]
  // Which optional sections are expanded in the item form
  const [expandedSections, setExpandedSections] = useState({ photos: false, dietary: false, allergens: false, portion: false, stock: false, variants: false, modifiers: false })
  const toggleSection = (k) => setExpandedSections(p => ({ ...p, [k]: !p[k] }))

  // Shared progressive-disclosure block for both add + edit item forms
  const renderItemOptionalFields = () => (
    <div style={{ padding: '0 14px 4px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Optional details</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'photos', label: '📷 Photos' },
          { key: 'variants', label: '📏 Sizes' },
          { key: 'modifiers', label: '➕ Add-ons' },
          { key: 'allergens', label: '⚠️ Materials' },
          { key: 'dietary', label: '🌱 Tags' },
          { key: 'portion', label: '⚖️ Portion' },
          { key: 'stock', label: '📦 Stock' },
        ].map(opt => (
          <button key={opt.key} type="button" onClick={() => toggleSection(opt.key)} style={{
            background: expandedSections[opt.key] ? (isCustomAccent ? `${accent}30` : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
            border: '1px dashed ' + (expandedSections[opt.key] ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)'),
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            padding: '7px 11px', borderRadius: 12, minHeight: 32,
          }}>{expandedSections[opt.key] ? '−' : '+'} {opt.label}</button>
        ))}
      </div>
      {expandedSections.photos && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Gallery — up to 4 extra photos (primary is above)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {formPhotos.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setFormPhotos(p => p.filter((_, j) => j !== i))} type="button" style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: 11, border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 }}>&times;</button>
              </div>
            ))}
            {formPhotos.length < 4 && (
              <label style={{ width: 64, height: 64, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 24, background: 'rgba(255,255,255,0.02)' }}>
                +
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setFormPhotos(p => [...p, reader.result])
                  reader.readAsDataURL(file)
                }} />
              </label>
            )}
          </div>
        </div>
      )}
      {expandedSections.allergens && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Materials — helps customers with skin sensitivities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Silicone', 'Leather', 'Plastic', 'Wool', 'Cotton', 'Synthetic'].map(a => {
              const isActive = formAllergens.includes(a)
              return (
                <button key={a} type="button" onClick={() => setFormAllergens(p => isActive ? p.filter(x => x !== a) : [...p, a])} style={{
                  background: isActive ? '#EF4444' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.1)'),
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 14, minHeight: 32,
                }}>{a}</button>
              )
            })}
          </div>
        </div>
      )}
      {expandedSections.dietary && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Product tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Halal-certified', 'Eco-friendly', 'Vegan-friendly', 'Fair-trade', 'Hypoallergenic'].map(d => {
              const isActive = formDietary.includes(d)
              return (
                <button key={d} type="button" onClick={() => setFormDietary(p => isActive ? p.filter(x => x !== d) : [...p, d])} style={{
                  background: isActive ? '#22C55E' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.1)'),
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 14, minHeight: 32,
                }}>{d}</button>
              )
            })}
          </div>
        </div>
      )}
      {expandedSections.portion && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Portion / serving size</div>
          <input value={formPortion} onChange={(e) => setFormPortion(e.target.value)} placeholder='e.g. 200g · Pack of 2 · 12oz' style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      )}
      {expandedSections.stock && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Stock — auto-hides item when 0. Leave blank for unlimited.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min={0} value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder='Unlimited' style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', minHeight: 44, boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setFormStock('')} style={{ padding: '0 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: formStock === '' ? `${accent}25` : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Unlimited</button>
          </div>
        </div>
      )}
      {expandedSections.variants && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Sizes / variants — customer picks one. Price delta added to base.</div>
          {formVariants.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={v.name} onChange={(e) => setFormVariants(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder='Name (Small / Large / Regular)' style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <input type="number" value={v.priceDelta} onChange={(e) => setFormVariants(p => p.map((x, j) => j === i ? { ...x, priceDelta: Number(e.target.value) || 0 } : x))} placeholder='+0' style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setFormVariants(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => setFormVariants(p => [...p, { id: 'v_' + Date.now(), name: '', priceDelta: 0 }])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add size</button>
        </div>
      )}
      {expandedSections.modifiers && (
        <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Add-ons / modifiers — customer can pick multiple (each adds to price).</div>
          {formModifiers.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={m.name} onChange={(e) => setFormModifiers(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder='Name (Gift wrap / Extended warranty)' style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <input type="number" value={m.priceDelta} onChange={(e) => setFormModifiers(p => p.map((x, j) => j === i ? { ...x, priceDelta: Number(e.target.value) || 0 } : x))} placeholder='+0' style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setFormModifiers(p => p.filter((_, j) => j !== i))} style={{ width: 34, padding: 0, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(139,0,0,0.4)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => setFormModifiers(p => [...p, { id: 'm_' + Date.now(), name: '', priceDelta: 0 }])} style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add modifier</button>
        </div>
      )}
    </div>
  )

  /* --- Persist to localStorage + sync to Supabase --- */
  useEffect(() => { if (vendorId) localStorage.setItem('productslocal_vendorId', vendorId) }, [vendorId])
  useEffect(() => { saveJSON('productslocal_menu', menuItems) }, [menuItems])
  useEffect(() => { localStorage.setItem('productslocal_shopName', shopName) }, [shopName])
  useEffect(() => { localStorage.setItem('productslocal_shopLogo', shopLogo) }, [shopLogo])
  useEffect(() => { localStorage.setItem('productslocal_logoStyle', shopLogoStyle) }, [shopLogoStyle])
  useEffect(() => { localStorage.setItem('productslocal_heroSize', heroSize) }, [heroSize])
  useEffect(() => { localStorage.setItem('productslocal_heroFont', heroFont) }, [heroFont])
  useEffect(() => {
    if (heroFont !== 'system') {
      const fontMap = { nunito: 'Nunito:wght@700;800;900', poppins: 'Poppins:wght@700;800;900', playfair: 'Playfair+Display:wght@700;800;900', caveat: 'Caveat:wght@700', bebas: 'Bebas+Neue' }
      const fontId = 'hero-font-link'
      let link = document.getElementById(fontId)
      if (!link) { link = document.createElement('link'); link.id = fontId; link.rel = 'stylesheet'; document.head.appendChild(link) }
      link.href = `https://fonts.googleapis.com/css2?family=${fontMap[heroFont]}&display=swap`
    }
  }, [heroFont])
  useEffect(() => { localStorage.setItem('productslocal_heroColor', heroColor) }, [heroColor])
  useEffect(() => { localStorage.setItem('productslocal_heroSubColor', heroSubColor) }, [heroSubColor])
  useEffect(() => { localStorage.setItem('productslocal_heroEffect', heroEffect) }, [heroEffect])
  useEffect(() => { localStorage.setItem('productslocal_shopPhone', shopPhone) }, [shopPhone])
  useEffect(() => { saveJSON('productslocal_shopOpen', shopOpen) }, [shopOpen])
  useEffect(() => { localStorage.setItem('productslocal_shopAddress', shopAddress) }, [shopAddress])
  useEffect(() => { localStorage.setItem('productslocal_shopHours', shopHours) }, [shopHours])
  useEffect(() => { localStorage.setItem('productslocal_shopSchedule', JSON.stringify(shopSchedule)) }, [shopSchedule])
  useEffect(() => { localStorage.setItem('productslocal_shopMaps', shopMapsLink) }, [shopMapsLink])
  useEffect(() => { localStorage.setItem('productslocal_shopIG', shopInstagram) }, [shopInstagram])
  useEffect(() => { localStorage.setItem('productslocal_shopTT', shopTiktok) }, [shopTiktok])
  useEffect(() => { localStorage.setItem('productslocal_shopFB', shopFacebook) }, [shopFacebook])
  useEffect(() => { localStorage.setItem('productslocal_shopYT', shopYoutube) }, [shopYoutube])
  useEffect(() => { localStorage.setItem('productslocal_shopWeb', shopWebsite) }, [shopWebsite])
  useEffect(() => { localStorage.setItem('productslocal_shopQris', shopQris) }, [shopQris])
  useEffect(() => { localStorage.setItem('productslocal_shopFoodType', shopFoodType) }, [shopFoodType])
  useEffect(() => { localStorage.setItem('productslocal_shopBio', shopBio) }, [shopBio])
  useEffect(() => { localStorage.setItem('productslocal_shopCity', shopCity) }, [shopCity])
  useEffect(() => { localStorage.setItem('productslocal_shopCountry', shopCountry) }, [shopCountry])
  useEffect(() => { localStorage.setItem('productslocal_delBase', delBaseFee) }, [delBaseFee])
  useEffect(() => { localStorage.setItem('productslocal_delPerKm', delPerKm) }, [delPerKm])
  useEffect(() => { localStorage.setItem('productslocal_delMin', delMinCharge) }, [delMinCharge])
  useEffect(() => { localStorage.setItem('productslocal_delMax', delMaxKm) }, [delMaxKm])
  useEffect(() => { localStorage.setItem('productslocal_delFree', delFreeAbove) }, [delFreeAbove])
  useEffect(() => { localStorage.setItem('productslocal_delCurrency', delCurrency) }, [delCurrency])
  useEffect(() => { localStorage.setItem('productslocal_delMinKm', delMinKm) }, [delMinKm])
  useEffect(() => { localStorage.setItem('productslocal_delEnabled', delEnabled) }, [delEnabled])

  /* Customization features persistence */
  useEffect(() => { localStorage.setItem('productslocal_btnShape', btnShape) }, [btnShape])
  useEffect(() => { localStorage.setItem('productslocal_btnColor', btnColor) }, [btnColor])
  useEffect(() => { localStorage.setItem('productslocal_btnText', btnText) }, [btnText])
  useEffect(() => { localStorage.setItem('productslocal_btnGlow', btnGlow) }, [btnGlow])
  useEffect(() => { localStorage.setItem('productslocal_overlayOpacity', overlayOpacity) }, [overlayOpacity])
  useEffect(() => { localStorage.setItem('productslocal_landingLayout', landingLayout) }, [landingLayout])
  useEffect(() => { localStorage.setItem('productslocal_customTagline', customTagline) }, [customTagline])
  useEffect(() => { localStorage.setItem('productslocal_menuCardStyle', menuCardStyle) }, [menuCardStyle])
  useEffect(() => { localStorage.setItem('productslocal_menuBanner', menuBanner) }, [menuBanner])
  useEffect(() => { localStorage.setItem('productslocal_showClosedBanner', showClosedBanner) }, [showClosedBanner])
  useEffect(() => { localStorage.setItem('productslocal_promoBanner', promoBanner) }, [promoBanner])
  useEffect(() => { localStorage.setItem('productslocal_promoBannerEnabled', promoBannerEnabled) }, [promoBannerEnabled])
  useEffect(() => { localStorage.setItem('productslocal_splashEnabled', splashEnabled) }, [splashEnabled])
  useEffect(() => { if (splashEnabled) { const t = setTimeout(() => setShowSplash(false), 2000); return () => clearTimeout(t) } else { setShowSplash(false) } }, [splashEnabled])

  // Build delivery zones from vendor's own settings
  useEffect(() => {
    const zones = buildDeliveryZones(delMinCharge, delMinKm, delPerKm, delMaxKm, 1000, delCurrency)
    setDeliveryZones(zones)
    setDeliveryZone(zones[0])
  }, [delMinCharge, delMinKm, delPerKm, delMaxKm, delCurrency])

  // Sync shop config to Supabase when vendor changes settings
  const syncTimer = useRef(null)
  useEffect(() => {
    if (!vendorId || String(vendorId).startsWith('local')) return
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      updateVendorConfig(vendorId, {
        shop_name: shopName, shop_logo: shopLogo, shop_phone: shopPhone,
        shop_open: shopOpen, shop_address: shopAddress, shop_hours: shopHours,
        shop_maps_link: shopMapsLink, shop_instagram: shopInstagram,
        shop_tiktok: shopTiktok, shop_facebook: shopFacebook,
        shop_youtube: shopYoutube, shop_website: shopWebsite,
        shop_food_type: shopFoodType,
        delivery_base_fee: delBaseFee, delivery_per_km: delPerKm,
        delivery_min_charge: delMinCharge, delivery_max_km: delMaxKm,
        delivery_free_above: delFreeAbove, delivery_currency: delCurrency,
        delivery_enabled: delEnabled,
      })
    }, 2000)
  }, [shopName, shopLogo, shopPhone, shopOpen, shopAddress, shopHours, shopMapsLink, shopInstagram, shopTiktok, shopFacebook, shopYoutube, shopWebsite, shopFoodType, delBaseFee, delPerKm, delMinCharge, delMaxKm, delFreeAbove, delCurrency, delEnabled])

  // Load shop config from Supabase on vendor login
  useEffect(() => {
    if (!vendorId || String(vendorId).startsWith('local')) return
    if (!supabase) return
    supabase.from('vendor_accounts').select('*').eq('id', vendorId).single().then(({ data }) => {
      if (!data) return
      if (data.shop_name) setShopName(data.shop_name)
      if (data.shop_logo) setShopLogo(data.shop_logo)
      if (data.shop_phone) setShopPhone(data.shop_phone)
      if (data.shop_address) setShopAddress(data.shop_address)
      if (data.shop_hours) setShopHours(data.shop_hours)
      if (data.shop_maps_link) setShopMapsLink(data.shop_maps_link)
      if (data.shop_instagram) setShopInstagram(data.shop_instagram)
      if (data.shop_tiktok) setShopTiktok(data.shop_tiktok)
      if (data.shop_facebook) setShopFacebook(data.shop_facebook)
      if (data.shop_youtube) setShopYoutube(data.shop_youtube)
      if (data.shop_website) setShopWebsite(data.shop_website)
      if (data.shop_food_type) setShopFoodType(data.shop_food_type)
      if (data.shop_open !== undefined) setShopOpen(data.shop_open)
      if (data.delivery_base_fee) setDelBaseFee(data.delivery_base_fee)
      if (data.delivery_per_km) setDelPerKm(data.delivery_per_km)
      if (data.delivery_min_charge) setDelMinCharge(data.delivery_min_charge)
      if (data.delivery_max_km) setDelMaxKm(data.delivery_max_km)
      if (data.delivery_free_above !== undefined) setDelFreeAbove(data.delivery_free_above)
      if (data.delivery_currency) setDelCurrency(data.delivery_currency)
      if (data.delivery_enabled !== undefined) setDelEnabled(data.delivery_enabled)
    })
  }, [vendorId])

  /* --- Cart helpers --- */
  const totalItems = cart.reduce((s, c) => s + c.qty, 0)
  const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0)

  // Cart line ID is a composite key: itemId :: variantId :: sortedModifierIds — so identical combos merge
  // but different variant/modifier picks become separate cart lines.
  const buildCartLineId = (itemId, variant, modifiers) => {
    const vid = variant ? variant.id : ''
    const mids = (modifiers || []).map(m => m.id).sort().join(',')
    return `${itemId}::${vid}::${mids}`
  }

  const addToCart = useCallback((item, qty = 1, variant = null, modifiers = []) => {
    setCart((prev) => {
      const lineId = buildCartLineId(item.id, variant, modifiers)
      const idx = prev.findIndex((c) => c.id === lineId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
        return next
      }
      const basePrice = item.promoPrice || item.price
      const variantDelta = variant ? (variant.priceDelta || 0) : 0
      const modifiersDelta = (modifiers || []).reduce((s, m) => s + (m.priceDelta || 0), 0)
      const unitPrice = basePrice + variantDelta + modifiersDelta
      // Display name includes variant suffix; modifier list shown below in cart
      const displayName = variant ? `${item.name} (${variant.name})` : item.name
      return [...prev, {
        id: lineId,
        itemId: item.id,
        name: displayName,
        desc: item.desc,
        photo: item.photo,
        price: unitPrice,
        promoPrice: item.promoPrice ? unitPrice : null,
        prepTime: item.prepTime,
        variant: variant,
        modifiers: modifiers,
        qty,
      }]
    })
  }, [])

  /* --- GPS auto-delivery --- */
  const detectDeliveryZone = useCallback(() => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineKm(SHOP_LAT, SHOP_LON, pos.coords.latitude, pos.coords.longitude)
        setDeliveryZone(getDeliveryFee(dist, deliveryZones))
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
  }, [])

  /* --- Vendor login --- */
  const handleVendorLogin = async () => {
    if (!loginPhone.trim()) { setLoginError('Enter WhatsApp number'); return }
    if (!loginPass.trim()) { setLoginError('Enter password'); return }
    // Try Supabase first
    const vendor = await vendorLogin(loginPhone, loginPass)
    if (vendor) {
      setVendorId(vendor.id)
      setShopName(vendor.shop_name || shopName)
      setShopPhone(vendor.shop_phone || shopPhone)
      setShopAddress(vendor.shop_address || shopAddress)
      setShopHours(vendor.shop_hours || shopHours)
      setShopFoodType(vendor.shop_food_type || shopFoodType)
      setShopMapsLink(vendor.shop_maps_link || '')
      setShopInstagram(vendor.shop_instagram || '')
      setShopTiktok(vendor.shop_tiktok || '')
      setShopFacebook(vendor.shop_facebook || '')
      setShopYoutube(vendor.shop_youtube || '')
      setShopWebsite(vendor.shop_website || '')
      setShopOpen(vendor.shop_open !== false)
      // Set subscription status
      if (vendor.status) setVendorStatus(vendor.status)
      if (vendor.expires_at) {
        setVendorExpiresAt(vendor.expires_at)
        // Auto-check if expired
        if (new Date(vendor.expires_at) < new Date() && vendor.status === 'active') {
          setVendorStatus('expired')
        }
      }
      // Load menu from Supabase
      const items = await getVendorMenuItems(vendor.id)
      if (items.length > 0) {
        setMenuItems(items.map(i => ({ id: i.id, supabaseId: i.id, name: i.name, price: i.price, photo: i.photo_url, desc: i.description, category: i.category, available: i.available, promoPrice: i.promo_price, prepTime: i.prep_time, spice: i.spice, halal: i.halal, popular: i.popular })))
      }
      localStorage.setItem('productslocal_vendor_phone', loginPhone.replace(/[^0-9]/g, ''))
      localStorage.setItem('productslocal_vendor_pass', loginPass)
      setIsVendor(true); setVendorLogin(false)
      setLoginPhone(''); setLoginPass(''); setLoginError(''); setLoginMode('login')
      return
    }
    // Fallback to localStorage
    const storedPhone = localStorage.getItem('productslocal_vendor_phone') || shopPhone
    const storedPass = localStorage.getItem('productslocal_vendor_pass') || 'vendor123'
    if (loginPhone.replace(/[^0-9]/g, '') === storedPhone.replace(/[^0-9]/g, '') && loginPass === storedPass) {
      setIsVendor(true); setVendorLogin(false)
      setLoginPhone(''); setLoginPass(''); setLoginError(''); setLoginMode('login')
    } else {
      setLoginError('Wrong number or password')
    }
  }

  const handleVendorSignup = async () => {
    if (!signupName.trim()) { setLoginError('Enter your business name'); return }
    if (!signupCategory) { setLoginError('Select your food category'); return }
    if (!loginPhone.trim()) { setLoginError('Enter WhatsApp number'); return }
    if (!loginPass.trim()) { setLoginError('Create a password'); return }
    if (loginPass.length < 4) { setLoginError('Password min 4 characters'); return }
    try {
      const vendor = await vendorSignup(loginPhone, loginPass, signupName)
      setVendorId(vendor.id)
      localStorage.setItem('productslocal_vendor_phone', loginPhone.replace(/[^0-9]/g, ''))
      localStorage.setItem('productslocal_vendor_pass', loginPass)
      setShopName(signupName)
      setShopFoodType(signupCategory)
      localStorage.setItem('productslocal_shopFoodType', signupCategory)
      setShopPhone(loginPhone.replace(/[^0-9]/g, ''))
      // Auto-set theme based on category
      const matchedTheme = THEME_PRESETS.find(t => t.category === signupCategory)
      if (matchedTheme) {
        setShopTheme(matchedTheme.id)
        localStorage.setItem('productslocal_theme', matchedTheme.id)
        localStorage.setItem('productslocal_themeBg', matchedTheme.img)
        const bgImg = document.getElementById('app-bg-img')
        if (bgImg) bgImg.src = matchedTheme.img
      }
      updateVendorConfig(vendor.id, { shop_food_type: signupCategory })
      setIsVendor(true)
      setVendorLogin(false)
      setLoginPhone(''); setLoginPass(''); setSignupName(''); setSignupCategory(''); setLoginError(''); setLoginMode('login')
    } catch (e) { setLoginError(e.message || 'Signup failed') }
  }

  /* --- Vendor actions --- */
  const toggleAvailability = (id) => {
    setMenuItems((prev) => prev.map((m) => m.id === id ? { ...m, available: !m.available } : m))
  }

  const deleteItem = (id) => {
    const item = menuItems.find(m => m.id === id)
    if (item?.supabaseId) deleteMenuItemSupa(item.supabaseId).catch(() => {})
    setMenuItems((prev) => prev.filter((m) => m.id !== id))
  }

  const startEdit = (item) => {
    setFormName(item.name)
    setFormPrice(String(item.price))
    setFormPhoto(item.photo)
    setFormDesc(item.desc)
    setFormCategory(item.category || getMenuTabsForTheme(shopTheme)[0])
    setFormPrepTime(item.prepTime || 0)
    setFormPhotos(item.photos || [])
    setFormAllergens(item.allergens || [])
    setFormDietary(item.dietary || [])
    setFormPortion(item.portion || '')
    setFormStock(item.stock != null ? String(item.stock) : '')
    setFormVariants(item.variants || [])
    setFormModifiers(item.modifiers || [])
    setExpandedSections({
      photos: (item.photos || []).length > 0,
      allergens: (item.allergens || []).length > 0,
      dietary: (item.dietary || []).length > 0,
      portion: !!item.portion,
      stock: item.stock != null,
      variants: (item.variants || []).length > 0,
      modifiers: (item.modifiers || []).length > 0,
    })
    setEditItem(item)
  }

  const saveEdit = () => {
    if (!formName || !formPrice) return
    const stockNum = formStock === '' ? null : Number(formStock)
    const extras = { photos: formPhotos, allergens: formAllergens, dietary: formDietary, portion: formPortion, stock: stockNum, variants: formVariants, modifiers: formModifiers }
    setMenuItems((prev) =>
      prev.map((m) =>
        m.id === editItem.id ? { ...m, name: formName, price: Number(formPrice), photo: formPhoto, desc: formDesc, category: formCategory, prepTime: formPrepTime || 0, ...extras } : m
      )
    )
    if (vendorId) saveMenuItem(vendorId, { ...menuItems.find(m => m.id === editItem.id), name: formName, price: Number(formPrice), photo: formPhoto, desc: formDesc, category: formCategory, prepTime: formPrepTime || 0, ...extras }).catch(() => {})
    setEditItem(null)
  }

  const startAdd = () => {
    setFormName('')
    setFormPrice('')
    setFormPromoPrice('')
    setFormPriceMode('normal')
    setFormSpice(0)
    setFormHalal(false)
    setFormPopular(false)
    setFormPhoto('')
    setFormDesc('')
    setFormPrepTime(0)
    setFormPhotos([])
    setFormAllergens([])
    setFormDietary([])
    setFormPortion('')
    setFormStock('')
    setFormVariants([])
    setFormModifiers([])
    setExpandedSections({ photos: false, dietary: false, allergens: false, portion: false, stock: false, variants: false, modifiers: false })
    setAddingItem(true)
  }

  const saveAdd = () => {
    if (!formName || !formPrice) return
    const newId = Date.now()
    const promoPrice = formPriceMode === 'promo' && formPromoPrice ? Number(formPromoPrice) : null
    const stockNum = formStock === '' ? null : Number(formStock)
    const item = { id: newId, name: formName, price: Number(formPrice), promoPrice, spice: formSpice, halal: formHalal, popular: formPopular, photo: formPhoto, desc: formDesc, category: formCategory, prepTime: formPrepTime || 0, available: true, photos: formPhotos, allergens: formAllergens, dietary: formDietary, portion: formPortion, stock: stockNum, variants: formVariants, modifiers: formModifiers }
    setMenuItems((prev) => [...prev, item])
    if (vendorId) saveMenuItem(vendorId, item).catch(() => {})
    setAddingItem(false)
  }

  /* --- WhatsApp order --- */
  const sendWhatsApp = () => {
    const note = document.getElementById('orderNote')?.value?.trim()
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const orderNum = String(Date.now()).slice(-6)
    const initials = shopName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    // Calculate max prep time from cart items
    const maxPrep = Math.max(0, ...cart.map(c => c.prepTime || 0))

    // Check if customer is returning
    const customers = loadJSON('productslocal_customers', [])
    const returning = customers.find(c => c.phone === custPhone)
    const orderHistory = returning ? returning.orders || 0 : 0

    const subtotal = totalPrice
    const deliveryFee = delEnabled && deliveryZone ? (deliveryZone.fee || 0) : 0
    const grandTotal = subtotal + deliveryFee

    const lines = [
      `━━━━━━━━━━━━━━━━━━`,
      `*${shopName.toUpperCase()}*`,
      `Order Receipt`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `${dateStr}  ${timeStr}`,
      `Order #${initials}-${orderNum}`,
      ``,
      ...(custName ? [`*Customer:* ${custName}`] : []),
      ...(orderHistory > 0 ? [`Returning customer (${orderHistory + 1} orders)`] : []),
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `*ORDER ITEMS*`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      ...cart.map((c) => {
        const itemTotal = (c.promoPrice || c.price) * c.qty
        return `${c.qty}x  ${c.name}\n      ${fmt(itemTotal)}`
      }),
      ``,
      ...(note ? [`━━━━━━━━━━━━━━━━━━`, `*Note:* ${note}`, ``] : []),
      `━━━━━━━━━━━━━━━━━━`,
      ...(deliveryFee > 0 ? [
        `Subtotal:     ${fmt(subtotal)}`,
        `Delivery:     ${fmt(deliveryFee)}${userDistance ? ` (${userDistance} km)` : ''}`,
        `━━━━━━━━━━━━━━━━━━`,
      ] : []),
      `*TOTAL:  ${fmt(grandTotal)}*`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      ...(maxPrep > 0 ? [`Est. prep time: ~${maxPrep} min`, ``] : []),
      ...(shopAddress ? [`${shopAddress}`, ``] : []),
      `Placed via StreetLocal.live`,
    ]
    const msg = encodeURIComponent(lines.join('\n'))
    const phone = shopPhone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    // Save customer to directory (localStorage + Supabase)
    if (returning) {
      returning.orders = (returning.orders || 0) + 1
      returning.totalSpent = (returning.totalSpent || 0) + totalPrice
      returning.lastOrder = new Date().toISOString()
      returning.name = custName || returning.name
    } else {
      customers.push({ phone: custPhone, name: custName, orders: 1, totalSpent: totalPrice, lastOrder: new Date().toISOString(), firstOrder: new Date().toISOString() })
    }
    saveJSON('productslocal_customers', customers)
    // Sync to Supabase
    if (supabase && vendorId && !String(vendorId).startsWith('local')) {
      supabase.from('vendor_customers').upsert({
        vendor_id: vendorId, phone: custPhone, name: custName,
        orders: existing ? existing.orders : 1,
        total_spent: existing ? existing.totalSpent : totalPrice,
        last_order: new Date().toISOString(),
      }, { onConflict: 'vendor_id,phone' }).then(() => {})
      // Save order
      supabase.from('vendor_orders').insert({
        vendor_id: vendorId, customer_name: custName, customer_phone: custPhone,
        items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
        subtotal: totalPrice, delivery_type: 'delivery', payment_method: 'cod',
        note: document.getElementById('orderNote')?.value || '',
      }).then(() => {})
    }
    setOrderDone(true)
  }

  /* --- Menu category filter --- */
  const [menuFilter, setMenuFilter] = useState('All')
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const MENU_CATEGORIES = ['All', ...new Set(menuItems.map(m => m.category).filter(Boolean))]

  /* --- Vendor type (fashion / electronics / grocery / beauty / general) --- */
  const [vendorType, setVendorType] = useState(() => localStorage.getItem('productslocal_vendor_type') || null)
  const [vendorTypePickerOpen, setVendorTypePickerOpen] = useState(false)
  useEffect(() => {
    if (vendorType) {
      try { localStorage.setItem('productslocal_vendor_type', vendorType) } catch {}
    }
  }, [vendorType])
  // Auto-open the picker once when vendor first enters admin without having chosen a type
  useEffect(() => {
    if (isVendor && !vendorType && !isDemo) setVendorTypePickerOpen(true)
  }, [isVendor, vendorType, isDemo])

  // Quick-chip suggestions: preset for current type ∪ any custom categories already in menu
  const vendorPreset = vendorType ? VENDOR_TYPES[vendorType] : VENDOR_TYPES.fashion
  const categoryChips = [...new Set([
    ...vendorPreset.categories,
    ...menuItems.map(m => m.category).filter(Boolean),
  ])]

  /* --- Visit Us FAB — expanded with "Visit Us" label on first session, collapses to pin only --- */
  const [fabExpanded, setFabExpanded] = useState(() => !localStorage.getItem('productslocal_visit_seen'))
  useEffect(() => {
    if (!fabExpanded) return
    const t = setTimeout(() => {
      setFabExpanded(false)
      try { localStorage.setItem('productslocal_visit_seen', '1') } catch {}
    }, 3000)
    return () => clearTimeout(t)
  }, [fabExpanded])

  /* --- Visible menu --- */
  // Customers don't see items that are unavailable OR have stock === 0. Vendor admin sees everything.
  const visibleMenu = (isVendor ? menuItems : menuItems.filter((m) => m.available && (m.stock == null || m.stock > 0))).filter(m => menuFilter === 'All' || m.category === menuFilter)

  // Active daily deals — filter by current time
  const activeDeals = dailyDeals.filter(d => {
    if (!d.active) return false
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const start = new Date(`${today}T${d.startTime || '00:00'}`)
    const end = new Date(`${today}T${d.endTime || '23:59'}`)
    return now >= start && now <= end
  })
  const hasDeals = activeDeals.length > 0

  /* ═══════════════════════ RENDER ══════════════════��════ */

  /* ═══ SPLASH SCREEN ═══ */
  if (showSplash && splashEnabled) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {shopLogo && <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 20 }} />}
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{shopName}</div>
      </div>
    )
  }

  /* ═══ LANDING PAGE — full screen, no content behind ═══ */
  if (showLanding) {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}><DevBadge n={1} />
        {/* Background image — uses vendor's selected theme */}
        <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle }} />


        {/* Language toggle — top right, single flag, tap to switch */}
        <button onClick={() => {
          const codes = LANGUAGES.map(l => l.code)
          const idx = codes.indexOf(locale)
          setLocale(codes[(idx + 1) % codes.length])
        }} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, height: 36, borderRadius: 18, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={LANGUAGES.find(l => l.code === locale)?.flag} alt="" onError={imgError('generic')} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{LANGUAGES.find(l => l.code === locale)?.label || 'EN'}</span>
        </button>

        {/* Background overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `rgba(0,0,0,${overlayOpacity / 100})`, zIndex: 1 }} />

        {/* Closed banner overlay */}
        {showClosedBanner && !shopOpen && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(220,38,38,0.9)', color: '#fff', padding: '10px 28px', borderRadius: 10, fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>CLOSED</div>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: landingLayout === 'left' ? 'flex-start' : 'center', justifyContent: landingLayout === 'top' ? 'flex-start' : 'center', paddingTop: landingLayout === 'top' ? 80 : 0, paddingLeft: landingLayout === 'left' ? 24 : 0 }}>
          {/* Shop logo */}
          {shopLogoStyle !== 'off' && shopLogo ? (
            shopLogoStyle === 'bare' ? (
              <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 200, height: 200, objectFit: 'contain', marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }} />
            ) : (
              <div style={{ width: 156, height: 156, borderRadius: 78, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: `0 4px 24px rgba(0,0,0,0.5)`, border: '3px solid rgba(255,255,255,0.15)' }}>
                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 160, height: 160, borderRadius: 80, objectFit: 'cover', marginTop: 18 }} />
              </div>
            )
          ) : shopLogoStyle !== 'off' ? (
            <div style={{ width: 90, height: 90, borderRadius: 45, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 16, border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>{shopName.charAt(0).toUpperCase()}</div>
          ) : null}

          {/* Shop name + tagline + city */}
          {(() => {
            const HERO_FONTS = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
            const HERO_SIZES = { normal: { title: 42, sub: 18, city: 12 }, large: { title: 52, sub: 22, city: 14 }, xl: { title: 62, sub: 26, city: 16 } }
            const sz = HERO_SIZES[heroSize] || HERO_SIZES.normal
            const ff = HERO_FONTS[heroFont] || HERO_FONTS.system
            const subC = heroSubColor || (heroColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : heroColor)
            const cityC = heroSubColor || (heroColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : heroColor)
            const EFFECTS = {
              shadow: { textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.5)', WebkitTextStroke: '1px rgba(0,0,0,0.3)' },
              glow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 0 60px ${heroColor}20, 0 2px 4px rgba(0,0,0,0.9)` },
              runGlow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9)`, animation: 'heroRunGlow 3s ease-in-out infinite' },
              outline: { WebkitTextStroke: `2px ${heroColor}`, color: 'transparent', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
              neon: { textShadow: `0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80, 0 0 82px ${heroColor}40`, animation: 'heroNeonFlicker 4s ease-in-out infinite' },
              none: { textShadow: 'none' },
            }
            const fx = EFFECTS[heroEffect] || EFFECTS.shadow
            // Smart word wrapping: split name into lines by word fitting
            const nameLines = shopName.split(' ')
            const maxCharsPerLine = sz.title >= 52 ? 10 : 14
            const lines = []
            let currentLine = ''
            nameLines.forEach(word => {
              if (currentLine && (currentLine + ' ' + word).length > maxCharsPerLine) {
                lines.push(currentLine)
                currentLine = word
              } else {
                currentLine = currentLine ? currentLine + ' ' + word : word
              }
            })
            if (currentLine) lines.push(currentLine)

            return (
              <>
                <style>{`
                  @keyframes heroRunGlow { 0%, 100% { text-shadow: 0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9); } 50% { text-shadow: 0 0 20px ${heroColor}, 0 0 50px ${heroColor}60, 0 0 80px ${heroColor}30, 0 2px 4px rgba(0,0,0,0.9); } }
                  @keyframes heroNeonFlicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { text-shadow: 0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80, 0 0 82px ${heroColor}40; } 20%, 24%, 55% { text-shadow: none; } }
                `}</style>
                <div style={{ textAlign: landingLayout === 'left' ? 'left' : 'center', marginBottom: 8, padding: '0 16px' }}>
                  {lines.map((line, i) => (
                    <div key={i} style={{ fontSize: sz.title, fontWeight: 800, color: heroEffect === 'outline' ? 'transparent' : heroColor, fontFamily: ff, lineHeight: 1.15, letterSpacing: -0.5, ...fx }}>{line}</div>
                  ))}
                </div>
                {(customTagline || shopFoodType) && (
                  <h2 style={{ textAlign: landingLayout === 'left' ? 'left' : 'center', marginBottom: 6, fontSize: sz.sub, fontWeight: 600, color: subC, fontFamily: ff, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)', letterSpacing: 1, opacity: heroSubColor ? 1 : 0.85 }}>{customTagline || shopFoodType}</h2>
                )}
                {(shopCity || shopCountry) && (
                  <p style={{ textAlign: landingLayout === 'left' ? 'left' : 'center', marginBottom: 40, fontSize: sz.city, fontWeight: 600, color: cityC, fontFamily: ff, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)', opacity: heroSubColor ? 1 : 0.7 }}>
                    {[shopCity, shopCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </>
            )
          })()}
        </div>

        {/* Enter button — yellow — bottom */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, gap: 14 }}>
          <style>{`@keyframes landingGlow { 0% { left: -100%; } 100% { left: 200%; } }`}</style>
          {/* Set Location / Enter button */}
          <button onClick={() => {
            if (!delEnabled || !navigator.geolocation) { setShowLanding(false); return }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const d = haversineKm(SHOP_LAT, SHOP_LON, pos.coords.latitude, pos.coords.longitude)
                setUserDistance(Math.round(d * 10) / 10)
                setShowLanding(false)
              },
              () => setShowLanding(false)
            )
          }} style={{
            padding: '14px 44px', border: 'none',
            borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12,
            cursor: 'pointer', fontSize: 15, fontWeight: 700,
            position: 'relative', overflow: 'hidden',
            background: btnColor || (isCustomAccent ? accent : '#FACC15'),
            color: (btnColor || (isCustomAccent ? accent : '#FACC15')) === '#FACC15' ? '#000' : '#fff',
            ...(btnGlow ? { boxShadow: `0 0 16px ${btnColor || accent}80, 0 0 32px ${btnColor || accent}40` } : {}),
          }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: btnShape === 'pill' ? 50 : btnShape === 'square' ? 4 : 12 }}>
              <div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} />
            </div>
            <span style={{ position: 'relative', zIndex: 1 }}>{btnText || 'View Menu'}</span>
          </button>
          <a href="https://streetlocal.live" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 8, letterSpacing: 1, textDecoration: 'none' }}>streetlocal.live</a>

          {/* DEV: Quick dashboard access */}
          {!previewMode && <button onClick={() => { setIsVendor(true); setShowLanding(false); setVendorDrawer(true) }} style={{ marginTop: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>DEV: Dashboard</button>}
          {/* Preview mode — back to dashboard */}
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}><DevBadge n={2} />

      {/* --- Vendor mode bar --- */}

      {/* --- Subscription expired banner --- */}
      {isVendor && vendorStatus === 'expired' && (
        <div style={{ background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 12, margin: '8px 12px', padding: '12px 16px', textAlign: 'center', color: '#ff6b6b', fontSize: 14, fontWeight: 600 }}>
          Subscription expired — contact admin to renew
        </div>
      )}

      {/* --- Header --- */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 10 }}>
          {shopLogoStyle !== 'off' && shopLogo ? (
            shopLogoStyle === 'bare' ? (
              <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 22, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }}>
                <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
              </div>
            )
          ) : shopLogoStyle !== 'off' ? (
            <div style={{ width: 40, height: 40, borderRadius: 20, background: isCustomAccent ? accent : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>{shopName.charAt(0).toUpperCase()}</div>
          ) : null}
          <div>
            <span style={S.shopName}>{shopName}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopFoodType}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* DEV: Quick dashboard toggle */}
          {!isVendor && (
            <button onClick={() => { setIsVendor(true); setVendorDrawer(true) }} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}>DEV</button>
          )}
          {/* Hamburger menu (vendor only) */}
          {isVendor && (
            <button onClick={() => setVendorDrawer(true)} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 6, minWidth: 38, minHeight: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          )}
          {/* Cart icon (hidden for vendor) */}
          {!isVendor && <button onClick={() => { if (cart.length > 0) { setCheckoutOpen(true); setOrderDone(false) } }} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', padding: 6, minWidth: 38, minHeight: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cart.reduce((s, c) => s + c.qty, 0)}
              </span>
            )}
          </button>}
        </div>
      </div>


      {/* --- Coming Soon overlay for pending vendors (public visitors only) --- */}
      {!isVendor && publicVendorStatus === 'pending' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {publicVendorLogo && <img src={publicVendorLogo} alt="" onError={imgError('logo')} style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', marginBottom: 16 }} />}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8, textAlign: 'center' }}>{publicVendorName || shopName}</h1>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFD600', marginBottom: 8 }}>{t.comingSoon || 'Coming Soon!'}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.6, maxWidth: 280, marginBottom: 30 }}>
            {locale === 'id' ? 'Kami sedang mempersiapkan menu. Kunjungi lagi segera!' : 'We\'re preparing our menu. Check back shortly!'}
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center', width: '100%', maxWidth: 280 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Powered by</p>
            <a href="https://streetlocal.live" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD600' }}>StreetLocal</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Get your own food ordering software</div>
              <div style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700, marginTop: 4 }}>from $2.50/month →</div>
            </a>
          </div>
        </div>
      )}

      {/* --- Promo Banner (marquee) — edge-safe via inner padded overflow-hidden box --- */}
      {promoBannerEnabled && promoBanner && (
        <div style={{ background: `${accent}20`, borderBottom: `1px solid ${accent}30`, padding: '6px 0' }}>
          <div style={{ overflow: 'hidden', padding: '0 16px' }}>
            <style>{`@keyframes promoBannerScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
            <div style={{ whiteSpace: 'nowrap', animation: 'promoBannerScroll 12s linear infinite', fontSize: 13, fontWeight: 700, color: accent }}>
              {promoBanner.split('\n').map(s => s.trim()).filter(Boolean).join('   ·   ')}
            </div>
          </div>
        </div>
      )}

      {/* --- Menu Banner Image --- */}
      {menuBanner && (
        <div style={{ margin: '0 12px 8px', borderRadius: 14, overflow: 'hidden' }}>
          <img src={menuBanner} alt="" onError={imgError('banner')} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* --- Closed banner --- */}
      {!shopOpen && !isVendor && (
        <div style={S.closedBanner}>{t.shopClosed || 'This shop is currently closed'}</div>
      )}

      {/* Add Item button (vendor) */}
      {isVendor && vendorStatus !== 'expired' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px' }}>
          <button onClick={startAdd} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#8DC63F', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add Item</button>
        </div>
      )}
      <div style={{ height: 12 }} />
      {/* --- Daily Deals Button + Cards --- */}
      {hasDeals && (
        <div style={{ padding: '0 16px 8px' }}>
          <button onClick={() => setShowDeals(!showDeals)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
            🔥 Promo ({activeDeals.length})
            <span style={{ fontSize: 12 }}>{showDeals ? '▲' : '▼'}</span>
          </button>
          {showDeals && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeDeals.map(deal => {
                const now = new Date()
                const today = now.toISOString().slice(0, 10)
                const end = new Date(`${today}T${deal.endTime || '23:59'}`)
                const remaining = Math.max(0, end - now)
                const hrs = Math.floor(remaining / 3600000)
                const mins = Math.floor((remaining % 3600000) / 60000)
                return (
                  <div key={deal.id} style={{ background: 'rgba(255,214,0,0.08)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                    {deal.photo && <img src={deal.photo} alt="" onError={imgError('food')} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD600' }}>{fmt(deal.dealPrice)}</span>
                        <span style={{ fontSize: 12, color: '#888', textDecoration: 'line-through' }}>{fmt(deal.originalPrice)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginTop: 4 }}>
                        ⏰ {hrs}h {mins}m remaining
                      </div>
                    </div>
                    <button onClick={() => {
                      const existing = cart.find(c => c.id === 'deal-' + deal.id)
                      if (existing) { setCart(cart.map(c => c.id === 'deal-' + deal.id ? { ...c, qty: c.qty + 1 } : c)) }
                      else { setCart([...cart, { id: 'deal-' + deal.id, name: deal.name + ' (Deal)', price: deal.dealPrice, qty: 1, photo: deal.photo }]) }
                    }} style={{ background: '#FFD600', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, color: '#1a1a1a', cursor: 'pointer', flexShrink: 0 }}>
                      + Add
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Menu --- */}
      <div style={{ paddingBottom: 12 }}>
        {/* Category text toggles + burger for more */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', gap: 24, flex: 1, overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>
          {(() => {
            const allCats = MENU_CATEGORIES.slice(1)
            const topThree = allCats.slice(0, 3)
            // Keep the active selection visible inline even if it's outside the top 3
            const inlineCats = (menuFilter === 'All' || topThree.includes(menuFilter)) ? topThree : [...topThree, menuFilter]
            const tabs = [{ label: 'All', filter: 'All' }, ...inlineCats.map(c => ({ label: c, filter: c }))]
            return tabs.map(tab => {
              const isActive = menuFilter === tab.filter
              return (
                <button key={tab.filter} onClick={() => setMenuFilter(tab.filter)} style={{
                  background: 'none', border: 'none', padding: '12px 0 10px', cursor: 'pointer', flexShrink: 0, minHeight: 44,
                  fontSize: 15, fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  borderBottom: isActive ? `2px solid ${isCustomAccent ? accent : '#fff'}` : '2px solid transparent',
                }}>
                  {tab.label}
                </button>
              )
            })
          })()}
          </div>
          {MENU_CATEGORIES.length > 4 && (
            <button onClick={() => setMenuDrawerOpen(true)} aria-label="All categories" title="All categories" style={{
              background: isCustomAccent ? accent : 'rgba(255,255,255,0.18)',
              border: 'none', padding: 8, marginLeft: 12, cursor: 'pointer', flexShrink: 0,
              minHeight: 44, minWidth: 44, borderRadius: 10,
              color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <span style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
              <span style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
              <span style={{ width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
            </button>
          )}
        </div>

        {/* Vendor-type picker — one-time question on signup, also reachable via item form */}
        {vendorTypePickerOpen && (
          <>
            <div onClick={() => vendorType && setVendorTypePickerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <div role="dialog" aria-label="Pick vendor type" style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 360, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto',
              background: 'linear-gradient(180deg, #1a1a1f 0%, #0c0c10 100%)',
              borderRadius: 22, padding: '26px 22px 22px', zIndex: 1001,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 16, marginLeft: 'auto', marginRight: 'auto' }} />
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>What kind of vendor are you?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>We'll set up your product categories instantly.</div>
              </div>
              {Object.values(VENDOR_TYPES).map(vt => {
                const isActive = vendorType === vt.id
                return (
                  <button key={vt.id} onClick={() => { setVendorType(vt.id); setVendorTypePickerOpen(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '14px 14px', marginBottom: 10, borderRadius: 14,
                    background: isActive
                      ? (isCustomAccent ? `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` : 'rgba(255,255,255,0.16)')
                      : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'),
                    boxShadow: isActive && isCustomAccent ? `0 6px 18px ${accent}55` : 'none',
                    cursor: 'pointer', textAlign: 'left', color: '#fff',
                    transition: 'all 150ms ease',
                  }}>
                    <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{vt.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{vt.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontWeight: 500 }}>{vt.tagline}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.4 }}>{vt.categories.slice(0, 5).join(' · ')}{vt.categories.length > 5 ? ' · …' : ''}</div>
                    </div>
                  </button>
                )
              })}
              {vendorType && (
                <button onClick={() => setVendorTypePickerOpen(false)} style={{
                  width: '100%', padding: '10px 14px', marginTop: 4, borderRadius: 12,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Cancel</button>
              )}
            </div>
          </>
        )}

        {/* Visit Us FAB — bottom-right, always visible while scrolling. Expands on first session. */}
        {!isVendor && (
          <button onClick={() => setShowLocation(true)} aria-label="Visit us" title="Visit us" style={{
            position: 'fixed', right: 16, bottom: 24, zIndex: 100,
            height: 56, minWidth: 56,
            padding: fabExpanded ? '0 22px 0 18px' : 0,
            borderRadius: 28, border: 'none',
            background: isCustomAccent ? accent : '#1f1f1f',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)',
            transition: 'padding 250ms ease, min-width 250ms ease',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            <img src="https://ik.imagekit.io/nepgaxllc/Untitledsdasdvvvdsds-removebg-preview.png?updatedAt=1777253439520" alt="" style={{ width: 28, height: 28, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
            {fabExpanded && (
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.3 }}>Visit Us</span>
            )}
          </button>
        )}

        {/* Full-category drawer — slides in from right when burger pressed */}
        {menuDrawerOpen && (
          <>
            <div onClick={() => setMenuDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', zIndex: 998, animation: 'menuOverlayIn 200ms ease-out' }} />
            <div role="dialog" aria-label="Browse menu" style={{
              position: 'fixed', top: 0, right: 0, width: 300, maxWidth: '88vw', height: '100vh',
              background: 'linear-gradient(180deg, #1a1a1f 0%, #0c0c10 100%)',
              zIndex: 999, padding: '22px 18px 24px', overflowY: 'auto',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.55), inset 1px 0 0 rgba(255,255,255,0.06)',
              borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
              animation: 'menuDrawerIn 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <style>{`
                @keyframes menuDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes menuOverlayIn { from { opacity: 0; } to { opacity: 1; } }
              `}</style>
              {/* Accent line on top — premium "title indicator" */}
              <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 14 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>Our Menu</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: 2 }}>{MENU_CATEGORIES.length - 1} categories · {menuItems.length} items</div>
                </div>
                <button onClick={() => setMenuDrawerOpen(false)} aria-label="Close" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1, width: 36, height: 36, borderRadius: 12 }}>&times;</button>
              </div>
              {[{ filter: 'All', label: 'Full Menu' }, ...MENU_CATEGORIES.slice(1).map(c => ({ filter: c, label: c }))].map(opt => {
                const count = opt.filter === 'All' ? menuItems.length : menuItems.filter(m => m.category === opt.filter).length
                const isActive = menuFilter === opt.filter
                return (
                  <button key={opt.filter} onClick={() => { setMenuFilter(opt.filter); setMenuDrawerOpen(false) }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                    padding: '13px 14px', marginBottom: 8, borderRadius: 12,
                    background: isActive
                      ? (isCustomAccent ? `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` : 'rgba(255,255,255,0.16)')
                      : 'rgba(255,255,255,0.04)',
                    border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isActive && isCustomAccent ? `0 4px 14px ${accent}55` : 'none',
                    cursor: 'pointer', minHeight: 48,
                    color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'left',
                    transition: 'background 150ms ease, box-shadow 150ms ease',
                  }}>
                    <span>{opt.label}</span>
                    <span style={{
                      padding: '3px 9px', borderRadius: 11,
                      background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: 'center',
                    }}>{count}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div style={{ height: 12 }} />
        <div style={menuCardStyle === 'grid' ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' } : {}}>
        {visibleMenu.map((item) => (
          menuCardStyle === 'grid' ? (
            /* GRID card style — 2 columns, image on top */
            <div key={item.id} style={{ background: 'rgba(0,0,0,0.85)', border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', position: 'relative', ...(!item.available && isVendor ? { background: 'rgba(139,0,0,0.4)' } : {}) }}>
              {isVendor && vendorStatus !== 'expired' && (
                <button style={{ ...S.toggle(item.available), position: 'absolute', top: 6, right: 6, zIndex: 2 }} onClick={() => toggleAvailability(item.id)}><div style={S.toggleDot(item.available)} /></button>
              )}
              <img src={item.photo || PLACEHOLDER_SM} alt={item.name} onError={imgError('food')} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} onClick={() => { setItemModal(item); setModalQty(1) }} />
              {item.popular && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 4px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
              {isVendor && vendorStatus !== 'expired' && <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', top: 80, left: 6, width: 22, height: 22, borderRadius: 11, border: 'none', background: '#8B0000', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => { setItemModal(item); setModalQty(1) }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>{item.promoPrice ? <span style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span> : <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>{fmt(item.price)}</span>}</div>
                  {!isVendor && shopOpen && item.available && <button style={{ ...S.addBtn, position: 'static', width: 28, height: 28, borderRadius: 14, fontSize: 16 }} onClick={() => { setItemModal(item); setModalQty(1) }}>+</button>}
                  {isVendor && vendorStatus !== 'expired' && <button style={S.smallBtn('#8B0000')} onClick={() => startEdit(item)}>Edit</button>}
                </div>
              </div>
            </div>
          ) : menuCardStyle === 'fullwidth' ? (
            /* FULLWIDTH card style — large image cards */
            <div key={item.id} style={{ background: 'rgba(0,0,0,0.85)', border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)', borderRadius: 16, margin: '8px 12px', overflow: 'hidden', position: 'relative', ...(!item.available && isVendor ? { background: 'rgba(139,0,0,0.4)' } : {}) }}>
              {isVendor && vendorStatus !== 'expired' && (
                <button style={{ ...S.toggle(item.available), position: 'absolute', top: 8, right: 8, zIndex: 2 }} onClick={() => toggleAvailability(item.id)}><div style={S.toggleDot(item.available)} /></button>
              )}
              <img src={item.photo || PLACEHOLDER_SM} alt={item.name} onError={imgError('food')} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} onClick={() => { setItemModal(item); setModalQty(1) }} />
              {item.popular && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
              {item.halal && <span style={{ position: 'absolute', top: 8, left: 70, fontSize: 10, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700, zIndex: 2 }}>Halal</span>}
              {isVendor && vendorStatus !== 'expired' && <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', bottom: 58, left: 8, width: 26, height: 26, borderRadius: 13, border: 'none', background: '#8B0000', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }} onClick={() => { setItemModal(item); setModalQty(1) }}>{item.name}{item.spice > 0 && <span style={{ marginLeft: 4 }}>{'🌶️'.repeat(item.spice)}</span>}</div>
                {item.desc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{item.desc}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>{item.promoPrice ? <><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginRight: 6 }}>{fmt(item.price)}</span><span style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span></> : <span style={{ fontSize: 16, fontWeight: 800, color: '#FACC15' }}>{fmt(item.price)}</span>}</div>
                  {!isVendor && shopOpen && item.available && <button style={S.addBtn} onClick={() => { setItemModal(item); setModalQty(1) }}>+</button>}
                  {isVendor && vendorStatus !== 'expired' && <button style={S.smallBtn('#8B0000')} onClick={() => startEdit(item)}>Edit</button>}
                </div>
              </div>
            </div>
          ) : (
            /* HORIZONTAL card style — default */
            <div
              key={item.id}
              style={{ ...S.card, ...(!item.available && isVendor ? { background: 'rgba(139,0,0,0.4)', border: '1px solid rgba(255,60,60,0.2)' } : {}), ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}
            >
              {isVendor && vendorStatus !== 'expired' && (
                <button style={{ ...S.toggle(item.available), position: 'absolute', top: 8, right: 8, zIndex: 2 }} onClick={() => toggleAvailability(item.id)}>
                  <div style={S.toggleDot(item.available)} />
                </button>
              )}
              <img
                src={item.photo || PLACEHOLDER_SM}
                alt={item.name}
                onError={imgError('food')}
                style={S.cardImg}
                onClick={() => { setItemModal(item); setModalQty(1) }}
              />
              {item.halal && (
                <span style={{ position: 'absolute', bottom: 8, left: isVendor ? 40 : 8, fontSize: 10, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700, zIndex: 2 }}>Halal</span>
              )}
              {item.popular && (
                <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>
              )}
              {isVendor && vendorStatus !== 'expired' && (
                <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', bottom: 8, left: 8, width: 26, height: 26, borderRadius: 13, border: 'none', background: '#8B0000', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>
              )}
              <div style={S.cardBody}>
                <div style={S.cardName} onClick={() => { setItemModal(item); setModalQty(1) }}>{item.name}{item.spice > 0 && <span style={{ marginLeft: 4 }}>{'🌶️'.repeat(item.spice)}</span>}</div>
                <div style={S.cardDesc}>{item.desc}{item.prepTime > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>⏱ {item.prepTime}min</span>}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    {item.promoPrice ? (
                      <><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginRight: 6 }}>{fmt(item.price)}</span><span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{fmt(item.promoPrice)}</span></>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{fmt(item.price)}</span>
                    )}
                  </div>
                  {isVendor && vendorStatus !== 'expired' && (
                    <button style={S.smallBtn('#8B0000')} onClick={() => startEdit(item)}>Edit</button>
                  )}
                </div>
              </div>
              {!isVendor && shopOpen && item.available && (
                <button style={S.addBtn} onClick={() => { setItemModal(item); setModalQty(1) }}>+</button>
              )}
            </div>
          )
        ))}

        {visibleMenu.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>{t.noItems || 'No items on the menu'}</div>
        )}
      </div>


      {/* --- StreetLocal Footer Link --- */}
      {!isVendor && (
        <a href="https://streetlocal.live" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '16px 0 8px', textDecoration: 'none' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Powered by </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>StreetLocal</span>
        </a>
      )}
      </div>

      {/* --- Sticky Cart Bar --- */}
      {totalItems > 0 && !isVendor && (
        <div style={{ ...S.stickyCart, ...(isCustomAccent ? { background: accent } : {}) }}>
          <span style={S.cartText}>{totalItems} item{totalItems > 1 ? 's' : ''} &middot; {fmt(totalPrice)}</span>
          <button style={{ ...S.checkoutBtn, ...(isCustomAccent ? { background: '#fff', color: accent } : {}) }} onClick={() => { setCheckoutOpen(true); setOrderDone(false); detectDeliveryZone() }}>
            {t.checkout || 'Checkout'} &rarr;
          </button>
        </div>
      )}


      {/* ═══ ITEM DETAIL MODAL ═══ */}
      {itemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }} onClick={() => setItemModal(null)}><DevBadge n={3} />
          {/* Fixed background + glass — stays in place while content scrolls */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 0 }} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 0 }} />

          {/* Content — scrollable over the fixed glass background */}
          {(() => {
            const priceColor = '#FACC15'
            const qtyBg = isCustomAccent ? accent : '#FACC15'
            const qtyColor = isCustomAccent ? '#fff' : '#000'
            return (
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto', height: '100%' }} onClick={(e) => e.stopPropagation()}>

            {/* Header — company name + cart */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
              <button onClick={() => setItemModal(null)} style={{ width: 38, height: 38, borderRadius: 19, background: isCustomAccent ? accent : 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopName}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{shopFoodType}</div>
              </div>
              <button onClick={() => { setItemModal(null); if (cart.length > 0) { setCheckoutOpen(true); setOrderDone(false) } }} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', padding: 6, minWidth: 44, minHeight: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
                <span style={{ fontSize: 20 }}>🛒</span>
                {cart.length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cart.reduce((s, c) => s + c.qty, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Hero image — with side padding + rounded */}
            <div style={{ padding: '0 14px', position: 'relative' }}>
              {(() => {
                const photoStrip = [itemModal.photo, ...(itemModal.photos || [])].filter(Boolean)
                const activePhoto = photoStrip[modalPhotoIdx] || itemModal.photo || PLACEHOLDER_LG
                return (
                  <>
                    <img
                      src={activePhoto}
                      alt={itemModal.name}
                      onError={imgError('food')}
                      style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 20 }}
                    />
                    {photoStrip.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 2px' }}>
                        {photoStrip.map((url, i) => (
                          <button key={i} onClick={() => setModalPhotoIdx(i)} style={{
                            flexShrink: 0, width: 56, height: 56, borderRadius: 10, padding: 0,
                            border: '2px solid ' + (modalPhotoIdx === i ? (isCustomAccent ? accent : '#FACC15') : 'rgba(255,255,255,0.1)'),
                            background: 'none', cursor: 'pointer', overflow: 'hidden',
                          }}>
                            <img src={url} alt="" onError={imgError('food')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
              {/* Category badge */}
              {itemModal.category && (
                <span style={{ position: 'absolute', top: 12, right: 26, fontSize: 11, fontWeight: 700, color: '#fff', background: accent, padding: '4px 10px', borderRadius: 8 }}>{itemModal.category}</span>
              )}
            </div>

            {/* Info card — pulls up over image */}
            <div style={{ margin: '-20px 12px 0', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 20, padding: '20px 18px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.08)' }}>
              {/* Red accent line for noodle theme */}
              {isCustomAccent && <div style={{ position: 'absolute', top: 20, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemModal.name}</h2>
              {itemModal.spice > 0 && <span style={{ fontSize: 14 }}>{'🌶️'.repeat(itemModal.spice)}</span>}
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{itemModal.desc}</p>

              {/* Badges — popular, halal, dietary tags */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {itemModal.popular && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(250,204,21,0.15)', color: '#FACC15', padding: '4px 10px', borderRadius: 8 }}>⭐ Popular</span>}
                {(itemModal.halal || (itemModal.dietary || []).includes('Halal-certified')) && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: 8 }}>☪️ Halal</span>}
                {(itemModal.dietary || []).filter(d => d !== 'Halal-certified').map(d => (
                  <span key={d} style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#86efac', padding: '4px 10px', borderRadius: 8 }}>🌱 {d}</span>
                ))}
                {itemModal.portion && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 8 }}>⚖️ {itemModal.portion}</span>}
                {itemModal.stock != null && itemModal.stock > 0 && itemModal.stock <= 5 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '4px 10px', borderRadius: 8 }}>Only {itemModal.stock} left</span>
                )}
              </div>
              {/* Materials warning — surfaces only if materials present */}
              {(itemModal.allergens || []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <span style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600 }}>Contains: {(itemModal.allergens || []).join(', ')}</span>
                </div>
              )}

              {/* Price + Qty */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {(() => {
                    const basePrice = itemModal.promoPrice || itemModal.price
                    const variantDelta = modalVariant ? (modalVariant.priceDelta || 0) : 0
                    const modifiersDelta = modalModifiers.reduce((s, m) => s + (m.priceDelta || 0), 0)
                    const livePrice = basePrice + variantDelta + modifiersDelta
                    if (itemModal.promoPrice && !modalVariant && modalModifiers.length === 0) {
                      return (
                        <>
                          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', marginRight: 8 }}>{fmt(itemModal.price)}</span>
                          <span style={{ fontSize: 24, fontWeight: 900, color: '#EF4444' }}>{fmt(itemModal.promoPrice)}</span>
                        </>
                      )
                    }
                    return <span style={{ fontSize: 24, fontWeight: 900, color: priceColor }}>{fmt(livePrice)}</span>
                  })()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', background: qtyBg, color: qtyColor, fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', minWidth: 28, textAlign: 'center' }}>{modalQty}</span>
                  <button onClick={() => setModalQty(modalQty + 1)} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', background: qtyBg, color: qtyColor, fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            </div>

            {/* Variants picker — required choice if item has variants */}
            {itemModal.variants && itemModal.variants.length > 0 && (
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Size · choose one</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {itemModal.variants.map(v => {
                    const isActive = modalVariant && modalVariant.id === v.id
                    return (
                      <button key={v.id} onClick={() => setModalVariant(v)} style={{
                        flex: '1 1 calc(50% - 4px)', minWidth: 100, padding: '10px 12px',
                        borderRadius: 12, border: '1px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.1)'),
                        background: isActive ? (isCustomAccent ? accent : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.04)',
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{v.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{v.priceDelta > 0 ? `+${fmt(v.priceDelta)}` : v.priceDelta < 0 ? fmt(v.priceDelta) : 'base'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Modifiers — optional multi-select */}
            {itemModal.modifiers && itemModal.modifiers.length > 0 && (
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Add-ons · optional</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {itemModal.modifiers.map(m => {
                    const isChecked = modalModifiers.some(x => x.id === m.id)
                    return (
                      <button key={m.id} onClick={() => setModalModifiers(p => isChecked ? p.filter(x => x.id !== m.id) : [...p, m])} style={{
                        padding: '10px 12px', borderRadius: 12,
                        border: '1px solid ' + (isChecked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'),
                        background: isChecked ? (isCustomAccent ? `${accent}30` : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.04)',
                        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(255,255,255,0.3)', background: isChecked ? (isCustomAccent ? accent : '#fff') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: isCustomAccent ? '#fff' : '#000', fontWeight: 900 }}>{isChecked && '✓'}</span>
                          {m.name}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: m.priceDelta > 0 ? '#FACC15' : 'rgba(255,255,255,0.5)' }}>{m.priceDelta > 0 ? `+${fmt(m.priceDelta)}` : m.priceDelta < 0 ? fmt(m.priceDelta) : 'free'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart button */}
            {shopOpen && itemModal.available && (() => {
              const basePrice = itemModal.promoPrice || itemModal.price
              const variantDelta = modalVariant ? (modalVariant.priceDelta || 0) : 0
              const modifiersDelta = modalModifiers.reduce((s, m) => s + (m.priceDelta || 0), 0)
              const unitPrice = basePrice + variantDelta + modifiersDelta
              const totalPriceForBtn = unitPrice * modalQty
              return (
                <div style={{ padding: '16px 12px 32px' }}>
                  <button
                    style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: isCustomAccent ? accent : '#8DC63F', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                    onClick={() => { addToCart(itemModal, modalQty, modalVariant, modalModifiers); setItemModal(null) }}
                  >
                    {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                    <span style={{ position: 'relative', zIndex: 1 }}>{t.addToCart || 'Add to Cart'} &middot; {fmt(totalPriceForBtn)}</span>
                  </button>
                </div>
              )
            })()}
          </div>
            )
          })()}
        </div>
      )}

      {/* ═══ VISIT US PAGE ═══ */}
      {showLocation && (() => {
        const DAYS = [
          { key: 'mon', en: 'Monday' }, { key: 'tue', en: 'Tuesday' }, { key: 'wed', en: 'Wednesday' },
          { key: 'thu', en: 'Thursday' }, { key: 'fri', en: 'Friday' }, { key: 'sat', en: 'Saturday' }, { key: 'sun', en: 'Sunday' }
        ]
        const todayKey = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key
        const todaySched = shopSchedule[todayKey]
        const closedDays = DAYS.filter(d => shopSchedule[d.key]?.off)

        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250 }}><DevBadge n={4} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setShowLocation(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopName}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{userDistance !== null ? `Distance ${userDistance} km` : 'Visit Us'}</div>
              </div>
            </div>

            {/* Page title */}
            <div style={{ padding: '4px 16px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Visit Us</div>
            </div>

            {/* Single info card */}
            <div style={{ margin: '0 14px 24px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: 20, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>

              {/* Logo + name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                {shopLogoStyle !== 'off' && shopLogo ? (
                  shopLogoStyle === 'bare' ? (
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 58, height: 58, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
                  ) : (
                    <div style={{ width: 68, height: 68, borderRadius: 34, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 58, height: 58, borderRadius: 29, objectFit: 'cover' }} />
                    </div>
                  )
                ) : shopLogoStyle !== 'off' ? (
                  <div style={{ width: 68, height: 68, borderRadius: 34, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{shopName.charAt(0).toUpperCase()}</div>
                ) : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{shopName}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{shopFoodType}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: shopOpen ? '#22c55e' : '#EF4444' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: shopOpen ? '#22c55e' : '#EF4444' }}>{shopOpen ? 'Open Now' : 'Closed'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledbbbbv-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{shopPhone}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
                {shopBio || `Welcome to ${shopName}! Fresh food prepared right in front of you.`}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

              {/* Today's hours + countdown */}
            {(() => {
              const now = new Date()
              const openStr = todaySched?.open || '17:00'
              const closeStr = todaySched?.close || '23:00'
              const [oh, om] = openStr.split(':').map(Number)
              const [ch, cm] = closeStr.split(':').map(Number)
              const openMin = oh * 60 + om
              const closeMin = ch * 60 + cm
              const nowMin = now.getHours() * 60 + now.getMinutes()
              const isOpen = !todaySched?.off && nowMin >= openMin && nowMin < closeMin
              const minsLeft = isOpen ? closeMin - nowMin : 0
              const hrsLeft = Math.floor(minsLeft / 60)
              const mLeft = minsLeft % 60
              const totalMins = closeMin - openMin
              const progress = isOpen && totalMins > 0 ? ((nowMin - openMin) / totalMins) : 0
              const circumference = 2 * Math.PI * 18
              const dashOffset = circumference * (1 - progress)
              const ringColor = isCustomAccent ? accent : '#22c55e'

              // Build open days summary (e.g. "Mon–Fri" or "Mon–Sat")
              const openDays = DAYS.filter(d => !shopSchedule[d.key]?.off)
              const openDayLabels = openDays.map(d => (t[d.en.toLowerCase()] || d.en).slice(0, 3))
              const dayRange = openDayLabels.length > 0 ? (openDayLabels.length === 7 ? 'Every day' : `${openDayLabels[0]}–${openDayLabels[openDayLabels.length - 1]}`) : ''

              return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Open Today Till {closeStr}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>From {openStr} · {dayRange}</div>
                  </div>
                  {!todaySched?.off && isOpen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                        <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                          <circle cx="16" cy="16" r="12" fill="none" stroke={ringColor} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 12} strokeDashoffset={(2 * Math.PI * 12) * (1 - progress)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: minsLeft <= 30 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>
                        {minsLeft <= 30 ? `${mLeft}m left` : `${hrsLeft}h ${mLeft}m`}
                      </span>
                    </div>
                  )}
                </div>
                {closedDays.length > 0 && (
                  <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 6 }}>
                    Closed on — {closedDays.map(d => (t[d.en.toLowerCase()] || d.en).slice(0, 3)).join(' / ')}
                  </div>
                )}
              </>
              )
            })()}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledsdasdvvvdsds-removebg-preview.png" alt="" onError={imgError('generic')} style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{shopAddress || 'Address not set'}</div>
                  {(shopCity || shopCountry) && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{[shopCity, shopCountry].filter(Boolean).join(', ')}</div>}
                  </div>
              </div>
              {shopMapsLink && (
                <a href={shopMapsLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 10, borderRadius: 10, marginTop: 10, background: isCustomAccent ? `${accent}25` : 'rgba(141,198,63,0.1)', border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(141,198,63,0.2)', textAlign: 'center', textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isCustomAccent ? '#fff' : '#8DC63F' }}>Open in Google Maps →</span>
                </a>
              )}

              {/* Social links */}
              {(shopInstagram || shopTiktok || shopFacebook || shopYoutube || shopWebsite) && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0 14px' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    {shopInstagram && (
                      <a href={`https://instagram.com/${shopInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/instagram/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopFacebook && (
                      <a href={shopFacebook.startsWith('http') ? shopFacebook : `https://facebook.com/${shopFacebook}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/facebook/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopTiktok && (
                      <a href={`https://tiktok.com/@${shopTiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/tiktok/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopYoutube && (
                      <a href={shopYoutube.startsWith('http') ? shopYoutube : `https://x.com/${shopYoutube.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://cdn.simpleicons.org/x/white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                    {shopWebsite && (
                      <a href={shopWebsite.startsWith('http') ? shopWebsite : `https://${shopWebsite}`} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: 12, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="https://api.iconify.design/mdi/web.svg?color=white" alt="" onError={imgError('generic')} style={{ width: 22, height: 22 }} />
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Delivery status */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0 12px' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: isCustomAccent ? accent : (delEnabled ? '#22c55e' : '#F59E0B') }}>{delEnabled ? 'Delivery Available' : 'Collection Only'}</span>
              </div>

            </div>{/* close single card */}
          </div>
        </div>
        )
      })()}

      {/* ═══ HERO TEXT EDITOR ═══ */}
      {heroEditor && (() => {
        const HERO_FONTS_E = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
        const HERO_SIZES_E = { normal: { title: 28, sub: 13, city: 9 }, large: { title: 34, sub: 16, city: 10 }, xl: { title: 40, sub: 19, city: 12 } }
        const szE = HERO_SIZES_E[heroSize] || HERO_SIZES_E.normal
        const ffE = HERO_FONTS_E[heroFont] || HERO_FONTS_E.system
        const subC = heroSubColor || (heroColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : heroColor)
        // Smart line break preview
        const maxChars = szE.title >= 34 ? 10 : 14
        const words = shopName.split(' ')
        const pLines = []
        let cur = ''
        words.forEach(w => { if (cur && (cur + ' ' + w).length > maxChars) { pLines.push(cur); cur = w } else { cur = cur ? cur + ' ' + w : w } })
        if (cur) pLines.push(cur)
        const lineWarning = pLines.length > 3
        const charWarning = shopName.length > 20

        const EFFECTS_LIST = [
          { id: 'shadow', label: 'Shadow', desc: 'Classic drop shadow' },
          { id: 'glow', label: 'Glow', desc: 'Soft color glow' },
          { id: 'runGlow', label: 'Pulse Glow', desc: 'Animated breathing glow' },
          { id: 'outline', label: 'Outline', desc: 'Hollow text with stroke' },
          { id: 'neon', label: 'Neon', desc: 'Neon sign flicker' },
          { id: 'none', label: 'None', desc: 'Clean, no effects' },
        ]
        const EFFECTS_PREVIEW = {
          shadow: { textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)' },
          glow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40` },
          runGlow: { textShadow: `0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40`, animation: 'heroRunGlow 3s ease-in-out infinite' },
          outline: { WebkitTextStroke: `2px ${heroColor}`, color: 'transparent' },
          neon: { textShadow: `0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}` },
          none: {},
        }
        const fxP = EFFECTS_PREVIEW[heroEffect] || EFFECTS_PREVIEW.shadow
        const COLOR_SWATCHES = ['#ffffff', '#f5f5f5', '#FACC15', '#FFD600', '#FF6B35', '#EF4444', '#8B0000', '#DC2626', '#22c55e', '#0D9488', '#3B82F6', '#1E40AF', '#8B5CF6', '#A855F7', '#F472B6', '#DB2777', '#000000', '#374151']

        const renderColorPicker = (current, setter, label) => (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
              {COLOR_SWATCHES.map(c => (
                <button key={c} onClick={() => setter(c)} style={{ width: 28, height: 28, borderRadius: 14, border: current === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, boxShadow: current === c ? '0 0 8px rgba(255,255,255,0.3)' : 'none' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input key={current} defaultValue={current} placeholder="#ffffff" maxLength={7} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setter(v) } }} />
              <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setter(v) }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Set</button>
            </div>
          </div>
        )

        return (
          <div style={{ position: 'absolute', inset: 0, zIndex: 500, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button onClick={() => setHeroEditor(false)} style={{ width: 36, height: 36, borderRadius: 18, background: accent, border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Hero Text Editor</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Customise your landing page brand</div>
              </div>
              <button onClick={() => setHeroEditor(false)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
            </div>

            {/* Live Preview — iPhone mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px', flexShrink: 0, background: '#0a0a0a' }}>
              <div style={{ position: 'relative' }}>
                {/* iPhone frame */}
                <div style={{ width: 200, height: 400, borderRadius: 30, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 12px 40px ${accent}20, 0 4px 16px rgba(0,0,0,0.3)`, border: '2px solid #333' }}>
                  {/* Side buttons */}
                  <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                  <div style={{ position: 'absolute', left: -3, top: 68, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
                  <div style={{ position: 'absolute', left: -3, top: 90, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
                  {/* Screen */}
                  <div style={{ width: '100%', height: '100%', borderRadius: 27, overflow: 'hidden', position: 'relative', background: '#000' }}>
                    {/* Dynamic island */}
                    <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 48, height: 14, background: '#000', borderRadius: 12, zIndex: 10 }} />
                    {/* Background image */}
                    <img src={localStorage.getItem('productslocal_themeBg') || ''} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
                    {/* Content */}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                      <style>{`
                        @keyframes heroRunGlow { 0%, 100% { text-shadow: 0 0 10px ${heroColor}80, 0 0 30px ${heroColor}40, 0 2px 4px rgba(0,0,0,0.9); } 50% { text-shadow: 0 0 20px ${heroColor}, 0 0 50px ${heroColor}60, 0 0 80px ${heroColor}30, 0 2px 4px rgba(0,0,0,0.9); } }
                        @keyframes heroNeonFlicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { text-shadow: 0 0 7px ${heroColor}, 0 0 10px ${heroColor}, 0 0 21px ${heroColor}, 0 0 42px ${heroColor}80; } 20%, 24%, 55% { text-shadow: none; } }
                      `}</style>
                      {/* Logo */}
                      {shopLogoStyle !== 'off' && shopLogo ? (
                        shopLogoStyle === 'bare' ? (
                          <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 6, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 26, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}>
                            <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 46, height: 46, borderRadius: 23, objectFit: 'cover' }} />
                          </div>
                        )
                      ) : shopLogoStyle !== 'off' ? (
                        <div style={{ width: 36, height: 36, borderRadius: 18, background: isCustomAccent ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}>{shopName.charAt(0).toUpperCase()}</div>
                      ) : null}
                      {/* Title lines */}
                      {pLines.map((line, i) => (
                        <div key={i} style={{ fontSize: szE.title, fontWeight: 800, color: heroEffect === 'outline' ? 'transparent' : heroColor, fontFamily: ffE, lineHeight: 1.15, letterSpacing: -0.5, textAlign: 'center', ...fxP }}>{line}</div>
                      ))}
                      {shopFoodType && <div style={{ fontSize: szE.sub, fontWeight: 600, color: subC, fontFamily: ffE, marginTop: 4, textShadow: '0 1px 3px rgba(0,0,0,0.9)', opacity: heroSubColor ? 1 : 0.85, textAlign: 'center' }}>{shopFoodType}</div>}
                      {(shopCity || shopCountry) && <div style={{ fontSize: szE.city, fontWeight: 600, color: subC, fontFamily: ffE, marginTop: 2, opacity: 0.7, textShadow: '0 1px 3px rgba(0,0,0,0.9)', textAlign: 'center' }}>{[shopCity, shopCountry].filter(Boolean).join(', ')}</div>}
                      {/* Mock View Menu button */}
                      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '6px 18px', borderRadius: 8, background: accent, fontSize: 10, fontWeight: 700, color: '#fff' }}>View Menu</div>
                    </div>
                    {/* Home indicator */}
                    <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                  </div>
                </div>
                {/* Line count badge */}
                <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: lineWarning ? '#EF4444' : '#22c55e', background: '#1a1a1a', padding: '3px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                  {pLines.length} line{pLines.length !== 1 ? 's' : ''}{lineWarning ? ' — too many!' : ''} · {shopName.length}/20
                </div>
              </div>
            </div>

            {/* Controls — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: '#111' }}>

              {/* Shop Name Input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Shop Name</span>
                  <span style={{ fontSize: 11, color: charWarning ? '#EF4444' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{shopName.length}/20</span>
                </div>
                <input value={shopName} maxLength={20} onChange={e => setShopName(e.target.value)} placeholder="Your shop name" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: charWarning ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, fontWeight: 700, outline: 'none', fontFamily: ffE }} />
                {lineWarning && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>Name will stack to {pLines.length} lines. Try shorter words or a smaller size.</div>}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Preview: {pLines.map((l, i) => (i > 0 ? ' / ' : '') + `"${l}"`)}</div>
              </div>

              {/* Size */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Size</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[{ id: 'normal', label: 'Normal', px: '42px' }, { id: 'large', label: 'Large', px: '52px' }, { id: 'xl', label: 'Extra Large', px: '62px' }].map(s => (
                  <button key={s.id} onClick={() => setHeroSize(s.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: heroSize === s.id ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: heroSize === s.id ? `${accent}20` : 'rgba(255,255,255,0.04)', color: heroSize === s.id ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    <div>{s.label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.px}</div>
                  </button>
                ))}
              </div>

              {/* Font */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Font</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
                {[
                  { id: 'system', label: 'Default', ff: '-apple-system, sans-serif' },
                  { id: 'nunito', label: 'Rounded', ff: '"Nunito", sans-serif' },
                  { id: 'poppins', label: 'Bold', ff: '"Poppins", sans-serif' },
                  { id: 'playfair', label: 'Elegant', ff: '"Playfair Display", serif' },
                  { id: 'caveat', label: 'Handwritten', ff: '"Caveat", cursive' },
                  { id: 'bebas', label: 'Street', ff: '"Bebas Neue", sans-serif' },
                ].map(f => (
                  <button key={f.id} onClick={() => setHeroFont(f.id)} style={{ padding: '10px 6px', borderRadius: 10, border: heroFont === f.id ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: f.ff, background: heroFont === f.id ? `${accent}20` : 'rgba(255,255,255,0.04)', color: heroFont === f.id ? '#fff' : 'rgba(255,255,255,0.4)' }}>{f.label}</button>
                ))}
              </div>

              {/* Effects */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Effect</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                {EFFECTS_LIST.map(fx => (
                  <button key={fx.id} onClick={() => setHeroEffect(fx.id)} style={{ padding: '10px 8px', borderRadius: 10, border: heroEffect === fx.id ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', background: heroEffect === fx.id ? `${accent}20` : 'rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: heroEffect === fx.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>{fx.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{fx.desc}</div>
                  </button>
                ))}
              </div>

              {/* Title Color */}
              {renderColorPicker(heroColor, setHeroColor, 'Title Color')}

              {/* Sub-text Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Sub-text Color</span>
                {heroSubColor && <button onClick={() => setHeroSubColor('')} style={{ background: 'none', border: 'none', color: accent, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Reset to auto</button>}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                {COLOR_SWATCHES.map(c => (
                  <button key={c} onClick={() => setHeroSubColor(c)} style={{ width: 28, height: 28, borderRadius: 14, border: heroSubColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', background: c, cursor: 'pointer', padding: 0, boxShadow: heroSubColor === c ? '0 0 8px rgba(255,255,255,0.3)' : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <input key={heroSubColor} defaultValue={heroSubColor} placeholder="Auto from title" maxLength={7} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setHeroSubColor(v) } }} />
                <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) setHeroSubColor(v) }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Set</button>
              </div>

              {/* Reset all */}
              <button onClick={() => { setHeroSize('normal'); setHeroFont('system'); setHeroColor('#ffffff'); setHeroSubColor(''); setHeroEffect('shadow') }} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>Reset All to Default</button>
            </div>
          </div>
        )
      })()}

      {/* ═══ THEME EDITOR ═══ */}
      {themeEditor && (() => {
        const [editorTool, setEditorTool] = [themeEditor.tool || 'position', (t) => setThemeEditor({ ...themeEditor, tool: t })]
        // Convert hex to HSL for the picker
        function hexToHsl(hex) {
          let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
          const max = Math.max(r,g,b), min = Math.min(r,g,b), l = (max+min)/2
          let h = 0, s = 0
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d/(2-max-min) : d/(max+min)
            if (max === r) h = ((g-b)/d + (g<b?6:0))/6
            else if (max === g) h = ((b-r)/d+2)/6
            else h = ((r-g)/d+4)/6
          }
          return [Math.round(h*360), Math.round(s*100), Math.round(l*100)]
        }
        function hslToHex(h,s,l) {
          s /= 100; l /= 100
          const a = s * Math.min(l, 1-l)
          const f = n => { const k = (n+h/30)%12; return Math.round(255*(l - a*Math.max(Math.min(k-3, 9-k, 1), -1))) }
          return '#' + [f(0),f(8),f(4)].map(x => x.toString(16).padStart(2,'0')).join('')
        }
        const [hue, sat, lit] = hexToHsl(editorColor)

        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#ffffff', display: 'flex', flexDirection: 'column' }}><DevBadge n={5} />
          <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-06_24_54-pm.png" alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Top bar — close + save */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>StreetLocal</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5 }}>Theme Editor</div>
            </div>
            <button onClick={() => setThemeEditor(null)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#8B0000', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>

          {/* Phone preview — centered, flex area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0, padding: '44px 48px' }}>
            <div style={{ width: 210, height: 420, borderRadius: 32, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 12px 40px ${editorColor}22, 0 4px 16px rgba(0,0,0,0.4)`, border: '2px solid #333' }}>
              {/* Side button */}
              <div style={{ position: 'absolute', right: -3, top: 75, width: 3, height: 26, borderRadius: '0 2px 2px 0', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 62, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 82, width: 3, height: 16, borderRadius: '2px 0 0 2px', background: '#333' }} />
              {/* Screen */}
              <div style={{ width: '100%', height: '100%', borderRadius: 25, overflow: 'hidden', position: 'relative', background: '#000' }}>
                <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 46, height: 14, background: '#000', borderRadius: 14, zIndex: 5 }} />
                <img src={themeEditor.url} alt="" onError={imgError('theme')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${editorPos.x}% ${editorPos.y}%`, transition: 'object-position 0.2s ease' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  {shopLogo ? (
                    <div style={{ width: 72, height: 72, borderRadius: 36, background: editorColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)', transition: 'background 0.2s' }}>
                      <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 62, height: 62, borderRadius: 31, objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 36, background: editorColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}>{shopName.charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.8)', textAlign: 'center', padding: '0 10px' }}>{shopName}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{shopFoodType}</div>
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '6px 20px', borderRadius: 8, background: editorColor, fontSize: 9, fontWeight: 700, color: '#fff', transition: 'background 0.2s' }}>View Menu</div>
                </div>
                <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 3 }} />
              </div>
            </div>
            {/* Arrow buttons around the phone — moves image in arrow direction */}
            {/* Top — image moves up (decrease y) */}
            <button onClick={() => setEditorPos(p => ({ ...p, y: Math.min(100, p.y + 5) }))} style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>↑</button>
            {/* Bottom — image moves down (increase y) */}
            <button onClick={() => setEditorPos(p => ({ ...p, y: Math.max(0, p.y - 5) }))} style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>↓</button>
            {/* Left — image moves left (increase x) */}
            <button onClick={() => setEditorPos(p => ({ ...p, x: Math.min(100, p.x + 5) }))} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>←</button>
            {/* Right — image moves right (decrease x) */}
            <button onClick={() => setEditorPos(p => ({ ...p, x: Math.max(0, p.x - 5) }))} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>→</button>
          </div>

          {/* Footer — Reset + Color picker button */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 24px', gap: 12 }}>
            <button onClick={() => {
              setShopTheme('custom'); setShopAccentColor(editorColor)
              localStorage.setItem('productslocal_theme', 'custom'); localStorage.setItem('productslocal_themeBg', themeEditor.url)
              localStorage.setItem('productslocal_accentColor', editorColor); localStorage.setItem('productslocal_bgPos', JSON.stringify(editorPos))
              const bgImg = document.getElementById('app-bg-img')
              if (bgImg) { bgImg.src = themeEditor.url; bgImg.style.objectFit = 'cover'; bgImg.style.objectPosition = `${editorPos.x}% ${editorPos.y}%` }
              setThemeEditor(null); setShowLanding(true)
            }} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: editorColor, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' }}>Save Theme</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setEditorTool(editorTool === 'color' ? 'position' : 'color')} style={{ width: 48, height: 48, borderRadius: 24, border: `2px solid ${editorColor}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: editorColor }} />
            </button>
          </div>

          {/* Color Swatch Drawer — slides from left */}
          {editorTool === 'color' && (
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20 }} onClick={() => setEditorTool('position')} />
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', background: '#111', zIndex: 21, overflowY: 'auto' }}>
                <div style={{ padding: '16px 12px 0', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Pick Color</span>
                    <button onClick={() => setEditorTool('position')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 8 }}>✕</button>
                  </div>
                  {/* Hex input — sticky under title */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: editorColor, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                    <input type="text" placeholder="#8B0000" defaultValue={editorColor} maxLength={7} style={{ flex: 1, padding: '7px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', outline: 'none' }} onKeyDown={(e) => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) { setEditorColor(v); setEditorBaseColor(v); setEditorTool('position') } } }} />
                    <button onClick={(e) => { const v = e.currentTarget.previousSibling.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) { setEditorColor(v); setEditorBaseColor(v); setEditorTool('position') } }} style={{ padding: '7px 10px', borderRadius: 6, border: 'none', background: editorColor, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Go</button>
                  </div>
                </div>
                <div style={{ padding: '0 8px 20px' }}>
                  {[
                    { label: 'Red', h: 0 },
                    { label: 'Crimson', h: 345 },
                    { label: 'Rose', h: 330 },
                    { label: 'Pink', h: 315 },
                    { label: 'Magenta', h: 300 },
                    { label: 'Fuchsia', h: 285 },
                    { label: 'Purple', h: 270 },
                    { label: 'Violet', h: 255 },
                    { label: 'Indigo', h: 240 },
                    { label: 'Blue', h: 220 },
                    { label: 'Sky', h: 200 },
                    { label: 'Cyan', h: 185 },
                    { label: 'Teal', h: 170 },
                    { label: 'Mint', h: 155 },
                    { label: 'Green', h: 140 },
                    { label: 'Emerald', h: 120 },
                    { label: 'Lime', h: 90 },
                    { label: 'Chartreuse', h: 75 },
                    { label: 'Yellow', h: 55 },
                    { label: 'Gold', h: 45 },
                    { label: 'Amber', h: 35 },
                    { label: 'Orange', h: 25 },
                    { label: 'Vermilion', h: 12 },
                    { label: 'Brown', h: 20, sat: 60 },
                    { label: 'Maroon', h: 0, sat: 70 },
                    { label: 'Grey', h: 0, sat: 0 },
                    { label: 'Cool Grey', h: 210, sat: 10 },
                  ].map((row, ri) => {
                    const s = row.sat !== undefined ? row.sat : 80
                    const shades = row.sat === 0 || row.sat === 10
                      ? [12, 25, 40, 55, 72, 88].map(l => hslToHex(row.h, row.sat, l))
                      : [18, 30, 42, 54, 66, 80].map(l => hslToHex(row.h, l < 25 ? s + 10 : l > 70 ? s - 20 : s, l))
                    return (
                      <div key={ri} style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 2, paddingLeft: 2 }}>{row.label}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {shades.map((c, ci) => (
                            <button key={ci} onClick={() => { setEditorColor(c); setEditorBaseColor(c); setEditorTool('position') }} style={{
                              flex: 1, height: 36, borderRadius: 6, border: editorColor === c ? '2px solid #fff' : 'none',
                              background: c, cursor: 'pointer', padding: 0, minWidth: 0,
                            }} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div></div>
        )
      })()}

      {/* ═══ CHECKOUT PAGE ═══ */}
      {checkoutOpen && (() => {
        const qtyBg = isCustomAccent ? accent : '#FACC15'
        const qtyColor = isCustomAccent ? '#fff' : '#000'
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}><DevBadge n={6} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', flexShrink: 0 }}>
              <button onClick={() => setCheckoutOpen(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{shopName}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t.checkout || 'Checkout'}</div>
              </div>
              {!orderDone && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{cart.reduce((s, c) => s + c.qty, 0)} items</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmt(totalPrice)}</div>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 0' }}>
              {!orderDone ? (
                <>
                  {/* Cart items */}
                  {cart.map((c) => (
                    <div key={c.id} style={{ display: 'flex', gap: 12, padding: 12, marginBottom: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 16, position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)', ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
                      <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, border: 'none', background: accent, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>
                      <img src={c.photo || PLACEHOLDER_SM} alt="" onError={imgError('food')} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 20 }}>{c.name}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#FACC15', marginTop: 4 }}>{fmt(c.price * c.qty)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <button onClick={() => { if (c.qty > 1) setCart(cart.map(x => x.id === c.id ? { ...x, qty: x.qty - 1 } : x)) }} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: qtyBg, color: qtyColor, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: c.qty <= 1 ? 0.3 : 1 }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', minWidth: 18, textAlign: 'center' }}>{c.qty}</span>
                          <button onClick={() => setCart(cart.map(x => x.id === c.id ? { ...x, qty: x.qty + 1 } : x))} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: qtyBg, color: qtyColor, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>{t.cartEmpty || 'Your cart is empty'}</p>
                  )}

                  {/* Order note */}
                  {cart.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 14, marginTop: 4, marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>Order Note</label>
                      <textarea
                        placeholder="Extra spicy, no onions..."
                        style={{ ...S.input, minHeight: 50, resize: 'none', marginBottom: 0, fontSize: 13 }}
                        id="orderNote"
                      />
                    </div>
                  )}

                  {/* Summary */}
                  {cart.length > 0 && (
                    <div style={{ background: isCustomAccent ? `${accent}25` : 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 14, border: isCustomAccent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.06)' }}>
                      {cart.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                          <span>{c.name} x{c.qty}</span>
                          <span>{fmt(c.price * c.qty)}</span>
                        </div>
                      ))}
                      {delEnabled ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6 }}>
                          <span>Delivery ({deliveryZone.label})</span>
                          <span>{deliveryZone.fee > 0 ? fmt(deliveryZone.fee) : 'Free'}</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isCustomAccent ? accent : '#F59E0B', background: isCustomAccent ? `${accent}25` : 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 6 }}>Collection Only</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{t.total || 'Total'}</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmt(totalPrice + (delEnabled ? (deliveryZone.fee || 0) : 0))}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Order Confirmation */
                <div style={{ textAlign: 'center', padding: '60px 16px' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 40, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <span style={{ fontSize: 36 }}>✓</span>
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, color: '#fff' }}>{t.orderSent || 'Order Sent!'}</h2>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15', marginBottom: 10 }}>{fmt(totalPrice + (delEnabled ? (deliveryZone.fee || 0) : 0))}</div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
                    {t.orderSentMsg || 'Your order has been sent via WhatsApp. The vendor will confirm shortly.'}
                  </p>
                  {/* QRIS Payment QR — if vendor uploaded */}
                  {shopQris && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Scan to Pay</div>
                      <div style={{ background: '#fff', borderRadius: 20, padding: 14, display: 'inline-block' }}>
                        <img src={shopQris} alt="QRIS" onError={imgError('qr')} style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 12 }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>QRIS — GoPay, OVO, DANA, ShopeePay, Bank</div>
                    </div>
                  )}

                  <button style={{ padding: '14px 40px', borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: -30 }} onClick={() => { setCheckoutOpen(false); setCart([]); setOrderDone(false) }}>
                    Back To Menu
                  </button>
                  <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfffddfsdfsdfff-removebg-preview.png" alt="" onError={imgError('generic')} style={{ position: 'fixed', bottom: 16, right: 16, width: 100, height: 'auto', opacity: 0.8, pointerEvents: 'none' }} />
                </div>
              )}
            </div>

            {/* Order button — fixed bottom */}
            {!orderDone && cart.length > 0 && (
              <div style={{ padding: '12px 14px 24px', flexShrink: 0 }}>
                <button
                  style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: accent, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={sendWhatsApp}
                >
                  {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                  <span style={{ position: 'relative', zIndex: 1 }}>Order WhatsApp — {fmt(totalPrice + (delEnabled ? (deliveryZone.fee || 0) : 0))}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        )
      })()}


      {/* ═══ PAYMENT METHODS — vendor connects their own gateways ═══ */}
      {isVendor && paymentMethodsOpen && (() => {
        const connectedCount = SUPPORTED_GATEWAYS.filter(g => paymentGateways[g.id]?.connected).length
        const liveOnes = SUPPORTED_GATEWAYS.filter(g => paymentGateways[g.id]?.connected)
        const availableOnes = SUPPORTED_GATEWAYS.filter(g => !paymentGateways[g.id]?.connected)
        // Clean fintech list row — no card chrome, just dotted divider between rows.
        // Brand color is preserved only on the small logo chip. App background bleeds through.
        const renderCard = (g, isLive, isLast) => (
          <button key={g.id} type="button" onClick={() => !g.comingSoon && setSetupGatewayId(g.id)} disabled={g.comingSoon}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '14px 4px', border: 'none', background: 'transparent', cursor: g.comingSoon ? 'not-allowed' : 'pointer',
              borderBottom: isLast ? 'none' : '1px dashed rgba(255,255,255,0.10)',
              opacity: g.comingSoon ? 0.45 : 1,
              transition: 'background 120ms ease',
            }}
          >
            {/* Logo chip — keeps brand color identity */}
            <div style={{ width: 38, height: 38, borderRadius: 10, background: g.color, color: '#fff', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 6px ${g.color}40`, overflow: 'hidden' }}>
              {g.logoUrl
                ? <img src={g.logoUrl} alt={g.name} onError={(e) => { e.currentTarget.parentElement.textContent = g.name.charAt(0) }} style={{ width: 24, height: 24, objectFit: 'contain', filter: 'brightness(1.1)' }} />
                : g.name.charAt(0)
              }
            </div>

            {/* Middle column — name + tagline + country count */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.1 }}>{g.name}</span>
                {isLive && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(34,197,94,0.18)', color: '#86efac', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>LIVE</span>}
                {g.tier === 'enterprise' && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(168,85,247,0.16)', color: '#D8B4FE', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>ENTERPRISE</span>}
                {g.comingSoon && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(245,158,11,0.18)', color: '#FCD34D', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>SOON</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginBottom: 2 }}>{g.tagline}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{g.countryCount}</div>
            </div>

            {/* Right arrow — high-end "tap to enter" affordance */}
            <div style={{ flexShrink: 0, color: g.comingSoon ? 'rgba(255,255,255,0.2)' : (isLive ? '#22c55e' : 'rgba(255,255,255,0.5)'), fontSize: 20, fontWeight: 300, lineHeight: 1, paddingRight: 4 }}>
              {g.comingSoon ? '·' : '›'}
            </div>
          </button>
        )
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* App theme background + glass overlay (matches the rest of the app) */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 0 }} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          {/* Scrollable foreground content */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {/* Header — transparent, no dark container */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
            <button onClick={() => setPaymentMethodsOpen(false)} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${accent}40` }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Payment Methods</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{connectedCount} of {SUPPORTED_GATEWAYS.filter(g => !g.comingSoon).length} active · funds go to your accounts</div>
            </div>
          </div>

          {/* Trust banner */}
          <div style={{ margin: '12px 16px 0', padding: '12px 14px', borderRadius: 14, background: `linear-gradient(135deg, ${accent}18 0%, rgba(0,0,0,0.35) 100%)`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🔒</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Your money goes directly to you</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>StreetLocal never holds or processes your funds. Each gateway sends payouts straight to your own account. We're just the checkout UI.</div>
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: isCustomAccent ? accent : 'rgba(255,255,255,0.4)', marginBottom: 14, marginTop: 4 }} />

            {liveOnes.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(34,197,94,0.85)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                  Live · Accepting Payments
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '4px 14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 18 }}>
                  {liveOnes.map((g, i) => renderCard(g, true, i === liveOnes.length - 1))}
                </div>
              </>
            )}

            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Available</div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '4px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {availableOnes.map((g, i) => renderCard(g, false, i === availableOnes.length - 1))}
            </div>

            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>How payments work</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
                1. Sign up directly with the gateway (Stripe, Midtrans, etc.)<br />
                2. Paste your keys / account ID here<br />
                3. Customers checkout in your app and pay via the gateway<br />
                4. Funds go straight into your own gateway account<br />
                5. You manage refunds, disputes, and payouts from the gateway's dashboard
              </div>
            </div>
          </div>
          </div>{/* close scrollable foreground */}
        </div>
        )
      })()}

      {/* ═══ GATEWAY SETUP — full page (matches Order Alerts chrome) ═══ */}
      {isVendor && setupGatewayId && (() => {
        const gw = SUPPORTED_GATEWAYS.find(g => g.id === setupGatewayId)
        if (!gw) return null
        const current = paymentGateways[gw.id] || {}
        const updateField = (key, value) => setPaymentGateways(p => ({ ...p, [gw.id]: { ...(p[gw.id] || {}), [key]: value } }))
        const isConnected = !!current.connected
        const save = () => {
          const missing = gw.fields.filter(f => f.required && !(current[f.key] || '').toString().trim())
          if (missing.length) { alert('Required: ' + missing.map(m => m.label).join(', ')); return }
          setPaymentGateways(p => ({ ...p, [gw.id]: { ...(p[gw.id] || {}), connected: true, mode: current.mode || 'test', connectedAt: new Date().toISOString() } }))
          setSetupGatewayId(null)
        }
        const disconnect = () => {
          if (!confirm(`Disconnect ${gw.name}? Your keys will be removed and payments via this gateway will stop working.`)) return
          setPaymentGateways(p => { const next = { ...p }; delete next[gw.id]; return next })
          setSetupGatewayId(null)
        }
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* App theme background — clear, no blur overlay on setup page */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', zIndex: 0 }} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {/* Header — transparent, no shade */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
            <button onClick={() => setSetupGatewayId(null)} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${accent}40` }}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {gw.name}
                {isConnected && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(34,197,94,0.22)', color: '#22c55e', padding: '2px 7px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.4)' }}>CONNECTED</span>}
                {gw.tier === 'enterprise' && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(168,85,247,0.18)', color: '#C084FC', padding: '2px 7px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.35)' }}>ENTERPRISE</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{gw.countryCount} active</div>
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: gw.color, marginBottom: 2 }} />

            {/* Brand hero card */}
            <div style={{ background: `linear-gradient(135deg, ${gw.color}28 0%, rgba(0,0,0,0.4) 100%)`, border: `1px solid ${gw.color}40`, borderRadius: 16, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: `0 4px 18px ${gw.color}30` }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: gw.color, color: '#fff', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${gw.color}55`, overflow: 'hidden' }}>
                {gw.logoUrl
                  ? <img src={gw.logoUrl} alt={gw.name} onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: 32, height: 32, objectFit: 'contain', filter: 'brightness(1.1)' }} />
                  : gw.name.charAt(0)
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{gw.tagline}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Best for: {gw.bestFor}</div>
              </div>
            </div>

            {/* Country availability — count only, no flags */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>🌍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>Coverage</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{gw.countryCount} active</div>
              </div>
            </div>

            {/* Setup steps */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>How to set up</div>
              {gw.setupSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 10, background: `${gw.color}30`, border: `1px solid ${gw.color}60`, color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, lineHeight: 1.55 }}>{s}</span>
                </div>
              ))}
              {gw.docUrl && (
                <a href={gw.docUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '8px 12px', borderRadius: 10, background: `${gw.color}25`, border: `1px solid ${gw.color}45`, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Open {gw.name} dashboard ↗
                </a>
              )}
            </div>

            {/* Test/Live mode + Fields */}
            <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Your credentials</div>

              {/* Test/Live mode pill */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 3, borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {['test', 'live'].map(m => (
                  <button key={m} onClick={() => updateField('mode', m)} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: (current.mode || 'test') === m ? (m === 'live' ? '#22C55E' : 'rgba(255,255,255,0.15)') : 'transparent',
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{m === 'test' ? '🧪 Test' : '🚀 Live'}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 1.5 }}>
                {(current.mode || 'test') === 'test'
                  ? 'Test mode uses fake transactions. Use it to verify the setup before going live.'
                  : '⚠️ Live mode processes real customer payments. Make sure your business is fully verified with the gateway.'}
              </div>

              {/* Form fields */}
              {gw.fields.map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
                    {f.label} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
                    {f.secret && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>🔒 encrypted</span>}
                  </label>
                  {f.type === 'bank-picker' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 4 }}>
                      {ID_BANKS.map(b => {
                        const picked = current.bankName === b.name
                        return (
                          <button key={b.code} type="button" onClick={() => updateField('bankName', b.name)} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 10, minHeight: 44,
                            background: picked ? `${accent}25` : 'rgba(255,255,255,0.04)',
                            border: picked ? `1px solid ${accent}60` : '1px solid rgba(255,255,255,0.08)',
                            color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                          }}>
                            {b.logo
                              ? <img src={b.logo} alt={b.name} onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: 24, height: 16, objectFit: 'contain', flexShrink: 0, background: '#fff', borderRadius: 3, padding: 2 }} />
                              : <span style={{ width: 24, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>🏦</span>
                            }
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      type={f.type === 'password' ? 'password' : (f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'number' ? 'number' : 'text')}
                      placeholder={f.placeholder || ''}
                      value={current[f.key] || ''}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
                        color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                        fontFamily: f.secret ? 'monospace' : 'inherit',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingBottom: 24 }}>
              {isConnected && (
                <button onClick={disconnect} style={{
                  padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 48,
                }}>Disconnect</button>
              )}
              <button onClick={save} style={{
                flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${gw.color} 0%, ${gw.color}dd 100%)`,
                color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 48,
                boxShadow: `0 4px 14px ${gw.color}55`,
              }}>
                {isConnected ? `Update ${gw.name}` : `Connect ${gw.name}`}
              </button>
            </div>
          </div>
          </div>{/* close scrollable foreground */}
        </div>
        )
      })()}

      {/* ═══ VENDOR SIDE DRAWER ═══ */}
      {vendorDrawer && (
        <>
          <DevBadge n={7} />
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }} onClick={() => setVendorDrawer(false)} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '75vw', maxWidth: 320, background: '#0a0a0a', zIndex: 501, overflowY: 'auto', overflowX: 'hidden', borderLeft: isCustomAccent ? `2px solid ${accent}30` : '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header with logo */}
            <div style={{ padding: '20px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {shopLogo ? (
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }}>
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{shopName.charAt(0).toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{shopName}</div>
                  <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 1 }}>{shopFoodType}</div>
                </div>
                <button onClick={() => setVendorDrawer(false)} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {/* Shop status toggle */}
            <div style={{ margin: '0 16px 12px', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: shopOpen ? '#22c55e' : '#EF4444' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: shopOpen ? '#22c55e' : '#EF4444' }}>{shopOpen ? 'Shop Open' : 'Shop Closed'}</span>
                </div>
                <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{shopOpen ? 'Accepting orders' : 'Orders paused'}</span>
              </div>
              <button style={{ ...S.toggle(shopOpen), background: shopOpen ? accent : 'rgba(255,255,255,0.15)' }} onClick={() => setShopOpen(!shopOpen)}>
                <div style={S.toggleDot(shopOpen)} />
              </button>
            </div>

            {/* Preview link */}
            <div style={{ padding: '0 16px 12px', textAlign: 'center' }}>
              <button onClick={() => { setPreviewMode(true); setIsVendor(false); setShowLanding(true); setVendorDrawer(false) }} style={{ background: 'none', border: 'none', color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 4 }}>
                Preview as Customer →
              </button>
            </div>

            {/* Navigation items */}
            <div style={{ padding: '0 16px' }}>
              {[
                { icon: '⚙️', label: 'My Shop', desc: 'Name, phone, hours, socials', onClick: () => { setShopConfig(true); setVendorDrawer(false) } },
                { icon: '🎨', label: 'Design Studio', desc: 'Layout, effects, branding', onClick: () => { setDesignStudio(true); setVendorDrawer(false) } },
                { icon: '🖼️', label: 'Themes', desc: 'Browse & apply app themes', onClick: () => { setThemeBrowser(true); setVendorDrawer(false) } },
                { icon: '🛵', label: 'Delivery', desc: 'Rates, distance, collection', onClick: () => { setShowDeliverySettings(true); setVendorDrawer(false) } },
                { icon: '🌐', label: 'Domains', desc: 'Custom domain for your app', onClick: () => { setDomainPage(true); setVendorDrawer(false) } },
                { icon: '📋', label: 'Terms Of Listing', desc: 'Search listing requirements', onClick: () => { setTermsOfListing(true); setVendorDrawer(false) } },
                { icon: '💳', label: 'Payment Methods', desc: 'Connect Stripe, Midtrans, PayPal, bank', onClick: () => { setPaymentMethodsOpen(true); setVendorDrawer(false) } },
              ].map(item => (
                <button key={item.label} onClick={item.onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 0', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: isCustomAccent ? `${accent}20` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{item.desc}</div>
                  </div>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>›</span>
                </button>
              ))}
            </div>

            {/* Design Studio link */}
            <div style={{ padding: '0 16px 12px' }}>
              <button onClick={() => { setDesignStudio(true); setVendorDrawer(false) }} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${accent}40`, background: `${accent}10`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎨</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Design Studio</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Theme, layout, effects, branding</div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
              </button>
            </div>

            {/* HIDDEN — Theme Backgrounds (kept for reference, moved to Design Studio) */}
            {false && (() => {
              const langCountries = LANG_TO_COUNTRIES[nativeLang] || []
              const { byFoodType, byCountry, rest } = getFilteredThemes(countryCode, shopFoodType, langCountries)

              const renderThemeCard = (theme) => (
                <div key={theme.id} style={{ flexShrink: 0, width: 160, position: 'relative' }}>
                  <button onClick={() => {
                    setShopTheme(theme.id)
                    setShopAccentColor(theme.accent || '#8DC63F')
                    localStorage.setItem('productslocal_theme', theme.id)
                    localStorage.setItem('productslocal_themeBg', theme.img)
                    localStorage.setItem('productslocal_accentColor', theme.accent || '#8DC63F')
                    const bgImg = document.getElementById('app-bg-img')
                    if (bgImg) bgImg.src = theme.img
                    setVendorDrawer(false)
                    setShowLanding(true)
                  }} style={{ border: shopTheme === theme.id ? '3px solid #FFD600' : '3px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'none', width: '100%' }}>
                    <div style={{ width: '100%', height: 240, position: 'relative' }}>
                      <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: shopTheme === theme.id ? '#FFD600' : '#888', padding: '6px 0', textAlign: 'center', background: shopTheme === theme.id ? 'rgba(255,214,0,0.1)' : '#111' }}>
                      {shopTheme === theme.id ? '✓ ' : ''}{theme.label}
                    </div>
                  </button>
                  <div onClick={(e) => { e.stopPropagation(); setThemeEditor({ url: theme.img }); setEditorColor(theme.accent || '#8DC63F'); setEditorBaseColor(theme.accent || '#8DC63F'); setShopTheme(theme.id); setShopAccentColor(theme.accent || '#8DC63F'); localStorage.setItem('productslocal_theme', theme.id); localStorage.setItem('productslocal_themeBg', theme.img); localStorage.setItem('productslocal_accentColor', theme.accent || '#8DC63F'); const bgImg = document.getElementById('app-bg-img'); if (bgImg) bgImg.src = theme.img; setVendorDrawer(false) }} style={{ position: 'absolute', top: -6, right: -6, width: 30, height: 30, borderRadius: 15, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#1a1a1a', lineHeight: 1 }}>DEV</span>
                  </div>
                </div>
              )

              return (
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 4 }}>App Theme</h3>

                  {/* Section 1: Recommended for your food type */}
                  {byFoodType.length > 0 && (
                    <>
                      <p style={{ fontSize: 14, color: accent, fontWeight: 700, marginBottom: 8, marginTop: 12 }}>Recommended for {shopFoodType}</p>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                        {byFoodType.map(renderThemeCard)}
                      </div>
                    </>
                  )}

                  {/* Section 2: Popular in your region */}
                  {byCountry.length > 0 && (
                    <>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 8, marginTop: 8 }}>Popular in your region</p>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                        {byCountry.filter(t => !byFoodType.some(f => f.id === t.id)).map(renderThemeCard)}
                      </div>
                    </>
                  )}

                  {/* Section 3: All themes */}
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 8, marginTop: 8 }}>All Themes ({THEME_PRESETS.length})</p>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                    {THEME_PRESETS.filter(t => !byFoodType.some(f => f.id === t.id) && !byCountry.some(c => c.id === t.id)).map(renderThemeCard)}
                  </div>

                  {/* Custom upload */}
                  <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }`}</style>
                  <label style={{ display: 'block', marginTop: 10, padding: '14px', borderRadius: 14, border: 'none', background: '#FFD600', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#1a1a1a', animation: 'shake 3s ease-in-out infinite' }}>
                    Upload your own background
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      const url = await uploadMenuImage(vendorId, file)
                      if (url) {
                        setEditorColor(shopAccentColor)
                        setEditorPos({ x: 50, y: 50 })
                        setThemeEditor({ url })
                        setVendorDrawer(false)
                      }
                    }} />
                  </label>

                  {/* Custom services */}
                  <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: `${accent}10`, border: `1px solid ${accent}25` }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: accent, marginBottom: 12 }}>Professional Services</h4>

                    {/* Custom Theme */}
                    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.3)', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Custom Theme</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>Rp 100.000</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>Exclusive background designed for your brand. Not shared with others. Unlimited revisions.</div>
                      <a href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi! I'd like a custom theme.\n\nShop: ${shopName}\nFood Type: ${shopFoodType}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Order Theme — WhatsApp</a>
                    </div>

                    {/* Custom Logo */}
                    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Custom Logo</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>Rp 50.000</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>Professional logo designed for your food business. Includes round format optimized for your app.</div>
                      <a href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi! I'd like a custom logo.\n\nShop: ${shopName}\nFood Type: ${shopFoodType}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Order Logo — WhatsApp</a>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Logout */}
            <div style={{ padding: '16px' }}>
              <button onClick={() => { setIsVendor(false); setVendorDrawer(false) }} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Logout
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Powered by </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>StreetLocal</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ DELIVERY SETTINGS ═══ */}
      {showDeliverySettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setShowDeliverySettings(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Delivery Settings</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
            </div>

            {/* Main card */}
            {(() => {
              const isIndonesia = shopCountry === 'Indonesia' || shopCountry === '' || delCurrency === 'Rp'
              return (
              <>
              <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
                {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

                {/* Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: delEnabled ? accent : '#F59E0B' }}>{delEnabled ? 'Delivery Available' : 'Collection Only'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{delEnabled ? 'Customers will see delivery fees' : 'Customers collect from your location'}</div>
                  </div>
                  <button style={{ ...S.toggle(delEnabled), background: delEnabled ? accent : 'rgba(255,255,255,0.15)' }} onClick={() => setDelEnabled(!delEnabled)}>
                    <div style={S.toggleDot(delEnabled)} />
                  </button>
                </div>
              </div>

              {delEnabled && (
                <>
                  {/* Government rates notice — Indonesia only */}
                  {isIndonesia && (
                    <div style={{ margin: '0 14px 12px', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', marginBottom: 4 }}>Tarif Ojol Resmi — {shopCity || 'Indonesia'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        Rates are pre-set based on Indonesian government regulated ride-hailing tariffs (Kemenhub). You can adjust if needed.
                      </div>
                    </div>
                  )}

                  {/* Rate settings card */}
                  <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Delivery Rates</div>

                    {/* Min Fee + Per KM — the two main rates */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Min Fare</label>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Starting price for the first km</div>
                        <input type="number" value={delMinCharge} onChange={e => setDelMinCharge(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 800 }} />
                        {delMinCharge > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{delCurrency} {fmt(delMinCharge).replace('Rp ', '')}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Per KM</label>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Extra charge for each km after min distance</div>
                        <input type="number" value={delPerKm} onChange={e => setDelPerKm(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 800 }} />
                        {delPerKm > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{delCurrency} {fmt(delPerKm).replace('Rp ', '')}/km</div>}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

                    {/* Advanced settings */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Min Distance (km)</label>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Flat rate covers this distance</div>
                        <input type="number" value={delMinKm} onChange={e => setDelMinKm(parseInt(e.target.value) || 1)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Max Distance (km)</label>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Furthest you will deliver</div>
                        <input type="number" value={delMaxKm} onChange={e => setDelMaxKm(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      {!isIndonesia && (
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Currency</label>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Your local currency symbol</div>
                          <input type="text" value={delCurrency} onChange={e => setDelCurrency(e.target.value)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Free Above (0=off)</label>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Free delivery if order exceeds this amount</div>
                        <input type="number" value={delFreeAbove} onChange={e => setDelFreeAbove(parseInt(e.target.value) || 0)} style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    </div>

                    {/* Summary */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        First {delMinKm}km = <strong style={{ color: '#FACC15' }}>{delCurrency} {fmt(delMinCharge).replace('Rp ', '')}</strong> flat
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        After {delMinKm}km = <strong style={{ color: '#FACC15' }}>+{delCurrency} {fmt(delPerKm).replace('Rp ', '')}</strong> per km
                      </div>
                      {delFreeAbove > 0 && (
                        <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginTop: 4 }}>
                          Free delivery on orders above {delCurrency} {fmt(delFreeAbove).replace('Rp ', '')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reset button */}
                  {isIndonesia && (
                    <div style={{ margin: '0 14px 12px' }}>
                      <button onClick={() => {
                        const rates = getDeliveryDefaults('ID', shopCity)
                        setDelMinCharge(rates.minCharge); setDelMinKm(rates.minKm); setDelPerKm(rates.perKm); setDelMaxKm(rates.maxKm); setDelCurrency(rates.currency)
                      }} style={{ width: '100%', padding: 12, borderRadius: 14, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 14 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                        <span style={{ position: 'relative', zIndex: 1 }}>Reset to Indonesia Rates</span>
                      </button>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 6 }}>Based on Kemenhub regulated ojol tariffs</div>
                    </div>
                  )}

                  {/* Info for non-Indonesia */}
                  {!isIndonesia && (
                    <div style={{ margin: '0 14px 12px', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, textAlign: 'center' }}>
                        Set your own delivery rates based on local ride-hailing services in your area
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  <div style={{ margin: '0 14px 24px' }}>
                    <button onClick={() => setShowDeliverySettings(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                      Save Rates
                    </button>
                  </div>
                </>
              )}
              </>
              )
            })()}
          </div>
        </div>
      )}


      {/* ═══ VENDOR EDIT ITEM PAGE ═══ */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}><DevBadge n={8} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setEditItem(null)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Edit Item</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
            </div>

            {/* Live card preview */}
            <div style={{ padding: '0 14px 12px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textAlign: 'center', fontWeight: 600 }}>Preview — how customers will see it</div>
              <div style={{ ...S.card, margin: 0, ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
                <label style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: formPhoto ? 'none' : `2px dashed ${accent}40`, background: formPhoto ? 'none' : 'rgba(0,0,0,0.4)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {formPhoto ? (
                    <>
                      <img src={formPhoto} alt="" onError={imgError('food')} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 19, background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 18, lineHeight: 1, display: 'block' }}>📷</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: accent, gap: 2 }}>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ fontSize: 9, fontWeight: 700 }}>Add Photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (supabase && vendorId && !String(vendorId).startsWith('local')) {
                      const url = await uploadMenuImage(vendorId, file)
                      if (url) { setFormPhoto(url); return }
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      const img = new Image()
                      img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const max = 600
                        let w = img.width, h = img.height
                        if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
                        canvas.width = w; canvas.height = h
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                        setFormPhoto(canvas.toDataURL('image/jpeg', 0.7))
                      }
                      img.src = reader.result
                    }
                    reader.readAsDataURL(file)
                  }} />
                </label>
                {formPopular && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
                <div style={{ ...S.cardBody }}>
                  <div style={S.cardName}>{formName || 'Item Name'}{formSpice > 0 && <span style={{ marginLeft: 4 }}>{'🌶️'.repeat(formSpice)}</span>}</div>
                  <div style={S.cardDesc}>{formDesc || 'Description...'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {formHalal && <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>Halal</span>}
                    {formPriceMode === 'promo' && formPromoPrice ? (
                      <>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{fmt(Number(formPrice) || 0)}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{fmt(Number(formPromoPrice) || 0)}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{formPrice ? fmt(Number(formPrice)) : 'Rp 0'}</span>
                    )}
                  </div>
                </div>
                {formPhoto && <button onClick={(e) => { e.preventDefault(); setFormPhoto('') }} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              </div>
            </div>

            {/* Form card */}
            <div style={{ margin: '0 14px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

              {/* Item name */}
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Item Name <span style={{ color: formName.length >= 25 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formName.length}/25)</span></label>
              <input style={{ ...S.input, fontSize: 15, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. Nasi Goreng" maxLength={25} value={formName} onChange={(e) => setFormName(e.target.value)} />

              {/* Category + Spice */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Category</span>
                    <button type="button" onClick={() => setVendorTypePickerOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Change vendor type</button>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {categoryChips.map(c => {
                      const isActive = formCategory === c
                      return (
                        <button key={c} type="button" onClick={() => setFormCategory(c)} style={{
                          background: isActive ? (isCustomAccent ? accent : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.06)',
                          border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'),
                          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          padding: '6px 10px', borderRadius: 14, minHeight: 30,
                        }}>{c}</button>
                      )
                    })}
                    <input
                      placeholder="+ Add custom"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setFormCategory(e.currentTarget.value.trim())
                          e.currentTarget.value = ''
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 12, padding: '6px 10px', borderRadius: 14,
                        outline: 'none', minWidth: 100, fontWeight: 500,
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Spice Level</label>
                  <select value={formSpice} onChange={(e) => setFormSpice(Number(e.target.value))} style={{ ...S.input, marginBottom: 0, fontSize: 13, padding: '10px 12px', appearance: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', color: formSpice > 0 ? '#EF4444' : '#fff' }}>
                    <option value={0} style={{ background: '#1a1a1a' }}>None</option>
                    <option value={1} style={{ background: '#1a1a1a' }}>🌶️ Medium</option>
                    <option value={2} style={{ background: '#1a1a1a' }}>🌶️🌶️ Hot</option>
                    <option value={3} style={{ background: '#1a1a1a' }}>🌶️🌶️🌶️ Very Hot</option>
                  </select>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => setFormHalal(!formHalal)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formHalal ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)', background: formHalal ? `${accent}20` : 'rgba(255,255,255,0.04)', color: formHalal ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>☪️ Halal</button>
                <button onClick={() => setFormPopular(!formPopular)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formPopular ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.1)', background: formPopular ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)', color: formPopular ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⭐ Popular</button>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

              {/* Price toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setFormPriceMode('normal')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'normal' ? accent : 'rgba(255,255,255,0.06)', color: formPriceMode === 'normal' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Normal</button>
                <button onClick={() => setFormPriceMode('promo')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'promo' ? '#FFD600' : 'rgba(255,255,255,0.06)', color: formPriceMode === 'promo' ? '#1a1a1a' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Promo</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Price</label>
                  <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. 15000" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                  {formPrice && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmt(Number(formPrice))}</div>}
                </div>
                {formPriceMode === 'promo' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#EF4444', marginBottom: 4, display: 'block', fontWeight: 600 }}>Promo Price</label>
                    <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.3)' }} placeholder="e.g. 10000" type="number" value={formPromoPrice} onChange={(e) => setFormPromoPrice(e.target.value)} />
                    {formPromoPrice && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{fmt(Number(formPromoPrice))}</div>}
                  </div>
                )}
              </div>

              {/* Description */}
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Description <span style={{ color: formDesc.length >= 60 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formDesc.length}/60)</span></label>
              <textarea style={{ ...S.input, minHeight: 60, resize: 'none', fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="Short description of the dish" value={formDesc} maxLength={60} onChange={(e) => setFormDesc(e.target.value.slice(0, 60))} />

              {/* Prep Time */}
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Prep Time (minutes)</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[0, 5, 10, 15, 20, 30].map(t => (
                  <button key={t} onClick={() => setFormPrepTime(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: formPrepTime === t ? accent : 'rgba(255,255,255,0.06)', color: formPrepTime === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>{t === 0 ? '—' : t}</button>
                ))}
              </div>
            </div>

            {/* Progressive-disclosure optional details */}
            {renderItemOptionalFields()}

            {/* Buttons */}
            <div style={{ padding: '16px 14px 28px', display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: 16, borderRadius: 16, border: 'none', background: '#8B0000', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={() => setEditItem(null)}>Cancel</button>
              <button style={{ flex: 1, padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 15, fontWeight: 800, cursor: 'pointer' }} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VENDOR ADD ITEM PAGE ═══ */}
      {addingItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setAddingItem(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Add New Item</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
            </div>

            {/* Live card preview — shows exactly how it will look */}
            <div style={{ padding: '0 14px 12px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textAlign: 'center', fontWeight: 600 }}>Preview — how customers will see it</div>
              <div style={{ ...S.card, margin: 0, ...(isCustomAccent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
                <label style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: formPhoto ? 'none' : `2px dashed ${accent}40`, background: formPhoto ? 'none' : 'rgba(0,0,0,0.4)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {formPhoto ? (
                    <img src={formPhoto} alt="" onError={imgError('food')} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: accent, gap: 2 }}>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ fontSize: 9, fontWeight: 700 }}>Add Photo</span>
                    </div>
                  )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (supabase && vendorId && !String(vendorId).startsWith('local')) {
                    const url = await uploadMenuImage(vendorId, file)
                    if (url) { setFormPhoto(url); return }
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const img = new Image()
                    img.onload = () => {
                      const canvas = document.createElement('canvas')
                      const max = 600
                      let w = img.width, h = img.height
                      if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
                      canvas.width = w; canvas.height = h
                      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                      setFormPhoto(canvas.toDataURL('image/jpeg', 0.7))
                    }
                    img.src = reader.result
                  }
                  reader.readAsDataURL(file)
                }} />
                </label>
                {/* Popular badge on image */}
                {formPopular && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, background: 'rgba(250,204,21,0.9)', color: '#000', borderRadius: 4, padding: '1px 5px', fontWeight: 800, zIndex: 2 }}>Popular</span>}
                {/* Card body preview */}
                <div style={{ ...S.cardBody }}>
                  <div style={S.cardName}>{formName || 'Item Name'}{formSpice > 0 && <span style={{ marginLeft: 4 }}>{'🌶️'.repeat(formSpice)}</span>}</div>
                  <div style={S.cardDesc}>{formDesc || 'Description...'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {formHalal && <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.8)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>Halal</span>}
                    {formPriceMode === 'promo' && formPromoPrice ? (
                      <>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{fmt(Number(formPrice) || 0)}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{fmt(Number(formPromoPrice) || 0)}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{formPrice ? fmt(Number(formPrice)) : 'Rp 0'}</span>
                    )}
                  </div>
                </div>
                {formPhoto && <button onClick={(e) => { e.preventDefault(); setFormPhoto('') }} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>}
              </div>
            </div>

            {/* Form card */}
            <div style={{ margin: '0 14px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

              {/* Item name */}
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Item Name <span style={{ color: formName.length >= 25 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formName.length}/25)</span></label>
              <input style={{ ...S.input, fontSize: 15, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. Nasi Goreng" maxLength={25} value={formName} onChange={(e) => setFormName(e.target.value)} />

              {/* Category + Spice */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Category</span>
                    <button type="button" onClick={() => setVendorTypePickerOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Change vendor type</button>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {categoryChips.map(c => {
                      const isActive = formCategory === c
                      return (
                        <button key={c} type="button" onClick={() => setFormCategory(c)} style={{
                          background: isActive ? (isCustomAccent ? accent : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.06)',
                          border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'),
                          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          padding: '6px 10px', borderRadius: 14, minHeight: 30,
                        }}>{c}</button>
                      )
                    })}
                    <input
                      placeholder="+ Add custom"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setFormCategory(e.currentTarget.value.trim())
                          e.currentTarget.value = ''
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 12, padding: '6px 10px', borderRadius: 14,
                        outline: 'none', minWidth: 100, fontWeight: 500,
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Spice Level</label>
                  <select value={formSpice} onChange={(e) => setFormSpice(Number(e.target.value))} style={{ ...S.input, marginBottom: 0, fontSize: 13, padding: '10px 12px', appearance: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', color: formSpice > 0 ? '#EF4444' : '#fff' }}>
                    <option value={0} style={{ background: '#1a1a1a' }}>None</option>
                    <option value={1} style={{ background: '#1a1a1a' }}>🌶️ Medium</option>
                    <option value={2} style={{ background: '#1a1a1a' }}>🌶️🌶️ Hot</option>
                    <option value={3} style={{ background: '#1a1a1a' }}>🌶️🌶️🌶️ Very Hot</option>
                  </select>
                </div>
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => setFormHalal(!formHalal)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formHalal ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)', background: formHalal ? `${accent}20` : 'rgba(255,255,255,0.04)', color: formHalal ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>☪️ Halal</button>
                <button onClick={() => setFormPopular(!formPopular)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: formPopular ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.1)', background: formPopular ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)', color: formPopular ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⭐ Popular</button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

              {/* Price section */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setFormPriceMode('normal')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'normal' ? accent : 'rgba(255,255,255,0.06)', color: formPriceMode === 'normal' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Normal</button>
                <button onClick={() => setFormPriceMode('promo')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: formPriceMode === 'promo' ? '#FFD600' : 'rgba(255,255,255,0.06)', color: formPriceMode === 'promo' ? '#1a1a1a' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Promo</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Price</label>
                  <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. 15000" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                  {formPrice && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmt(Number(formPrice))}</div>}
                </div>
                {formPriceMode === 'promo' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#EF4444', marginBottom: 4, display: 'block', fontWeight: 600 }}>Promo Price</label>
                    <input style={{ ...S.input, marginBottom: 0, fontSize: 16, fontWeight: 800, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.3)' }} placeholder="e.g. 10000" type="number" value={formPromoPrice} onChange={(e) => setFormPromoPrice(e.target.value)} />
                    {formPromoPrice && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{fmt(Number(formPromoPrice))}</div>}
                  </div>
                )}
              </div>

              {/* Description */}
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Description <span style={{ color: formDesc.length >= 60 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({formDesc.length}/60)</span></label>
              <textarea
                style={{ ...S.input, minHeight: 60, resize: 'none', marginBottom: 0, fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="Short description of the dish"
                value={formDesc}
                maxLength={60}
                onChange={(e) => setFormDesc(e.target.value.slice(0, 60))}
              />
            </div>

            {/* Progressive-disclosure optional details */}
            {renderItemOptionalFields()}

            {/* Add button — sticky bottom */}
            <div style={{ padding: '16px 14px 28px' }}>
              <button style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: accent, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={saveAdd}>
                {isCustomAccent && <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}><div style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, animation: 'landingGlow 3s ease-in-out infinite' }} /></div>}
                <span style={{ position: 'relative', zIndex: 1 }}>Add to Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SHOP CONFIG PAGE ═══ */}
      {shopConfig && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}><DevBadge n={9} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
            <button onClick={() => setShopConfig(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>My Shop</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
            </div>
          </div>
          {/* Share link card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 14, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6, display: 'block' }}>Your App Link</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input readOnly value={`streetlocal.live/${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ ...S.input, marginBottom: 0, flex: 1, fontSize: 13, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={(e) => { navigator.clipboard.writeText(`https://streetlocal.live/${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`); e.target.textContent = '✓'; setTimeout(() => { e.target.textContent = 'Copy' }, 2000) }} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Copy</button>
            </div>
          </div>

          {/* Logo + Basic Info card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '18px 16px', position: 'relative', border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            {isCustomAccent && <div style={{ position: 'absolute', top: 18, left: 0, width: 4, height: 40, background: accent, borderRadius: '0 4px 4px 0' }} />}

            {/* Logo upload — shows exact landing page preview */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const url = await uploadMenuImage(vendorId, file)
                  if (url) { setShopLogo(url); localStorage.setItem('productslocal_shopLogo', url) }
                }} />
                {shopLogo ? (
                  <div style={{ width: 100, height: 100, borderRadius: 50, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.15)', boxShadow: `0 4px 16px rgba(0,0,0,0.3)` }}>
                    <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 86, height: 86, borderRadius: 43, objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: 50, background: `${accent}20`, border: `2px dashed ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>Add Logo</span>
                  </div>
                )}
              </label>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{shopLogo ? 'Tap to change' : 'This is how it looks on your landing page'}</div>
              {shopLogo && <button onClick={() => { setShopLogo(''); localStorage.removeItem('productslocal_shopLogo') }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>Remove</button>}

            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Shop Name <span style={{ color: shopName.length >= 20 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({shopName.length}/20)</span></label>
            <input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopName} maxLength={20} onChange={(e) => setShopName(e.target.value)} />

            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>WhatsApp Number</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <div style={{ padding: '12px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{shopCountry === 'Indonesia' || shopCountry === '' ? '+62' : shopCountry === 'Malaysia' ? '+60' : shopCountry === 'Singapore' ? '+65' : shopCountry === 'Thailand' ? '+66' : '+'}</div>
              <input style={{ ...S.input, marginBottom: 0, flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopPhone.replace(/^\+?\d{1,3}\s?/, '')} onChange={(e) => {
                const prefix = shopCountry === 'Indonesia' || shopCountry === '' ? '+62' : shopCountry === 'Malaysia' ? '+60' : shopCountry === 'Singapore' ? '+65' : shopCountry === 'Thailand' ? '+66' : '+'
                setShopPhone(prefix + e.target.value.replace(/[^0-9]/g, ''))
              }} placeholder="812 3456 7890" type="tel" />
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Food Type</label>
            <input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopFoodType} onChange={(e) => setShopFoodType(e.target.value)} placeholder="e.g. Noodles" />

            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>About <span style={{ color: shopBio.length >= 350 ? '#EF4444' : 'rgba(255,255,255,0.3)' }}>({shopBio.length}/350)</span></label>
            <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.5 }} value={shopBio} maxLength={350} onChange={(e) => setShopBio(e.target.value.slice(0, 350))} placeholder="Tell customers about your food, your story, what makes you special..." />
          </div>

          {/* Location card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Location</div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Address</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input style={{ ...S.input, flex: 1, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopAddress} onChange={async (e) => {
                setShopAddress(e.target.value)
                if (e.target.value.length > 3) {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e.target.value)}&format=json&limit=3&countrycodes=id`)
                    const data = await res.json()
                    setLocationSuggestions(data.map(d => d.display_name))
                  } catch { setLocationSuggestions([]) }
                } else { setLocationSuggestions([]) }
              }} placeholder="Search address or use GPS" />
              <button onClick={() => {
                if (!navigator.geolocation) return
                navigator.geolocation.getCurrentPosition(async ({ coords }) => {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
                    const data = await res.json()
                    setShopAddress(data.display_name || `${coords.latitude}, ${coords.longitude}`)
                    // Extract city and country
                    const addr = data.address || {}
                    setShopCity(addr.city || addr.town || addr.village || addr.county || '')
                    setShopCountry(addr.country || '')
                    // Get 3 nearby suggestions
                    const nearby = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.address?.road || data.address?.suburb || '')}&format=json&limit=3&countrycodes=id&viewbox=${coords.longitude-0.01},${coords.latitude+0.01},${coords.longitude+0.01},${coords.latitude-0.01}`)
                    const nearbyData = await nearby.json()
                    setLocationSuggestions(nearbyData.map(d => d.display_name))
                  } catch { setShopAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`) }
                }, () => alert('Please allow location access'), { enableHighAccuracy: true, timeout: 10000 })
              }} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>📍</button>
            </div>
            {locationSuggestions.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {locationSuggestions.map((s, i) => (
                  <button key={i} onClick={() => { setShopAddress(s); setLocationSuggestions([]) }} style={{
                    width: '100%', padding: '8px 12px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>{s}</button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>City</label>
                <input style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopCity} onChange={(e) => setShopCity(e.target.value)} placeholder="e.g. Yogyakarta" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Country</label>
                <input style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopCountry} onChange={(e) => setShopCountry(e.target.value)} placeholder="e.g. Indonesia" />
              </div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Google Maps Link</label>
            <input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={shopMapsLink} onChange={(e) => setShopMapsLink(e.target.value)} placeholder="Paste Google Maps link" />
          </div>

          {/* Hours card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Opening Hours</div>
            {[
              { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
              { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' },
            ].map(day => (
              <div key={day.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: shopSchedule[day.key]?.off ? '#EF4444' : 'rgba(255,255,255,0.6)', width: 30, flexShrink: 0 }}>{day.label}</span>
                {shopSchedule[day.key]?.off ? (
                  <span style={{ flex: 1, fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Closed</span>
                ) : (
                  <>
                    <input type="time" value={shopSchedule[day.key]?.open || '17:00'} onChange={e => setShopSchedule({ ...shopSchedule, [day.key]: { ...shopSchedule[day.key], open: e.target.value } })} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'inherit', colorScheme: 'dark' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>–</span>
                    <input type="time" value={shopSchedule[day.key]?.close || '23:00'} onChange={e => setShopSchedule({ ...shopSchedule, [day.key]: { ...shopSchedule[day.key], close: e.target.value } })} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'inherit', colorScheme: 'dark' }} />
                  </>
                )}
                <button onClick={() => setShopSchedule({ ...shopSchedule, [day.key]: { ...shopSchedule[day.key], off: !shopSchedule[day.key]?.off } })} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: shopSchedule[day.key]?.off ? 'rgba(239,68,68,0.2)' : '#FFD600', color: shopSchedule[day.key]?.off ? '#EF4444' : '#1a1a1a', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  {shopSchedule[day.key]?.off ? 'Off' : 'On'}
                </button>
              </div>
            ))}
          </div>

          {/* Social Media card */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Social Media</div>
            {[
              { label: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/white', value: shopInstagram, set: setShopInstagram, placeholder: 'username' },
              { label: 'Facebook', icon: 'https://cdn.simpleicons.org/facebook/white', value: shopFacebook, set: setShopFacebook, placeholder: 'facebook.com/page' },
              { label: 'TikTok', icon: 'https://cdn.simpleicons.org/tiktok/white', value: shopTiktok, set: setShopTiktok, placeholder: 'username' },
              { label: 'X', icon: 'https://cdn.simpleicons.org/x/white', value: shopYoutube, set: setShopYoutube, placeholder: 'x.com/handle' },
              { label: 'Website', icon: 'https://api.iconify.design/mdi/web.svg?color=white', value: shopWebsite, set: setShopWebsite, placeholder: 'www.yoursite.com' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: isCustomAccent ? accent : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={s.icon} alt="" onError={imgError('generic')} style={{ width: 20, height: 20 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                  <input style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} value={s.value} onChange={(e) => s.set(e.target.value)} placeholder={s.placeholder} />
                </div>
              </div>
            ))}
          </div>

          {/* QRIS Payment QR */}
          <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Payment QR Code</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Upload your QRIS or payment QR. Customers see it after placing an order.</div>
            <div style={{ textAlign: 'center' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const url = await uploadMenuImage(vendorId, file)
                  if (url) { setShopQris(url); localStorage.setItem('productslocal_shopQris', url) }
                }} />
                {shopQris ? (
                  <img src={shopQris} alt="QRIS" onError={imgError('qr')} style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 12, background: '#fff', padding: 8 }} />
                ) : (
                  <div style={{ width: 160, height: 160, borderRadius: 12, background: `${accent}10`, border: `2px dashed ${accent}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 36 }}>📱</span>
                    <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>Upload QRIS</span>
                  </div>
                )}
              </label>
              {shopQris && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => { setShopQris(''); localStorage.removeItem('productslocal_shopQris') }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Remove QR</button>
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <div style={{ padding: '8px 14px 28px' }}>
            <button onClick={() => {
              if (vendorId) updateVendorConfig(vendorId, { shop_name: shopName, shop_phone: shopPhone, shop_address: shopAddress, shop_hours: shopHours, shop_food_type: shopFoodType, shop_maps_link: shopMapsLink, shop_instagram: shopInstagram, shop_tiktok: shopTiktok, shop_facebook: shopFacebook, shop_youtube: shopYoutube, shop_website: shopWebsite, shop_open: shopOpen }).catch(() => {})
              setShopConfig(false)
            }} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Save Settings</button>
          </div>
          </div>
        </div>
      )}

      <style>{`@keyframes newBadgeDance { 0%, 100% { transform: scale(1) rotate(0deg); } 25% { transform: scale(1.15) rotate(-3deg); } 50% { transform: scale(1) rotate(3deg); } 75% { transform: scale(1.1) rotate(-2deg); } }`}</style>
      {/* ═══ THEME BROWSER PAGE ═══ */}
      {themeBrowser && (() => {
        const countries = [...new Set(THEME_PRESETS.flatMap(t => t.countries))]
        const COUNTRY_LABELS = { ID: 'Indonesia', MY: 'Malaysia', SG: 'Singapore', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines', US: 'USA', GB: 'UK', AU: 'Australia', NZ: 'New Zealand', CA: 'Canada', DE: 'Germany', FR: 'France', NL: 'Netherlands', AE: 'UAE', SA: 'Saudi', QA: 'Qatar', KW: 'Kuwait', EG: 'Egypt', KR: 'Korea' }
        const filtered = THEME_PRESETS.filter(t => {
          if (themeCountry !== 'all') {
            if (PRODUCT_CATEGORIES.includes(themeCountry)) { if (t.category !== themeCountry) return false }
            else { if (!t.countries.includes(themeCountry)) return false }
          }
          if (themeSearch && !t.label.toLowerCase().includes(themeSearch.toLowerCase()) && !t.category.toLowerCase().includes(themeSearch.toLowerCase()) && !t.foodTypes.some(ft => ft.toLowerCase().includes(themeSearch.toLowerCase()))) return false
          return true
        })
        const newThemes = filtered.filter(t => t.isNew)
        const otherThemes = filtered.filter(t => !t.isNew)

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff' }}><DevBadge n={10} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
                <button onClick={() => setThemeBrowser(false)} style={{ width: 38, height: 38, borderRadius: 19, background: '#1a1a1a', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>StreetLocal</div>
                  <div style={{ fontSize: 8, color: 'rgba(0,0,0,0.35)', fontWeight: 600, letterSpacing: 0.5 }}>streetlocal.live</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>Themes</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{THEME_PRESETS.length} available</div>
                </div>
              </div>

              {/* Search + Filter button */}
              <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input value={themeSearch} onChange={e => setThemeSearch(e.target.value)} placeholder="Search themes..." style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.03)', color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(0,0,0,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                </div>
                <button onClick={() => setThemeCountryDrawer(true)} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: '#1a1a1a', color: themeCountry !== 'all' ? '#FFD600' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={themeCountry !== 'all' ? '#FFD600' : 'rgba(255,255,255,0.4)'}><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" /></svg>
                  {themeCountry !== 'all' && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, background: '#22c55e', border: '2px solid #1a1a1a' }} />}
                </button>
              </div>
              {themeCountry !== 'all' && (
                <div style={{ padding: '0 14px 8px', fontSize: 12, color: '#FFD600', fontWeight: 700 }}>
                  {PRODUCT_CATEGORIES.includes(themeCountry) ? themeCountry : (COUNTRY_LABELS[themeCountry] || themeCountry)}
                  <button onClick={() => setThemeCountry('all')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontWeight: 600, marginLeft: 6 }}>Clear</button>
                </div>
              )}

              {/* Category drawer — slides from left */}
              {themeCountryDrawer && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 400 }} onClick={() => setThemeCountryDrawer(false)}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
                  <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 270, background: '#1a1a1a', padding: '20px 0', overflowY: 'auto', animation: 'slideRight 0.2s ease' }}>
                    <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Categories</div>
                      <button onClick={() => setThemeCountryDrawer(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                    </div>

                    {/* All */}
                    <button onClick={() => { setThemeCountry('all'); setThemeCountryDrawer(false) }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: themeCountry === 'all' ? '#FFD600' : 'transparent', color: themeCountry === 'all' ? '#1a1a1a' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>All Themes</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: themeCountry === 'all' ? '#1a1a1a' : 'rgba(255,255,255,0.25)' }}>{THEME_PRESETS.length}</span>
                    </button>

                    {/* Food categories */}
                    <div style={{ padding: '12px 16px 6px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Food Type</div>
                    {PRODUCT_CATEGORIES.map(cat => {
                      const count = THEME_PRESETS.filter(t => t.category === cat).length
                      return (
                        <button key={cat} onClick={() => { setThemeCountry(cat); setThemeCountryDrawer(false) }} style={{ width: '100%', padding: '11px 16px', border: 'none', background: themeCountry === cat ? '#FFD600' : 'transparent', color: themeCountry === cat ? '#1a1a1a' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{cat}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: themeCountry === cat ? '#1a1a1a' : 'rgba(255,255,255,0.25)' }}>{count}</span>
                        </button>
                      )
                    })}

                    {/* Countries */}
                    <div style={{ padding: '12px 16px 6px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Country</div>
                    {countries.map(c => {
                      const count = THEME_PRESETS.filter(t => t.countries.includes(c)).length
                      return (
                        <button key={c} onClick={() => { setThemeCountry(c); setThemeCountryDrawer(false) }} style={{ width: '100%', padding: '11px 16px', border: 'none', background: themeCountry === c ? '#FFD600' : 'transparent', color: themeCountry === c ? '#1a1a1a' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{COUNTRY_LABELS[c] || c}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: themeCountry === c ? '#1a1a1a' : 'rgba(255,255,255,0.25)' }}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Theme card renderer — iPhone frame style */}
              {(() => {
                const newBadgeDance = { animation: 'newBadgeDance 1.5s ease-in-out infinite' }
                const renderPhoneCard = (theme) => (
                  <div key={theme.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Theme name header */}
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {theme.label.replace(/^#\d+\s/, '')}
                      {theme.isNew && <span style={{ background: '#FFD600', color: '#1a1a1a', padding: '1px 6px', borderRadius: 4, fontSize: 8, fontWeight: 800, display: 'inline-block', ...newBadgeDance }}>NEW</span>}
                      {shopTheme === theme.id && <span style={{ background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: 4, fontSize: 8, fontWeight: 800 }}>Active</span>}
                    </div>
                    {/* Mini phone frame */}
                    <div style={{ width: 140, height: 250, borderRadius: 20, background: '#1a1a1a', padding: 2, position: 'relative', border: shopTheme === theme.id ? '2px solid #FFD600' : '2px solid #333', boxShadow: shopTheme === theme.id ? '0 0 12px rgba(255,214,0,0.3)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <div onClick={(e) => { e.stopPropagation(); setThemeBrowser(false); setShopTheme(theme.id); setShopAccentColor(theme.accent || '#8DC63F'); localStorage.setItem('productslocal_theme', theme.id); localStorage.setItem('productslocal_themeBg', theme.img); localStorage.setItem('productslocal_accentColor', theme.accent || '#8DC63F'); const bgImg = document.getElementById('app-bg-img'); if (bgImg) bgImg.src = theme.img; setEditorColor(theme.accent || '#8DC63F'); setEditorBaseColor(theme.accent || '#8DC63F'); setThemeEditor({ url: theme.img }); }} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#1a1a1a', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 5, lineHeight: 1 }}>DEV</div>
                      <div style={{ width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <div style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', width: 32, height: 8, background: '#000', borderRadius: 6, zIndex: 3 }} />
                        <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                        <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 30, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 3 }} />
                      </div>
                    </div>
                    {/* View Theme button */}
                    <button onClick={() => { setThemePreviewImg(null); setThemePreviewPage('landing'); setThemePreviewId(theme.id) }} style={{ marginTop: 8, padding: '6px 20px', borderRadius: 8, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>View Theme</button>
                  </div>
                )

                return (
                  <>
                    {/* New themes */}
                    {newThemes.length > 0 && themeSearch === '' && (
                      <div style={{ padding: '0 14px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>New</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {newThemes.map(renderPhoneCard)}
                        </div>
                      </div>
                    )}

                    {/* All themes */}
                    <div style={{ padding: '0 14px 20px' }}>
                      {(newThemes.length > 0 && themeSearch === '') && <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>All Themes</div>}
                      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.35)', fontSize: 14 }}>No themes found</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {(themeSearch ? filtered : otherThemes).map(renderPhoneCard)}
                      </div>
                    </div>
                  </>
                )
              })()}

              {/* Full-screen theme preview — standalone, no iframe */}
              {themePreviewId && (() => {
                const theme = THEME_PRESETS.find(t => t.id === themePreviewId)
                if (!theme) return null
                const activeImg = themePreviewImg || theme.img
                const allImages = [theme.img, ...(theme.variants || [])]
                const hasVariants = allImages.length > 1
                const ac = theme.accent || '#8DC63F'

                return (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }} onClick={() => { setThemePreviewId(null); setThemePreviewImg(null) }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 340, flexShrink: 0, padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>StreetLocal</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Business at your finger tips</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{theme.label.replace(/^#\d+\s/, '')}</div>
                    </div>

                    {/* Spacer — push phone to center */}
                    <div style={{ flex: 1, minHeight: 10 }} />

                    {/* Phone + Variants row — static mockup, no iframe */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <div style={{ width: 240, height: 480, borderRadius: 34, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: `0 16px 50px rgba(0,0,0,0.5), 0 0 16px ${ac}25`, border: '2px solid #333', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', right: -3, top: 100, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                      <div style={{ position: 'absolute', left: -3, top: 85, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                      <div style={{ position: 'absolute', left: -3, top: 110, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                      <div style={{ width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 56, height: 16, background: '#000', borderRadius: 12, zIndex: 10 }} />
                        <img src={activeImg} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                        <div style={{ position: 'absolute', inset: 0, background: themePreviewPage === 'menu' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)', backdropFilter: themePreviewPage === 'menu' ? 'blur(6px)' : 'none', transition: 'all 0.3s' }} />
                        {themePreviewPage === 'landing' && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '0 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 32, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '3px solid rgba(255,255,255,0.15)' }}><span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>LOGO</span></div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)', textAlign: 'center', lineHeight: 1.1 }}>Your Name</div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{theme.category}</div>
                            <button onClick={() => setThemePreviewPage('menu')} style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', padding: '10px 28px', borderRadius: 12, background: ac, fontSize: 14, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${ac}40` }}>View Menu</button>
                          </div>
                        )}
                        {themePreviewPage === 'menu' && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 8px 12px', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)', position: 'sticky', top: 0, zIndex: 5 }}>
                              <button onClick={() => setThemePreviewPage('landing')} style={{ width: 22, height: 22, borderRadius: 11, background: ac, border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>←</button>
                              <div style={{ width: 22, height: 22, borderRadius: 11, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', marginRight: 6 }}><span style={{ fontSize: 8, fontWeight: 900, color: '#fff' }}>LOGO</span></div>
                              <div><div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Your Name</div><div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>{theme.category}</div></div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, padding: '2px 8px 6px' }}>{['All', ...getMenuTabsForTheme(theme.id).slice(0, 3)].map((t, i) => (<div key={t} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, color: i === 0 ? ac : 'rgba(255,255,255,0.4)', borderBottom: i === 0 ? `2px solid ${ac}` : '2px solid transparent' }}>{t}</div>))}</div>
                            <div style={{ padding: '0 6px' }}>
                              {DEMO_MENU.filter(m => m.category === 'Meal').slice(0, 3).map(item => (
                                <div key={item.id} style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, margin: '0 0 5px', padding: 6, display: 'flex', gap: 6, alignItems: 'center', minHeight: 52, borderLeft: `3px solid ${ac}` }}>
                                  <img src={item.photo} alt="" onError={imgError('food')} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}{item.spice > 0 && ' 🌶️'}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div><div style={{ fontSize: 10, fontWeight: 700, color: '#FACC15', marginTop: 1 }}>{fmt(item.price)}</div></div>
                                  <div style={{ width: 16, height: 16, borderRadius: 8, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>+</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ position: 'absolute', bottom: 10, left: 6, right: 6, background: `linear-gradient(135deg, ${ac}, ${ac}cc)`, borderRadius: 10, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
                              <div style={{ fontSize: 9, fontWeight: 600, color: '#fff' }}>2 items · {fmt(41000)}</div>
                              <div style={{ background: '#fff', color: ac, borderRadius: 6, padding: '3px 8px', fontSize: 8, fontWeight: 700 }}>Checkout</div>
                            </div>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                      </div>
                    </div>
                    {/* Variant thumbnails — right side */}
                    {hasVariants && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {allImages.map((img, i) => (
                          <button key={i} onClick={() => setThemePreviewImg(img)} style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', border: activeImg === img ? `3px solid ${ac}` : '2px solid rgba(255,255,255,0.15)', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
                            <img src={img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    )}
                    </div>

                    {/* Bottom spacer */}
                    <div style={{ flex: 1, minHeight: 10 }} />

                    {/* Footer buttons */}
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingBottom: 20 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setThemePreviewId(null); setThemePreviewImg(null) }} style={{ padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                      <button onClick={() => {
                        setShopTheme(theme.id); setShopAccentColor(theme.accent || '#8DC63F')
                        localStorage.setItem('productslocal_theme', theme.id); localStorage.setItem('productslocal_themeBg', activeImg); localStorage.setItem('productslocal_accentColor', theme.accent || '#8DC63F')
                        const bgImg = document.getElementById('app-bg-img'); if (bgImg) bgImg.src = activeImg
                        setThemePreviewId(null); setThemePreviewImg(null); setThemeBrowser(false); setShowLanding(true)
                      }} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Use Theme</button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

      {/* ═══ DESIGN STUDIO PAGE ═══ */}
      {designStudio && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}><DevBadge n={11} />
          <img src={localStorage.getItem('productslocal_themeBg') || ''} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setDesignStudio(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Design Studio</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Customise your app appearance</div>
              </div>
            </div>

            {/* Logo Style */}
            <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 16, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Logo Style</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {[
                  { id: 'circle', label: 'Circle' },
                  { id: 'bare', label: 'No Circle' },
                  { id: 'off', label: 'Off' },
                ].map(opt => (
                  <button type="button" key={opt.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShopLogoStyle(opt.id) }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: shopLogoStyle === opt.id ? accent : 'rgba(255,255,255,0.08)', color: shopLogoStyle === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 44 }}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Hero Text Editor — open button */}
            <div style={{ margin: '0 14px 12px' }}>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHeroEditor(true); setDesignStudio(false) }} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${accent}40`, background: 'rgba(0,0,0,0.65)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#fff', fontWeight: 900 }}>T</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Hero Text Editor</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Font, size, color, effects</div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>›</span>
              </button>
            </div>

            {/* Phone Preview + Toolbar */}
            <div style={{ margin: '0 14px 12px', background: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 14, border: isCustomAccent ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.06)' }}>
              {(() => {
                const HERO_FONTS_C = { system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', nunito: '"Nunito", sans-serif', poppins: '"Poppins", sans-serif', playfair: '"Playfair Display", serif', caveat: '"Caveat", cursive', bebas: '"Bebas Neue", sans-serif' }
                const ffC = HERO_FONTS_C[heroFont] || HERO_FONTS_C.system
                const btnR = btnShape === 'pill' ? 30 : btnShape === 'square' ? 4 : 12
                const bColor = btnColor || accent
                const previewTab = configPreviewTab
                const TOOLS = [
                  { id: 'color', svg: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1.01 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z', label: 'Color', page: 'landing' },
                  { id: 'layout', svg: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z', label: 'Layout', page: 'landing' },
                  { id: 'button', svg: 'M19 6H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H5V8h14v8z', label: 'Button', page: 'landing' },
                  { id: 'text', svg: 'M5 4v3h5.5v12h3V7H19V4H5z', label: 'Text', page: 'landing' },
                  { id: 'cards', svg: 'M4 5h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z', label: 'Cards', page: 'menu' },
                  { id: 'promo', svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H5.17L4 17.17V4h16v12z', label: 'Promo', page: 'menu' },
                  { id: 'splash', svg: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z', label: 'More', page: 'landing' },
                ]

                return (
                  <>
                    <style>{`@keyframes promoScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      {/* iPhone Frame */}
                      <div style={{ width: 220, height: 420, borderRadius: 32, background: '#1a1a1a', padding: 3, position: 'relative', boxShadow: `0 8px 30px ${accent}15, 0 4px 12px rgba(0,0,0,0.3)`, border: '2px solid #333', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', right: -3, top: 85, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                        <div style={{ position: 'absolute', left: -3, top: 72, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                        <div style={{ position: 'absolute', left: -3, top: 96, width: 3, height: 18, borderRadius: '2px 0 0 2px', background: '#333' }} />
                        <div style={{ width: '100%', height: '100%', borderRadius: 29, overflow: 'hidden', position: 'relative', background: '#000' }}>
                          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 52, height: 14, background: '#000', borderRadius: 10, zIndex: 10 }} />
                          {previewTab === 'landing' && (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={localStorage.getItem('productslocal_themeBg') || ''} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                              <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
                              {showClosedBanner && !shopOpen && <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 6, fontWeight: 800, zIndex: 5 }}>CLOSED</div>}
                              <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: landingLayout === 'left' ? 'flex-start' : 'center', justifyContent: landingLayout === 'top' ? 'flex-start' : 'center', paddingTop: landingLayout === 'top' ? 36 : 0, paddingLeft: landingLayout === 'left' ? 10 : 0 }}>
                                {shopLogoStyle !== 'off' && shopLogo ? (shopLogoStyle === 'bare' ? <img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 6 }} /> : <div style={{ width: 40, height: 40, borderRadius: 20, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, border: '2px solid rgba(255,255,255,0.15)' }}><img src={shopLogo} alt="" onError={imgError('logo')} style={{ width: 34, height: 34, borderRadius: 17, objectFit: 'cover' }} /></div>) : shopLogoStyle !== 'off' ? <div style={{ width: 32, height: 32, borderRadius: 16, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{shopName.charAt(0)}</div> : null}
                                <div style={{ fontSize: 17, fontWeight: 800, color: heroColor, fontFamily: ffC, textAlign: landingLayout === 'left' ? 'left' : 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)', lineHeight: 1.1, padding: '0 8px' }}>{shopName}</div>
                                <div style={{ fontSize: 9, color: heroSubColor || 'rgba(255,255,255,0.8)', fontFamily: ffC, marginTop: 3, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>{customTagline || shopFoodType}</div>
                                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '5px 16px', borderRadius: 8, background: bColor, fontSize: 9, fontWeight: 700, color: '#fff', overflow: 'hidden' }}>{btnGlow && <div style={{ position: 'absolute', inset: 0, boxShadow: `0 0 8px ${bColor}80`, borderRadius: 8 }} />}<span style={{ position: 'relative' }}>{btnText || 'View Menu'}</span></div>
                              </div>
                            </div>
                          )}
                          {previewTab === 'menu' && (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <img src={localStorage.getItem('productslocal_themeBg') || ''} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
                              <div style={{ position: 'relative', zIndex: 2, padding: '24px 8px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><div style={{ width: 18, height: 18, borderRadius: 9, background: accent }} /><div style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{shopName}</div></div>
                                {promoBannerEnabled && promoBanner && <div style={{ background: accent, padding: '2px 8px', borderRadius: 4, marginBottom: 5, overflow: 'hidden' }}><div style={{ fontSize: 7, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', animation: 'promoScroll 6s linear infinite' }}>{promoBanner}</div></div>}
                                {menuBanner && <img src={menuBanner} alt="" onError={imgError('banner')} style={{ width: '100%', height: 36, objectFit: 'cover', borderRadius: 5, marginBottom: 5 }} />}
                                {menuCardStyle === 'grid' ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{[1,2,3,4].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4 }}><div style={{ width: '100%', height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 3 }} /><div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '40%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div>)}</div>
                                ) : menuCardStyle === 'fullwidth' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[1,2].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}><div style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.1)' }} /><div style={{ padding: 4 }}><div style={{ height: 5, width: '60%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '30%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div></div>)}</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[1,2,3].map(i => <div key={i} style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 4, borderLeft: `3px solid ${accent}` }}><div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ height: 5, width: '70%', background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 4, width: '90%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 2 }} /><div style={{ height: 5, width: '35%', background: '#FACC15', borderRadius: 2, opacity: 0.7 }} /></div></div>)}</div>
                                )}
                              </div>
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                        </div>
                      </div>

                      {/* Side Toolbar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        {TOOLS.map(t => {
                          const isActive = configTool === t.id
                          return (
                            <button key={t.id} onClick={() => { setConfigTool(isActive ? null : t.id); setConfigPreviewTab(t.page) }} style={{ width: 46, height: 46, borderRadius: 14, border: isActive ? '2px solid #FFD600' : '1px solid rgba(255,255,255,0.06)', background: isActive ? '#FFD600' : 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.2s' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive ? '#1a1a1a' : 'rgba(255,255,255,0.4)'}><path d={t.svg} /></svg>
                              <span style={{ fontSize: 7, fontWeight: 800, color: isActive ? '#1a1a1a' : 'rgba(255,255,255,0.35)', letterSpacing: 0.3 }}>{t.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Contextual Controls */}
                    {configTool && (
                      <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${accent}30`, background: `${accent}08`, marginTop: 6 }}>
                        {configTool === 'color' && (() => {
                          const COLOR_ROWS = [
                            { label: 'Red', h: 0 }, { label: 'Crimson', h: 345 }, { label: 'Rose', h: 330 },
                            { label: 'Pink', h: 315 }, { label: 'Magenta', h: 300 }, { label: 'Fuchsia', h: 285 },
                            { label: 'Purple', h: 270 }, { label: 'Violet', h: 255 }, { label: 'Indigo', h: 240 },
                            { label: 'Blue', h: 220 }, { label: 'Sky', h: 200 }, { label: 'Cyan', h: 185 },
                            { label: 'Teal', h: 170 }, { label: 'Mint', h: 155 }, { label: 'Green', h: 140 },
                            { label: 'Emerald', h: 120 }, { label: 'Lime', h: 90 }, { label: 'Chartreuse', h: 75 },
                            { label: 'Yellow', h: 55 }, { label: 'Gold', h: 45 }, { label: 'Amber', h: 35 },
                            { label: 'Orange', h: 25 }, { label: 'Vermilion', h: 12 }, { label: 'Brown', h: 20, sat: 60 },
                            { label: 'Maroon', h: 0, sat: 70 }, { label: 'Grey', h: 0, sat: 0 }, { label: 'Cool Grey', h: 210, sat: 10 },
                          ]
                          const selectedRow = COLOR_ROWS.find(r => r.label === (configColorRow || 'Blue')) || COLOR_ROWS[9]
                          const s = selectedRow.sat !== undefined ? selectedRow.sat : 80
                          const shades = selectedRow.sat === 0 || selectedRow.sat === 10
                            ? [12, 20, 30, 40, 50, 60, 72, 85].map(l => hslToHex(selectedRow.h, selectedRow.sat, l))
                            : [15, 22, 32, 42, 52, 62, 72, 82].map(l => hslToHex(selectedRow.h, l < 25 ? s + 10 : l > 70 ? s - 20 : s, l))
                          return (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Accent Color</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{accent}</span>
                              </div>
                              {/* Scrollable color strip */}
                              <div style={{ overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 10 }}>
                                <div style={{ display: 'flex', gap: 4, width: 'max-content' }}>
                                  {COLOR_ROWS.map(row => {
                                    const baseColor = hslToHex(row.h, row.sat !== undefined ? row.sat : 80, 45)
                                    const isSelected = (configColorRow || 'Blue') === row.label
                                    return (
                                      <button key={row.label} onClick={() => setConfigColorRow(row.label)} style={{
                                        width: 36, height: 36, borderRadius: 10, border: isSelected ? '3px solid #FFD600' : '2px solid rgba(255,255,255,0.1)',
                                        background: baseColor, cursor: 'pointer', padding: 0, flexShrink: 0,
                                        boxShadow: isSelected ? '0 0 8px rgba(255,214,0,0.4)' : 'none',
                                      }} title={row.label} />
                                    )
                                  })}
                                </div>
                              </div>
                              {/* Label */}
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{selectedRow.label} — light to dark</div>
                              {/* Shade scale bar */}
                              <div style={{ display: 'flex', gap: 3 }}>
                                {shades.map((c, i) => (
                                  <button key={i} onClick={() => {
                                    setShopAccentColor(c)
                                    localStorage.setItem('productslocal_accentColor', c)
                                  }} style={{
                                    flex: 1, height: 40, borderRadius: 8, border: accent === c ? '3px solid #FFD600' : 'none',
                                    background: c, cursor: 'pointer', padding: 0, minWidth: 0,
                                    boxShadow: accent === c ? '0 0 8px rgba(255,214,0,0.4)' : 'none',
                                  }} />
                                ))}
                              </div>
                            </>
                          )
                        })()}
                        {configTool === 'layout' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Layout & Overlay</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Landing Layout</label><div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{[{ id: 'center', label: 'Center' }, { id: 'left', label: 'Left' }, { id: 'top', label: 'Top' }].map(opt => (<button key={opt.id} onClick={() => setLandingLayout(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: landingLayout === opt.id ? accent : 'rgba(255,255,255,0.08)', color: landingLayout === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{opt.label}</button>))}</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Overlay Darkness ({overlayOpacity}%)</label><input type="range" min="0" max="80" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} style={{ width: '100%', marginBottom: 8 }} /><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><button onClick={() => setShowClosedBanner(!showClosedBanner)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: showClosedBanner ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: showClosedBanner ? 19 : 3, transition: 'left 0.2s' }} /></button><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Show "Closed" banner</span></div></>)}
                        {configTool === 'button' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Button Style</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Shape</label><div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>{['rounded', 'pill', 'square'].map(s => (<button key={s} onClick={() => setBtnShape(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: btnShape === s ? accent : 'rgba(255,255,255,0.08)', color: btnShape === s ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>))}</div><div style={{ display: 'flex', gap: 10, marginBottom: 10 }}><div><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Color</label><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="color" value={btnColor || accent} onChange={(e) => setBtnColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />{btnColor && <button onClick={() => setBtnColor('')} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Reset</button>}</div></div><div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Text</label><input style={{ ...S.input, marginBottom: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="View Menu" maxLength={20} /></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => setBtnGlow(!btnGlow)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: btnGlow ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: btnGlow ? 19 : 3, transition: 'left 0.2s' }} /></button><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Glow Effect</span></div></>)}
                        {configTool === 'text' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Tagline</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Custom Tagline</label><input style={{ ...S.input, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} value={customTagline} onChange={(e) => setCustomTagline(e.target.value)} placeholder="Leave empty to use food type" maxLength={40} /><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Replaces "{shopFoodType}" on your landing page</div></>)}
                        {configTool === 'cards' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Menu Cards & Banner</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Card Style</label><div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{[{ id: 'horizontal', label: 'Horizontal' }, { id: 'grid', label: 'Grid' }, { id: 'fullwidth', label: 'Full Width' }].map(opt => (<button key={opt.id} onClick={() => setMenuCardStyle(opt.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: menuCardStyle === opt.id ? accent : 'rgba(255,255,255,0.08)', color: menuCardStyle === opt.id ? '#fff' : 'rgba(255,255,255,0.5)', minHeight: 40 }}>{opt.label}</button>))}</div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Menu Banner Image</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><label style={{ padding: '8px 14px', borderRadius: 10, background: accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Upload<input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const url = await uploadMenuImage(vendorId, file); if (url) setMenuBanner(url) }} /></label>{menuBanner && <button onClick={() => setMenuBanner('')} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Remove</button>}</div>{menuBanner && <img src={menuBanner} alt="" onError={imgError('banner')} style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}</>)}
                        {configTool === 'promo' && (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Promo Banner</div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Running Text</label>
                            <textarea
                              value={promoBanner}
                              onChange={(e) => setPromoBanner(e.target.value.slice(0, 300))}
                              placeholder={"Free delivery this week!\nPress Enter for another promo\n10% off first order"}
                              rows={3}
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8, padding: '6px 12px',
                                color: '#fff', fontSize: 13, lineHeight: '28px',
                                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                                minHeight: 90, marginBottom: 6,
                                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.15) 27px, rgba(255,255,255,0.15) 28px)',
                                backgroundAttachment: 'local',
                              }}
                            />
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.4 }}>
                              Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 9 }}>Enter</kbd> for another promo line. Lines join with <span style={{ color: accent, fontWeight: 700 }}> · </span> in the banner. {promoBanner.length}/300
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => setPromoBannerEnabled(!promoBannerEnabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: promoBannerEnabled ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: promoBannerEnabled ? 19 : 3, transition: 'left 0.2s' }} />
                              </button>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Enable</span>
                            </div>
                          </>
                        )}
                        {configTool === 'splash' && (<><div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Extra Features</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => setSplashEnabled(!splashEnabled)} style={{ width: 40, height: 24, borderRadius: 12, border: 'none', background: splashEnabled ? accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: splashEnabled ? 19 : 3, transition: 'left 0.2s' }} /></button><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Splash Screen (2s branded loading)</span></div></>)}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Current theme indicator */}
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: accent, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Theme: {THEME_PRESETS.find(t => t.id === shopTheme)?.label || shopTheme || 'Custom'}</span>
              </div>
            </div>

            {/* Done button */}
            <div style={{ padding: '8px 14px 28px' }}>
              <button onClick={() => setDesignStudio(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom Domain Page ─── */}
      {domainPage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}><DevBadge n={12} />
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <button onClick={() => setDomainPage(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Custom Domain</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{shopName}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>StreetLocal</div>
            </div>

            {/* Current URL Card */}
            <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Your current app link</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  streetlocal.live/{shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30)}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(`streetlocal.live/${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30)}`) }} style={{ width: 40, height: 40, borderRadius: 10, background: accent, border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>📋</button>
              </div>
            </div>

            {/* Pricing Tiers */}
            {[
              {
                name: 'Subdomain',
                badge: '#FFD600',
                example: `${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 30)}.streetlocal.live`,
                monthly: 25000,
                setup: 50000,
                tagline: 'Best for getting started',
                features: [
                  'Auto SSL included',
                  'Instant activation',
                  'Professional subdomain URL',
                  'Minimum commitment: 3 months',
                ],
              },
              {
                name: 'Custom Domain',
                badge: '#FFD600',
                example: 'menu.yourbrand.com',
                monthly: 75000,
                setup: 150000,
                tagline: 'Most popular for serious vendors',
                features: [
                  'Use your own domain (you purchase it)',
                  'We provide CNAME record instructions',
                  'SSL auto-provisioned',
                  'Setup fee includes DNS configuration',
                  'Minimum commitment: 3 months',
                ],
              },
              {
                name: 'Full Domain',
                badge: '#FFD600',
                example: 'yourbrand.com',
                monthly: 150000,
                setup: 300000,
                tagline: 'Premium — we handle everything',
                features: [
                  'We buy and manage your domain',
                  'Setup fee includes domain purchase + 1st year registration',
                  'Domain renewal included in monthly price',
                  'Full DNS management, SSL, redirects',
                  'Minimum commitment: 3 months',
                ],
              },
            ].map((tier, i) => (
              <div key={tier.name} style={{ margin: '0 16px 16px', padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: `1px solid ${tier.badge}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: `${tier.badge}20`, color: tier.badge, fontSize: 12, fontWeight: 800 }}>Tier {i + 1}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{tier.name}</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: accent, fontWeight: 700, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}25` }}>{tier.example}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{fmt(tier.monthly)}<span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>/month</span></div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>Setup fee: {fmt(tier.setup)} (one-time)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tier.badge, marginBottom: 10 }}>{tier.tagline}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  {tier.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: accent, fontSize: 14, lineHeight: '18px' }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi! I'd like the ${tier.name} domain plan for my shop "${shopName}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                >
                  Get Started →
                </a>
              </div>
            ))}

            {/* Important Notes */}
            <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Important Notes</div>
              {[
                'Setup fees are non-refundable and cover the configuration work',
                'Minimum 3-month commitment required for all plans',
                'Domain plans are in addition to your app subscription',
                'Cancel anytime after 3 months with 30 days notice',
                'Your app content and menu stay on streetlocal.live even if you cancel the domain',
              ].map((note, i) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '5px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#F59E0B', fontSize: 12, lineHeight: '18px' }}>•</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14 }}>FAQ</div>
              {[
                { q: 'Do I need a domain plan?', a: 'No — your app works perfectly at streetlocal.live/yourshop. Domains are optional for vendors who want professional branding.' },
                { q: 'What if I already have a domain?', a: "Choose the Custom Domain plan. You'll keep ownership of your domain — we just point it to your app." },
                { q: 'What happens if I cancel?', a: 'Your app stays active at streetlocal.live. Only the custom domain stops working.' },
              ].map((faq, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: accent, marginBottom: 4 }}>{faq.q}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{faq.a}</div>
                </div>
              ))}
            </div>

            {/* Done button */}
            <div style={{ padding: '8px 16px 28px' }}>
              <button onClick={() => setDomainPage(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TERMS OF LISTING PAGE ═══ */}
      {termsOfListing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <img src={localStorage.getItem('productslocal_themeBg') || 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_19_01-pm.png'} alt="" onError={imgError('theme')} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', ...bgStyle, zIndex: 0 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: '20px 16px 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setTermsOfListing(false)} style={{ width: 38, height: 38, borderRadius: 19, background: accent, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Terms Of Listing</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Search listing requirements & benefits</div>
              </div>
            </div>

            {/* Intro */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Get Found by Local Customers</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Your menu items are searchable on StreetLocal.live. When customers search for food near them, your items appear in the results — but only if your listing meets the quality requirements below.
              </div>
            </div>

            {/* Required fields */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>Required For Each Menu Item</div>
              {[
                { field: 'Item Photo', desc: 'Clear, appetising photo of the dish. Items without photos will NOT appear in search results.' },
                { field: 'Item Name', desc: 'Descriptive name that customers can search for (e.g. "Nasi Goreng Spesial" not "Item 1").' },
                { field: 'Item Price', desc: 'Accurate current price. Promo/discounted items will be highlighted in search.' },
                { field: 'Item Description', desc: 'Short description of ingredients or what the dish includes.' },
                { field: 'Category', desc: 'Correct category (Meal, Drink, Snack, Dessert, Extra) for filtering.' },
                { field: 'Prep Time', desc: 'Estimated preparation time in minutes. Shown to customers before ordering.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.field}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shop requirements */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>Shop Profile Requirements</div>
              {[
                { field: 'Shop Name', desc: 'Your business name as customers know it.' },
                { field: 'WhatsApp Number', desc: 'Active WhatsApp for receiving orders.' },
                { field: 'Shop Address', desc: 'Accurate address for distance calculation and customer directions.' },
                { field: 'Opening Hours', desc: 'Set your daily schedule so customers know when you are open.' },
                { field: 'Food Type', desc: 'Your main food category (e.g. Indonesian, Coffee, Satay).' },
                { field: 'Delivery Settings', desc: 'Configure delivery radius and pricing, or set to Pickup Only.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.field}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* What you get */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>What Completed Listings Achieve</div>
              {[
                'Your items appear when customers search by food name, type, or category',
                'Most ordered items are shown first with their photo — the food sells itself',
                'Promo pricing is highlighted with a flashing animation to attract attention',
                'Free delivery vendors are listed first and highlighted prominently',
                'Customers see your prep time, distance, and delivery cost before clicking',
                'Your listing links directly to your app — one tap to browse your full menu',
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: '#FFD600', marginTop: 1 }}>★</span>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{b}</div>
                </div>
              ))}
            </div>

            {/* Customer expectations */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD600', marginBottom: 10 }}>Customer Expectations</div>
              {[
                'Photos should match the actual food served — misleading images damage trust',
                'Prices must be current — outdated pricing creates a bad customer experience',
                'Prep times should be realistic — underestimating leads to negative reviews',
                'Keep your open/close status accurate — showing "open" when closed frustrates customers',
                'Respond promptly to WhatsApp orders — customers expect confirmation within minutes',
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>⚠️</span>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{e}</div>
                </div>
              ))}
            </div>

            {/* Important notice */}
            <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 14, padding: 16, marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Important</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Menu items missing a photo, name, price, or category will be excluded from search results. Incomplete listings do not qualify for search visibility. Keep your menu complete and up to date to maximise orders.
              </div>
            </div>

            <button onClick={() => setTermsOfListing(false)} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Got It</button>
          </div>
        </div>
      )}
    </div>
  )
}
