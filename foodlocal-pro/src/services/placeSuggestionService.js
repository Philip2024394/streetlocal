/**
 * Place Suggestion Service
 * Users suggest places → stored in localStorage → admin reviews → approved = added to directory
 */

const STORAGE_KEY = 'indoo_place_suggestions'

export const ACTIVITY_TYPES = [
  { id: 'food',       icon: '🍽️', label: 'Food' },
  { id: 'drink',      icon: '🍹', label: 'Drink' },
  { id: 'club',       icon: '🍸', label: 'Club / Nightlife' },
  { id: 'cafe',       icon: '☕', label: 'Cafe' },
  { id: 'shopping',   icon: '🛍️', label: 'Shopping' },
  { id: 'temple',     icon: '🛕', label: 'Temple / Heritage' },
  { id: 'nature',     icon: '🌿', label: 'Nature / Outdoor' },
  { id: 'beach',      icon: '🏖️', label: 'Beach' },
  { id: 'sport',      icon: '⚽', label: 'Sport / Gym' },
  { id: 'salon',      icon: '💇', label: 'Hair & Beauty' },
  { id: 'spa',        icon: '💆', label: 'Massage & Spa' },
  { id: 'karaoke',    icon: '🎤', label: 'Karaoke' },
  { id: 'billiards',  icon: '🎱', label: 'Billiards' },
  { id: 'art',        icon: '🎨', label: 'Art & Culture' },
  { id: 'hospital',   icon: '🏥', label: 'Hospital / Clinic' },
  { id: 'transport',  icon: '🚉', label: 'Transport' },
  { id: 'government', icon: '🏛️', label: 'Government' },
  { id: 'hotel',      icon: '🏨', label: 'Hotel / Stay' },
  { id: 'other',      icon: '📍', label: 'Other' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Submit a new place suggestion */
export function submitSuggestion({ placeName, activityType, address, lat, lng, photo, submitterName, whatsapp, notes }) {
  const suggestions = load()
  const entry = {
    id: 'sug_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    placeName,
    activityType,
    address: address || '',
    lat: lat || null,
    lng: lng || null,
    photo: photo || null,
    submitterName,
    whatsapp,
    notes: notes || '',
    status: 'pending',       // pending | approved | rejected
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    adminNote: '',
  }
  suggestions.unshift(entry)
  save(suggestions)
  return entry
}

/** Get all suggestions (admin) */
export function getAllSuggestions() {
  return load()
}

/** Get pending suggestions count */
export function getPendingCount() {
  return load().filter(s => s.status === 'pending').length
}

/** Approve a suggestion (admin) */
export function approveSuggestion(id, adminNote = '') {
  const suggestions = load()
  const idx = suggestions.findIndex(s => s.id === id)
  if (idx === -1) return null
  suggestions[idx].status = 'approved'
  suggestions[idx].reviewedAt = new Date().toISOString()
  suggestions[idx].adminNote = adminNote
  save(suggestions)
  return suggestions[idx]
}

/** Reject a suggestion (admin) */
export function rejectSuggestion(id, adminNote = '') {
  const suggestions = load()
  const idx = suggestions.findIndex(s => s.id === id)
  if (idx === -1) return null
  suggestions[idx].status = 'rejected'
  suggestions[idx].reviewedAt = new Date().toISOString()
  suggestions[idx].adminNote = adminNote
  save(suggestions)
  return suggestions[idx]
}

/** Delete a suggestion (admin) */
export function deleteSuggestion(id) {
  const suggestions = load().filter(s => s.id !== id)
  save(suggestions)
}
