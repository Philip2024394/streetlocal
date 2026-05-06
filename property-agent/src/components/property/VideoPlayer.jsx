/**
 * VideoPlayer — Inline thumbnail + full-screen video player for property tour videos.
 * No external packages — uses native HTML5 video.
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function VideoPlayer({ videoUrl, thumbnailUrl, style = {} }) {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!open || !videoRef.current) return
    videoRef.current.play().then(() => setPlaying(true)).catch(() => {})
  }, [open])

  if (!videoUrl) return null

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) { videoRef.current.pause(); setPlaying(false) }
    else { videoRef.current.play(); setPlaying(true) }
  }

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * duration
  }

  return (
    <>
      {/* Thumbnail */}
      <button onClick={() => setOpen(true)} style={{
        position: 'relative', display: 'block', width: '100%', borderRadius: 14, overflow: 'hidden',
        border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)',
        cursor: 'pointer', padding: 0, aspectRatio: '16/9', ...style,
      }}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="Video tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 }}>🎬</span>
          </div>
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(141,198,63,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><polygon points="8,5 19,12 8,19" /></svg>
          </div>
        </div>
        {/* Label */}
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>
          🎬 Property Tour
        </div>
        {/* Duration badge */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {formatTime(duration || 60)}
        </div>
      </button>

      {/* Full-screen player */}
      {open && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9850, background: '#000', display: 'flex', flexDirection: 'column' }}>
          {/* Close */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <button onClick={() => { setOpen(false); setPlaying(false) }} style={{
              width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Label */}
          <div style={{ position: 'absolute', top: 20, left: 16, zIndex: 10, padding: '6px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', fontSize: 13, fontWeight: 700, color: '#8DC63F' }}>
            🎬 Property Tour
          </div>

          {/* Video */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={togglePlay}>
            <video
              ref={videoRef}
              src={videoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
              muted={muted}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onEnded={() => setPlaying(false)}
            />
            {!playing && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(141,198,63,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#000"><polygon points="8,5 19,12 8,19" /></svg>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ flexShrink: 0, padding: '12px 20px 28px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}>
            {/* Seek bar */}
            <div onClick={handleSeek} style={{ height: 20, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', position: 'relative' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#8DC63F', width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
                <div style={{
                  position: 'absolute', top: -4, width: 12, height: 12, borderRadius: '50%', background: '#8DC63F',
                  left: duration ? `${(currentTime / duration) * 100}%` : '0%', transform: 'translateX(-50%)',
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={(e) => { e.stopPropagation(); togglePlay() }} style={{
                  width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {playing ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 19,12 8,19"/></svg>
                  )}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMuted(!muted) }} style={{
                  width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    {muted ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></> : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></>}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
