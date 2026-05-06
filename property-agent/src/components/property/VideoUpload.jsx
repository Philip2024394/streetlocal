/**
 * VideoUpload — Record or upload a property video tour.
 * Max 1 minute. Uploads to Supabase Storage.
 */
import { useState, useRef } from 'react'
import { uploadPropertyVideo, generateVideoThumbnail, getVideoDuration, MAX_SIZE_MB, MAX_DURATION_SEC } from '@/services/videoUploadService'

export default function VideoUpload({ listingRef, onVideoUploaded, existingUrl }) {
  const [videoUrl, setVideoUrl] = useState(existingUrl || null)
  const [thumbnail, setThumbnail] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    setError('')

    // Check size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_SIZE_MB}MB.`)
      return
    }

    // Check duration
    setProgress('Checking duration...')
    const duration = await getVideoDuration(file)
    if (duration > MAX_DURATION_SEC) {
      setError(`Video too long (${Math.round(duration)}s). Max ${MAX_DURATION_SEC} seconds.`)
      setProgress('')
      return
    }

    // Generate thumbnail
    setProgress('Creating thumbnail...')
    const thumb = await generateVideoThumbnail(file)
    setThumbnail(thumb)

    // Upload
    setProgress('Uploading video...')
    setUploading(true)
    try {
      const url = await uploadPropertyVideo(file, listingRef)
      setVideoUrl(url)
      onVideoUploaded?.(url, thumb)
      setProgress('')
    } catch (e) {
      setError(e.message || 'Upload failed')
      setProgress('')
    }
    setUploading(false)
  }

  const handleRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4' })
      const chunks = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

      // Auto-stop after 60 seconds
      const timeout = setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, MAX_DURATION_SEC * 1000)

      recorder.onstop = () => {
        clearTimeout(timeout)
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], `tour_${Date.now()}.webm`, { type: 'video/webm' })
        handleFile(file)
      }

      recorder.start(100)

      // Show recording UI
      setProgress('Recording... (tap Stop when done, max 60s)')
      setError('')

      // Store recorder to stop from UI
      window._indooRecorder = { recorder, timeout }
    } catch (e) {
      setError('Camera not available. Try uploading a file instead.')
    }
  }

  const stopRecording = () => {
    if (window._indooRecorder?.recorder?.state === 'recording') {
      window._indooRecorder.recorder.stop()
      clearTimeout(window._indooRecorder.timeout)
      window._indooRecorder = null
    }
  }

  const removeVideo = () => {
    setVideoUrl(null)
    setThumbnail(null)
    onVideoUploaded?.(null, null)
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>🎬 Video Tour <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>Max 1 minute</span></div>

      {error && <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{error}</div>}

      {videoUrl ? (
        /* Video preview */
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
          <video src={videoUrl} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, background: '#000' }} controls />
          <button onClick={removeVideo} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
          <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 10px', borderRadius: 6, background: 'rgba(141,198,63,0.9)', fontSize: 10, fontWeight: 900, color: '#000' }}>✓ Video uploaded</div>
        </div>
      ) : (
        /* Upload options */
        <>
          {progress ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#8DC63F', fontWeight: 700, marginBottom: 8 }}>{progress}</div>
              {progress.includes('Recording') && (
                <button onClick={stopRecording} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>⏹ Stop Recording</button>
              )}
              {uploading && <div style={{ width: 40, height: 40, border: '3px solid rgba(141,198,63,0.2)', borderTopColor: '#8DC63F', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '8px auto' }} />}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleRecord} style={{
                flex: 1, padding: '14px 0', borderRadius: 12, border: '1.5px solid rgba(141,198,63,0.3)',
                background: 'rgba(141,198,63,0.08)', color: '#8DC63F', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>📹 Record</button>
              <button onClick={() => fileRef.current?.click()} style={{
                flex: 1, padding: '14px 0', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>📁 Upload</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'center' }}>MP4 or WebM · Max {MAX_SIZE_MB}MB · Max {MAX_DURATION_SEC}s</div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
