// Tracks how many times a no-photo profile has been viewed by others.
// Stored in localStorage — backed by Supabase in a real deployment.

const KEY = 'indoo_photo_views_v1'

function _read() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

function _write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

/** Called when someone views a no-photo profile card */
export function recordPhotoView(userId) {
  if (!userId) return
  const counts = _read()
  counts[userId] = (counts[userId] ?? 0) + 1
  _write(counts)
}

/** Returns how many times this user's no-photo profile has been viewed */
export function getPhotoViewCount(userId) {
  if (!userId) return 0
  return _read()[userId] ?? 0
}

/** Clear after user uploads a photo */
export function clearPhotoViewCount(userId) {
  if (!userId) return
  const counts = _read()
  delete counts[userId]
  _write(counts)
}
