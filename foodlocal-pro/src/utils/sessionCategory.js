import { ACTIVITY_TYPES } from '@/firebase/collections'

// Categories that classify a session as "maker/trade" rather than social
export const MAKER_CATEGORIES = ['handmade', 'craft_supplies', 'property', 'professional']

/**
 * Returns true if the session belongs to the maker/trade category.
 * Checks both the activity type category and the session's lookingFor field.
 */
export function isMakerSession(session) {
  const activityCategory = ACTIVITY_TYPES.find(a => a.id === session.activityType)?.category
  return MAKER_CATEGORIES.includes(session.lookingFor) || activityCategory === 'handmade'
}
