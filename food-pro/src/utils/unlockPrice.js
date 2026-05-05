const EUROPE = ['germany','france','netherlands','spain','italy','belgium','portugal','ireland','austria','finland','sweden','denmark','switzerland','poland','greece','czech republic','hungary','romania','croatia','slovakia','slovenia']

const SEA = ['indonesia', 'malaysia', 'philippines', 'vietnam', 'thailand', 'singapore']

/**
 * Returns display price + Stripe charge details for a buyer's country (contact unlock).
 */
export function getUnlockPrice(country) {
  const c = (country ?? '').toLowerCase().trim()

  if (SEA.includes(c))
    return { display: 'Rp 25,000', stripeAmount: 25000, stripeCurrency: 'idr' }

  if (c === 'united kingdom')
    return { display: '£1.50', stripeAmount: 150, stripeCurrency: 'gbp' }

  if (EUROPE.includes(c))
    return { display: '€1.50', stripeAmount: 150, stripeCurrency: 'eur' }

  if (['australia', 'new zealand'].includes(c))
    return { display: 'A$1.50', stripeAmount: 150, stripeCurrency: 'aud' }

  return { display: '$1.50', stripeAmount: 150, stripeCurrency: 'usd' }
}

/**
 * Returns the seller listing subscription price for their country.
 * Listing plan = £1.50/month equivalent worldwide.
 */
export function getListingPrice(country) {
  const c = (country ?? '').toLowerCase().trim()

  if (SEA.includes(c))
    return { display: 'Rp 25,000', period: '/month', stripeAmount: 25000, stripeCurrency: 'idr' }

  if (c === 'united kingdom')
    return { display: '£1.50', period: '/month', stripeAmount: 150, stripeCurrency: 'gbp' }

  if (EUROPE.includes(c))
    return { display: '€1.75', period: '/month', stripeAmount: 175, stripeCurrency: 'eur' }

  if (['australia', 'new zealand'].includes(c))
    return { display: 'A$2.99', period: '/month', stripeAmount: 299, stripeCurrency: 'aud' }

  if (['india', 'pakistan', 'bangladesh', 'sri lanka'].includes(c))
    return { display: '₹150', period: '/month', stripeAmount: 15000, stripeCurrency: 'inr' }

  if (['nigeria', 'ghana', 'kenya', 'south africa'].includes(c))
    return { display: '$1.50', period: '/month', stripeAmount: 150, stripeCurrency: 'usd' }

  return { display: '$1.99', period: '/month', stripeAmount: 199, stripeCurrency: 'usd' }
}
