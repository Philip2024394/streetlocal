/**
 * Navigation Audio — voice turn-by-turn announcements using Web Speech API.
 * Falls back to a beep tone if speech synthesis is unavailable.
 */

let muted = false
let currentUtterance = null

export function setNavMuted(val) { muted = val }
export function isNavMuted() { return muted }
export function toggleNavMute() { muted = !muted; return muted }

/**
 * Speak a navigation instruction aloud.
 */
export function speakInstruction(text) {
  if (muted || !text) return
  if (!window.speechSynthesis) { playBeep(); return }

  // Cancel any in-progress speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'id-ID' // Indonesian first
  utterance.rate = 1.0
  utterance.pitch = 1.0
  utterance.volume = 1.0

  // Try Indonesian voice, fallback to any available
  const voices = window.speechSynthesis.getVoices()
  const idVoice = voices.find(v => v.lang.startsWith('id'))
  if (idVoice) utterance.voice = idVoice

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

/**
 * Announce arrival at destination.
 */
export function speakArrival() {
  speakInstruction('Anda telah sampai di tujuan')
}

/**
 * Announce re-routing.
 */
export function speakReroute() {
  speakInstruction('Mencari rute baru')
}

/**
 * Play a simple beep as fallback when speech synthesis is unavailable.
 */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.3
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch { /* silent fail */ }
}

/**
 * Cancel any ongoing speech.
 */
export function cancelSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}
