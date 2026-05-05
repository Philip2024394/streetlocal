/**
 * Section Visit Service
 * Tracks whether user has seen the landing page for each section.
 * After first visit, landing page is skipped — user goes straight to content.
 */

const STORAGE_KEY = 'indoo_section_visits'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
  catch { return {} }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Check if user has visited this section before */
export function hasVisitedSection(section) {
  return !!load()[section]
}

/** Mark section as visited (landing page won't show again) */
export function markSectionVisited(section) {
  const visits = load()
  visits[section] = new Date().toISOString()
  save(visits)
}

/** Reset a section visit (show landing again) — useful for testing */
export function resetSectionVisit(section) {
  const visits = load()
  delete visits[section]
  save(visits)
}

/** Reset all section visits */
export function resetAllVisits() {
  localStorage.removeItem(STORAGE_KEY)
}
