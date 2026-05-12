/**
 * placesListingService — Business listing for INDOO PLACES.
 * Tiers: Basic (100K) / Premium (250K). Referral system. Analytics.
 */
import { supabase } from '@/lib/supabase'

export function generateReferralCode(businessName) {
  return 'INDOO-' + businessName.replace(/\s+/g, '').substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000)
}

export const TIERS = {
  basic: { id: 'basic', label: 'Basic', price: 100000, features: ['Name & photo on card', '1 social media link', 'Standard placement', 'WhatsApp contact', 'Visit Us discount text'] },
  premium: { id: 'premium', label: 'Premium', price: 250000, features: ['All Basic features', 'Featured placement (30 days)', 'Larger card in carousel', 'Priority in search', 'Verified badge ✓', 'Analytics dashboard', 'Rating & reviews', 'Animated discount badge 🏷️'] },
}

/** Submit places application — Supabase + localStorage */
export async function submitPlacesApplication(data) {
  const referralCode = generateReferralCode(data.businessName)
  const entry = { ...data, referral_code: referralCode, status: 'pending', created_at: new Date().toISOString() }

  // localStorage always
  const existing = JSON.parse(localStorage.getItem('indoo_places_applications') || '[]')
  existing.push(entry)
  localStorage.setItem('indoo_places_applications', JSON.stringify(existing))

  // Supabase
  if (supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      await supabase.from('places_listings').insert({
        owner_id: userData?.user?.id,
        business_name: data.businessName,
        owner_name: data.ownerName,
        whatsapp: data.whatsapp,
        bio: data.bio,
        category: data.category,
        address: data.address,
        instagram: data.instagram,
        facebook: data.facebook,
        tiktok: data.tiktok,
        primary_social: data.primarySocial,
        tier: data.tier || 'basic',
        fee_paid: data.fee,
        referral_code: referralCode,
        referred_by: data.referredBy || null,
        discount_pct: data.discount || 0,
      })
    } catch (e) { console.warn('Places submit error:', e) }
  }

  return { referralCode }
}

/** Track analytics event */
export async function trackPlacesEvent(listingId, eventType) {
  if (!supabase) return
  try {
    await supabase.from('places_analytics').insert({ listing_id: listingId, event_type: eventType })
  } catch {}
}

/** Submit review */
export async function submitPlacesReview(listingId, reviewerName, rating, comment) {
  if (!supabase) return
  try {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('places_reviews').insert({
      listing_id: listingId,
      reviewer_id: userData?.user?.id,
      reviewer_name: reviewerName,
      rating, comment,
    })
    const { data: reviews } = await supabase.from('places_reviews').select('rating').eq('listing_id', listingId)
    if (reviews?.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      await supabase.from('places_listings').update({ rating_avg: Math.round(avg * 10) / 10, rating_count: reviews.length }).eq('id', listingId)
    }
  } catch (e) { console.warn('Review submit error:', e) }
}

/** Notify business owner that a customer booked a ride to their place (in-app only, no personal data shared) */
export async function notifyBusinessRideBooked(placeName, vehicleType, etaMinutes) {
  const vehicleLabel = vehicleType === 'car_taxi' ? '🚗 Car' : '🏍️ Bike'
  const message = {
    id: 'notif_' + Date.now(),
    type: 'places_ride_booked',
    title: 'Customer on the way!',
    body: `${vehicleLabel} ride booked to ${placeName}. ETA ~${etaMinutes} min`,
    icon: vehicleType === 'car_taxi' ? '🚗' : '🏍️',
    placeName,
    vehicleType,
    etaMinutes,
    read: false,
    createdAt: new Date().toISOString(),
  }

  // Save to localStorage notification queue (for in-app display)
  const notifs = JSON.parse(localStorage.getItem('indoo_places_notifications') || '[]')
  notifs.unshift(message)
  localStorage.setItem('indoo_places_notifications', JSON.stringify(notifs.slice(0, 50)))

  // Supabase — insert into a notifications channel for the business owner
  if (supabase) {
    try {
      // Find the listing by name to get owner_id
      const { data: listing } = await supabase
        .from('places_listings')
        .select('id, owner_id')
        .eq('business_name', placeName)
        .eq('status', 'approved')
        .single()

      if (listing?.owner_id) {
        // Track as analytics event
        await supabase.from('places_analytics').insert({ listing_id: listing.id, event_type: 'ride_booked' })
        // Increment ride count
        await supabase.rpc('increment_ride_count', { listing_id: listing.id }).catch(() => {
          // Fallback if RPC doesn't exist
          supabase.from('places_listings').update({ ride_count: listing.ride_count + 1 }).eq('id', listing.id)
        })
      }
    } catch (e) { console.warn('Places ride notify error:', e) }
  }

  return message
}

/** Get approved listings */
export async function getApprovedPlacesListings() {
  if (!supabase) return []
  try {
    const { data } = await supabase.from('places_listings').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

/** Validate referral code */
export async function validateReferralCode(code) {
  if (!supabase || !code) return false
  try {
    const { data } = await supabase.from('places_listings').select('id').eq('referral_code', code).eq('status', 'approved').single()
    return !!data
  } catch { return false }
}
