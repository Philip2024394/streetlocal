import { useRef, useState } from 'react'
import { uploadImage } from '@/lib/uploadImage'

/**
 * Reusable image upload component.
 *
 * Props:
 *   value      {string}   current image URL (to show preview)
 *   onChange   {fn}       called with the new public URL after upload
 *   folder     {string}   Supabase storage sub-folder (default 'general')
 *   size       {number}   preview size in px (default 80)
 *   shape      {string}   'circle' | 'square' (default 'square')
 *   accentColor {string}  border/button accent (default '#00E5FF')
 */
export default function ImageUpload({
  value,
  onChange,
  folder = 'general',
  size = 80,
  shape = 'square',
  accentColor = '#00E5FF',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [localPreview, setLocalPreview] = useState(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const radius = shape === 'circle' ? '50%' : 10

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // Instant local preview
    const localUrl = URL.createObjectURL(file)
    setLocalPreview(localUrl)
    setError(null)
    setUploading(true)

    try {
      const url = await uploadImage(file, folder)
      onChange?.(url)
      setLocalPreview(null)
      setError(null)
    } catch (err) {
      // Upload failed — keep the local preview and show URL paste option
      setError(`Upload failed: ${err.message}. Paste a URL instead.`)
      setLocalPreview(null)
      setShowUrlInput(true)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    const url = urlDraft.trim()
    if (!url) return
    onChange?.(url)
    setUrlDraft('')
    setShowUrlInput(false)
    setError(null)
  }

  const preview = localPreview || value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: radius,
          border: `2px solid ${uploading ? accentColor : `${accentColor}66`}`,
          overflow: 'hidden',
          flexShrink: 0,
          cursor: 'pointer',
          background: '#0a0a18',
          transition: 'border-color 0.15s',
          boxShadow: uploading ? `0 0 16px ${accentColor}44` : 'none',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        title="Click to upload image"
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: uploading ? 0.5 : 1 }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, color: `${accentColor}88`,
          }}>
            <span style={{ fontSize: size > 60 ? 24 : 16 }}>📷</span>
            {size > 60 && <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upload</span>}
          </div>
        )}

        {uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
          }}>
            <span style={{ fontSize: 11, color: accentColor, fontWeight: 700, animation: 'pulse 1s infinite' }}>…</span>
          </div>
        )}

        {/* Hover overlay */}
        {!uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0)', transition: 'background 0.15s',
            fontSize: 14,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
          >
            <span style={{ opacity: 0, transition: 'opacity 0.15s', color: '#fff', fontSize: 18 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
            >✎</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}44`,
            borderRadius: 7,
            color: accentColor,
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 12px',
            cursor: uploading ? 'default' : 'pointer',
            fontFamily: 'inherit',
            opacity: uploading ? 0.6 : 1,
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => !uploading && (e.currentTarget.style.background = `${accentColor}28`)}
          onMouseLeave={e => e.currentTarget.style.background = `${accentColor}18`}
        >
          {uploading ? 'Uploading…' : preview ? 'Change Photo' : 'Upload Photo'}
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(v => !v)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 7,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {showUrlInput ? 'Cancel' : 'Paste URL'}
        </button>
      </div>

      {showUrlInput && (
        <div style={{ display: 'flex', gap: 6, width: '100%', maxWidth: 320 }}>
          <input
            type="url"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://example.com/image.jpg"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 7,
              color: '#fff',
              fontSize: 12,
              padding: '6px 10px',
              fontFamily: 'inherit',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            style={{
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}44`,
              borderRadius: 7,
              color: accentColor,
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Set
          </button>
        </div>
      )}

      {error && (
        <span style={{ fontSize: 11, color: '#FF4444', maxWidth: 300, lineHeight: 1.4 }}>{error}</span>
      )}
    </div>
  )
}
