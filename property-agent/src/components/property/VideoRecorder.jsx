/**
 * VideoRecorder — Full-screen camera overlay for recording 1-minute property tour videos.
 * Uses browser MediaRecorder API (no external packages).
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const MAX_DURATION = 60 // seconds

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function VideoRecorder({ open, onClose, onSave }) {
  const [state, setState] = useState('idle') // idle | recording | preview
  const [elapsed, setElapsed] = useState(0)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const blobRef = useRef(null)

  const startCamera = useCallback(async (facing) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setError(null)
    } catch {
      setError('Camera not available. Please allow camera access and try again.')
    }
  }, [])

  useEffect(() => {
    if (open && state === 'idle') startCamera(facingMode)
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [open])

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      blobRef.current = blob
      setPreviewUrl(URL.createObjectURL(blob))
      setState('preview')
    }
    recorder.start(100)
    recorderRef.current = recorder
    setElapsed(0)
    setState('recording')
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= MAX_DURATION - 1) {
          recorder.stop()
          clearInterval(timerRef.current)
          return MAX_DURATION
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    blobRef.current = null
    setState('idle')
    setElapsed(0)
    startCamera(facingMode)
  }

  const handleSave = () => {
    if (!blobRef.current) return
    // Generate thumbnail from first frame
    const video = document.createElement('video')
    video.src = previewUrl
    video.currentTime = 0.5
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7)
      onSave?.(blobRef.current, thumbnailUrl)
      cleanup()
    }
    video.onerror = () => {
      onSave?.(blobRef.current, null)
      cleanup()
    }
  }

  const cleanup = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setState('idle')
    setElapsed(0)
    setPreviewUrl(null)
    onClose?.()
  }

  if (!open) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9800, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Camera / Preview */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 8 }}>{error}</div>
            <button onClick={cleanup} style={{ ...glass, padding: '12px 24px', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        ) : state === 'preview' ? (
          <video ref={null} src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls autoPlay loop playsInline />
        ) : (
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} autoPlay playsInline muted />
        )}

        {/* Recording indicator */}
        {state === 'recording' && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, ...glass, padding: '8px 16px', borderRadius: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'rd_pulse 1s ease-in-out infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>REC</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginLeft: 8 }}>{formatTime(elapsed)}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>/ {formatTime(MAX_DURATION)}</span>
          </div>
        )}

        {/* Timer progress bar */}
        {state === 'recording' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ height: '100%', background: elapsed > 50 ? '#EF4444' : '#8DC63F', width: `${(elapsed / MAX_DURATION) * 100}%`, transition: 'width 1s linear' }} />
          </div>
        )}

        {/* Top buttons (idle/recording) */}
        {state !== 'preview' && !error && (
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={cleanup} style={{ width: 44, height: 44, borderRadius: 22, ...glass, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            {state === 'idle' && (
              <button onClick={flipCamera} style={{ width: 44, height: 44, borderRadius: 22, ...glass, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 5h-3.2L15 3H9L7.2 5H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ flexShrink: 0, padding: '20px 24px 32px', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        {state === 'idle' && !error && (
          <>
            <div style={{ width: 44 }} />
            <button onClick={startRecording} style={{
              width: 72, height: 72, borderRadius: '50%', border: '4px solid #fff', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EF4444' }} />
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, width: 44, textAlign: 'center' }}>1 min<br />max</div>
          </>
        )}

        {state === 'recording' && (
          <button onClick={stopRecording} style={{
            width: 72, height: 72, borderRadius: '50%', border: '4px solid #fff', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EF4444' }} />
          </button>
        )}

        {state === 'preview' && (
          <>
            <button onClick={retake} style={{
              padding: '14px 28px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              🔄 Retake
            </button>
            <button onClick={handleSave} style={{
              padding: '14px 32px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
            }}>
              ✓ Save Video
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
