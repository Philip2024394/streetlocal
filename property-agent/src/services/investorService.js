/**
 * investorService — International investor listings, supervised transactions,
 * currency conversion, Global Agent management.
 */
import { supabase } from '@/lib/supabase'

const LS_KEY = 'indoo_investor_listings'

function getLocal(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
function genId() { return 'INV-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString(36).slice(-4) }

// ── CURRENCY RATES (fallback — real app would fetch live rates) ──
const RATES = {
  USD: 15800, SGD: 11900, AUD: 10500, CNY: 2200, AED: 4300,
  GBP: 20100, EUR: 17400, JPY: 107, MYR: 3500, KRW: 12,
}

export function convertToIDR(amount, currency) {
  if (currency === 'IDR') return amount
  return Math.round(amount * (RATES[currency] || 1))
}

export function convertFromIDR(amountIDR, currency) {
  if (currency === 'IDR') return amountIDR
  return Math.round(amountIDR / (RATES[currency] || 1))
}

export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won', flag: '🇰🇷' },
]

// ── INVESTMENT GRADE ──
export function calculateInvestmentGrade(listing) {
  const ef = listing.extra_fields || {}
  let score = 0

  // Legal clarity
  if (['SHM', 'SHMSRS', 'HGB', 'Hak Pakai'].includes(ef.certificate || ef.certificateType)) score += 25
  if (ef.certificate === 'SHM' || ef.certificateType === 'SHM') score += 5 // bonus for SHM

  // Location premium
  const premiumLocations = ['bali', 'jakarta', 'bandung', 'yogyakarta', 'surabaya', 'lombok', 'labuan bajo']
  if (premiumLocations.some(l => (listing.city || '').toLowerCase().includes(l))) score += 20

  // Property condition
  if (listing.condition === 'new') score += 15
  else if (listing.condition === 'good') score += 10

  // Furnished
  if (ef.furnished === 'Fully Furnished') score += 10
  else if (ef.furnished === 'Semi Furnished') score += 5

  // Rental yield potential
  if (listing.price_month && listing.buy_now) {
    const monthlyRent = Number(String(listing.price_month).replace(/\./g, ''))
    const salePrice = Number(String(typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now).replace(/\./g, ''))
    if (salePrice > 0) {
      const annualYield = (monthlyRent * 12) / salePrice * 100
      if (annualYield >= 8) score += 20
      else if (annualYield >= 5) score += 15
      else if (annualYield >= 3) score += 10
    }
  } else {
    score += 5 // base score if no yield data
  }

  // Grade
  if (score >= 80) return { grade: 'A', label: 'Premium Investment', color: '#8DC63F', score }
  if (score >= 60) return { grade: 'B', label: 'Strong Investment', color: '#FACC15', score }
  if (score >= 40) return { grade: 'C', label: 'Moderate Investment', color: '#F59E0B', score }
  return { grade: 'D', label: 'Speculative', color: '#EF4444', score }
}

// ── RENTAL YIELD ──
export function calculateRentalYield(buyPrice, monthlyRent) {
  const buy = Number(String(buyPrice).replace(/\./g, ''))
  const rent = Number(String(monthlyRent).replace(/\./g, ''))
  if (!buy || !rent) return null
  const grossYield = (rent * 12) / buy * 100
  const netYield = grossYield * 0.75 // rough estimate after tax/maintenance
  return { grossYield: grossYield.toFixed(1), netYield: netYield.toFixed(1), annualIncome: rent * 12 }
}

// ── FOREIGN ELIGIBILITY ──
export const FOREIGN_ELIGIBLE_CERTIFICATES = ['Hak Pakai', 'SHMSRS', 'HGB']
export const FOREIGN_ELIGIBLE_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Studio']

export function isForeignEligible(listing) {
  const ef = listing.extra_fields || {}
  const cert = ef.certificate || ef.certificateType || ''
  const propType = ef.property_type || ef.propType || listing.sub_category || ''

  // Apartments with SHMSRS are always eligible
  if (cert === 'SHMSRS') return { eligible: true, method: 'SHMSRS (Strata Title)', note: 'Direct ownership for foreigners' }

  // Hak Pakai properties
  if (cert === 'Hak Pakai') return { eligible: true, method: 'Hak Pakai (Right to Use)', note: 'Up to 80 years, renewable' }

  // Leasehold is always available
  if (listing.listing_type === 'rent' || !listing.buy_now) return { eligible: true, method: 'Leasehold', note: 'Rental/lease agreement, no ownership restrictions' }

  // HGB through PMA company
  if (cert === 'HGB') return { eligible: true, method: 'PMA Company', note: 'Requires foreign-owned company (PT PMA) setup' }

  // SHM — not directly eligible, but can convert
  if (cert === 'SHM') return { eligible: false, method: 'SHM — Indonesian Only', note: 'Can convert to Hak Pakai with INDOO supervision', convertible: true }

  return { eligible: true, method: 'Leasehold Available', note: 'Contact INDOO for ownership options' }
}

// ── SUPERVISED TRANSACTION STEPS ──
export const TRANSACTION_STEPS = [
  { id: 1, label: 'Initial Consultation', desc: 'Speak directly with our team to evaluate your investment goals and project scope' },
  { id: 2, label: 'Property Sourcing', desc: 'INDOO identifies properties matching your criteria with verified legal status' },
  { id: 3, label: 'Legal & Compliance Review', desc: 'Certificate verification, foreign eligibility, and regulatory compliance confirmed' },
  { id: 4, label: 'Company Formation', desc: 'PT PMA or other entity setup if required for your investment structure', optional: true },
  { id: 5, label: 'Negotiation & Structuring', desc: 'INDOO negotiates terms and structures the deal to protect your interests' },
  { id: 6, label: 'Construction Oversight', desc: 'On-site project monitoring for new builds or renovations', optional: true },
  { id: 7, label: 'Notaris & Documentation', desc: 'All legal documents prepared and signed with registered Indonesian notaris' },
  { id: 8, label: 'Handover & Ongoing Support', desc: 'Property handover, management setup, and continued advisory support' },
]

// ── DEMO INVESTOR LISTINGS ──
const DEMO_INVESTOR_LISTINGS = [
  { id: 'inv-1', title: 'Luxury Pool Villa Seminyak', city: 'Bali', sub_category: 'Villa', buy_now: 8500000000, price_month: 65000000, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80'], condition: 'new', rating: 4.9, extra_fields: { bedrooms: 4, bathrooms: 3, land_area: '400 m²', building_area: '280 m²', certificate: 'Hak Pakai', furnished: 'Fully Furnished', property_type: 'Villa', pool: true, yearBuilt: 2025 }, foreign_eligible: true, investment_grade: 'A', supervised: true },
  { id: 'inv-2', title: 'Sky Penthouse SCBD Jakarta', city: 'Jakarta', sub_category: 'Penthouse', buy_now: 15000000000, price_month: 120000000, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80'], condition: 'new', rating: 4.8, extra_fields: { bedrooms: 3, bathrooms: 3, building_area: '220 m²', certificate: 'SHMSRS', furnished: 'Fully Furnished', property_type: 'Penthouse', floorLevel: '45', yearBuilt: 2024 }, foreign_eligible: true, investment_grade: 'A', supervised: true },
  { id: 'inv-3', title: 'Beachfront Villa Lombok', city: 'Lombok', sub_category: 'Villa', buy_now: 4200000000, price_month: 35000000, images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80'], condition: 'new', rating: 4.7, extra_fields: { bedrooms: 3, bathrooms: 2, land_area: '600 m²', building_area: '200 m²', certificate: 'HGB', furnished: 'Fully Furnished', property_type: 'Villa', pool: true }, foreign_eligible: true, investment_grade: 'B', supervised: true },
  { id: 'inv-4', title: 'Modern Apartment Ubud', city: 'Bali', sub_category: 'Apartment', buy_now: 2800000000, price_month: 22000000, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'], condition: 'good', rating: 4.6, extra_fields: { bedrooms: 2, bathrooms: 1, building_area: '85 m²', certificate: 'SHMSRS', furnished: 'Fully Furnished', property_type: 'Apartment', floorLevel: '8' }, foreign_eligible: true, investment_grade: 'B', supervised: true },
  { id: 'inv-5', title: 'Cliff Villa Uluwatu', city: 'Bali', sub_category: 'Villa', buy_now: 22000000000, price_month: 180000000, images: ['https://images.unsplash.com/photo-1602343168051-d5e10b70ebb1?w=600&q=80'], condition: 'new', rating: 5.0, extra_fields: { bedrooms: 5, bathrooms: 4, land_area: '1200 m²', building_area: '500 m²', certificate: 'Hak Pakai', furnished: 'Fully Furnished', property_type: 'Villa', pool: true, yearBuilt: 2025 }, foreign_eligible: true, investment_grade: 'A', supervised: true },
  { id: 'inv-6', title: 'Serviced Apartment Surabaya', city: 'Surabaya', sub_category: 'Apartment', buy_now: 1200000000, price_month: 12000000, images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80'], condition: 'good', rating: 4.5, extra_fields: { bedrooms: 1, bathrooms: 1, building_area: '55 m²', certificate: 'SHMSRS', furnished: 'Fully Furnished', property_type: 'Apartment', floorLevel: '12' }, foreign_eligible: true, investment_grade: 'C', supervised: false },
]

// ── GET INVESTOR LISTINGS ──
export async function getInvestorListings(filters = {}) {
  let results = []
  if (supabase) {
    try {
      const { data } = await supabase.from('rental_listings').select('*').eq('foreign_eligible', true).eq('status', 'active').order('created_at', { ascending: false })
      if (data?.length) results = data
    } catch {}
  }
  if (!results.length) results = [...DEMO_INVESTOR_LISTINGS]
  if (filters.city) results = results.filter(l => l.city?.toLowerCase().includes(filters.city.toLowerCase()))
  if (filters.property_type) results = results.filter(l => (l.sub_category || l.extra_fields?.property_type) === filters.property_type)
  if (filters.grade) results = results.filter(l => (l.investment_grade || calculateInvestmentGrade(l).grade) === filters.grade)
  return results
}

// ── GLOBAL AGENT ──
export const GLOBAL_AGENT_REQUIREMENTS = [
  'Minimum 2 years property experience',
  'English language proficiency',
  'Foreign investment law knowledge',
  'Verified portfolio of 5+ listings',
  'INDOO certification course completed',
]

export const DEMO_GLOBAL_AGENTS = [
  { id: 'ga-1', name: 'Wayan Suartika', city: 'Bali', photo: null, languages: ['Indonesian', 'English', 'Japanese'], specialization: ['Villa', 'Apartment'], deals_closed: 34, rating: 4.9, certified: true, experience_years: 8 },
  { id: 'ga-2', name: 'Amanda Chen', city: 'Jakarta', photo: null, languages: ['Indonesian', 'English', 'Mandarin'], specialization: ['Apartment', 'Penthouse'], deals_closed: 22, rating: 4.8, certified: true, experience_years: 5 },
  { id: 'ga-3', name: 'Kadek Pratama', city: 'Bali', photo: null, languages: ['Indonesian', 'English'], specialization: ['Villa', 'House', 'Tanah'], deals_closed: 45, rating: 4.7, certified: true, experience_years: 12 },
]

// ── LEGAL INFO ──
export const FOREIGN_OWNERSHIP_GUIDE = [
  { title: 'Hak Pakai (Right to Use)', desc: 'Foreigners can own property under Hak Pakai for up to 80 years (30 + 20 + 30 extension). Available for houses and land.', icon: '🏠' },
  { title: 'SHMSRS (Strata Title)', desc: 'Direct apartment ownership for foreigners. Most common and straightforward method for apartments and condominiums.', icon: '🏢' },
  { title: 'PMA Company', desc: 'Set up a foreign-owned company (PT PMA) to hold HGB or SHM title. Requires minimum investment of $700,000 USD.', icon: '🏗️' },
  { title: 'Nominee Structure', desc: 'NOT recommended. Using an Indonesian nominee is legally risky and unenforceable. INDOO does not support this method.', icon: '⚠️' },
  { title: 'Leasehold', desc: 'Long-term lease agreements (25-30 years) are available for all property types with no ownership restrictions.', icon: '📋' },
]

export const INDONESIA_TAX_INFO = [
  { label: 'BPHTB (Acquisition Tax)', value: '5% of property value', desc: 'Paid once at purchase' },
  { label: 'PBB (Annual Property Tax)', value: '0.1-0.3% of NJOP', desc: 'Paid annually' },
  { label: 'PPh (Income Tax on Sale)', value: '2.5% of transaction', desc: 'Paid by seller at sale' },
  { label: 'Rental Income Tax', value: '10% of gross rental', desc: 'For foreign-owned rental properties' },
  { label: 'Notaris Fees', value: '1-2.5% of value', desc: 'Legal documentation costs' },
]
