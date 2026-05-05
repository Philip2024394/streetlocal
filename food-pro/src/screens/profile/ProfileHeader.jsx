/**
 * ProfileHeader — photo gallery, avatar/main photo, extra gallery slots,
 * photo tips modal, photo reposition/zoom editor panel.
 *
 * Props:
 *   photoURL, setPhotoURL, photoFile, setPhotoFile,
 *   photoOffsetX, setPhotoOffsetX, photoOffsetY, setPhotoOffsetY,
 *   photoZoom, setPhotoZoom,
 *   extraPhotos, setExtraPhotos, extraPhotoFiles, setExtraPhotoFiles,
 *   lookingFor,
 *   user,
 *   showToast,
 *   MAX_MB (number)
 */
import { useRef, useState } from 'react'
import { clearPhotoViewCount } from '@/services/photoNudgeService'
import styles from '../ProfileScreen.module.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB    = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" can't be uploaded. Accepted formats: JPG, PNG, WEBP.`
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `"${file.name}" is ${mb}MB — maximum file size is ${MAX_MB}MB.`
  }
  return null
}

export default function ProfileHeader({
  photoURL, setPhotoURL,
  photoFile, setPhotoFile,
  photoOffsetX, setPhotoOffsetX,
  photoOffsetY, setPhotoOffsetY,
  photoZoom, setPhotoZoom,
  extraPhotos, setExtraPhotos,
  extraPhotoFiles, setExtraPhotoFiles,
  lookingFor,
  user,
  showToast,
}) {
  const mainInputRef = useRef(null)
  const extra0 = useRef(null)
  const extra1 = useRef(null)
  const extra2 = useRef(null)
  const extra3 = useRef(null)
  const extraInputRefs = [extra0, extra1, extra2, extra3]

  const [photoTipsOpen, setPhotoTipsOpen] = useState(false)
  const [photoEditOpen, setPhotoEditOpen] = useState(false)

  function handleMainPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { showToast(err); e.target.value = ''; return }
    setPhotoFile(file)
    setPhotoURL(URL.createObjectURL(file))
    setPhotoOffsetX(50); setPhotoOffsetY(50); setPhotoZoom(1)
    setPhotoEditOpen(true)
    clearPhotoViewCount(user?.id)
    e.target.value = ''
  }

  function handleExtraPhoto(idx, e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { showToast(err); e.target.value = ''; return }
    setExtraPhotos(prev => { const n = [...prev]; n[idx] = URL.createObjectURL(file); return n })
    setExtraPhotoFiles(prev => { const n = [...prev]; n[idx] = file; return n })
    e.target.value = ''
  }

  return (
    <>
      <div className={styles.photoSection} style={{ position: 'relative' }}>

        {/* Photo tips help button */}
        <button className={styles.photoTipsBtn} onClick={() => setPhotoTipsOpen(true)} aria-label="Photo guidelines">
          ?
        </button>

        {/* Photo tips modal */}
        {photoTipsOpen && (
          <div className={styles.photoTipsBackdrop} onClick={() => setPhotoTipsOpen(false)}>
            <div className={styles.photoTipsModal} onClick={e => e.stopPropagation()}>
              <div className={styles.photoTipsHeader}>
                <span className={styles.photoTipsTitle}>Image Guidelines</span>
                <button className={styles.photoTipsClose} onClick={() => setPhotoTipsOpen(false)}>✕</button>
              </div>
              <ul className={styles.photoTipsList}>
                <li>No cap or hat — your full head must be visible</li>
                <li>No sunglasses — eyes must be clearly visible</li>
                <li>Direct front-facing view — look straight at the camera</li>
                <li>Clear, plain background — no bright sunlight or sun rays behind you</li>
                <li>No other people in the image — solo photo only</li>
                <li>Well-lit, sharp image — blurry or dark photos will be rejected</li>
              </ul>
              <p className={styles.photoTipsNote}>Profiles that do not meet these requirements may be removed or suspended by our team.</p>
              <button className={styles.photoTipsDone} onClick={() => setPhotoTipsOpen(false)}>Got it</button>
            </div>
          </div>
        )}

        <div className={styles.photoSectionHeader}>
          <div className={styles.photoSectionLeft}>
            <div className={styles.photoSectionTitleRow}>
              <span className={styles.photoSectionTitle}>Upload</span>
            </div>
            <span className={styles.photoSectionSub}>Guide lines apply</span>
          </div>
        </div>

        {/* Main photo slot */}
        <div className={styles.mainSlot} onClick={() => mainInputRef.current?.click()}>
          <img
            src={photoURL || 'https://ik.imagekit.io/nepgaxllc/sdfasdfasdf.png'}
            alt="Main"
            className={styles.mainSlotImg}
            style={photoURL ? {
              objectPosition: `${photoOffsetX}% ${photoOffsetY}%`,
              transform: `scale(${photoZoom})`,
              transformOrigin: `${photoOffsetX}% ${photoOffsetY}%`,
            } : {
              objectPosition: 'top center',
            }}
          />
          {!photoURL && (
            <div className={styles.slotDefaultOverlay}>
              <span className={styles.slotDefaultLabel}>Tap to add your photo</span>
            </div>
          )}
          <div className={styles.mainSlotOverlay}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <input ref={mainInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleMainPhoto} />
        </div>

        {/* Driver photo requirement notice */}
        {(lookingFor === 'bike_ride' || lookingFor === 'car_taxi') && (
          <div className={styles.driverPhotoNotice}>
            <span className={styles.driverPhotoNoticeIcon}>⚠️</span>
            <span className={styles.driverPhotoNoticeText}>
              Clear front-facing photo required — no hat, no sunglasses, full face visible. This is your driver ID photo seen by customers.
            </span>
          </div>
        )}

        {/* 4 thumbnail slots — hidden for drivers */}
        {lookingFor !== 'bike_ride' && lookingFor !== 'car_taxi' && (
          <div className={styles.thumbsRow}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={styles.thumbSlot} onClick={() => extraInputRefs[i].current?.click()}>
                {extraPhotos[i]
                  ? <img src={extraPhotos[i]} alt={`Photo ${i + 2}`} className={styles.thumbImg} />
                  : <span className={styles.thumbPlus}>+</span>
                }
                <input
                  ref={extraInputRefs[i]}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={e => handleExtraPhoto(i, e)}
                />
              </div>
            ))}
          </div>
        )}

        <p className={styles.fileHint}>
          Accepted: JPG · PNG · WEBP &nbsp;·&nbsp; Max {MAX_MB}MB per photo
        </p>

        {photoURL && (
          <button className={styles.adjustBtn} onClick={() => setPhotoEditOpen(true)}>
            Adjust main photo position
          </button>
        )}
      </div>

      {/* Photo reposition panel */}
      {photoEditOpen && (
        <div className={styles.photoEditPanel}>
          <div className={styles.photoEditHeader}>
            <button className={styles.photoEditHomeBtn} onClick={() => setPhotoEditOpen(false)} aria-label="Close editor">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <span className={styles.photoEditTitle}>Photo Editor</span>
          </div>
          <div className={styles.photoEditPreviewWrap}>
            <img
              src={photoURL}
              alt="Preview"
              className={styles.photoEditPreviewImg}
              style={{
                objectPosition: `${photoOffsetX}% ${photoOffsetY}%`,
                transform: `scale(${photoZoom})`,
                transformOrigin: `${photoOffsetX}% ${photoOffsetY}%`,
              }}
            />
            <div className={styles.photoEditOverlayLabel}>
              <span className={styles.photoEditOverlayTitle}>Adjust Photo</span>
              <span className={styles.photoEditOverlaySub}>Adjust for best position</span>
            </div>
          </div>
          <div className={styles.photoEditSliders}>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>HORIZONTAL</span>
                <span className={styles.photoEditSliderValue}>{photoOffsetX > 50 ? `R ${photoOffsetX - 50}` : photoOffsetX < 50 ? `L ${50 - photoOffsetX}` : 'CENTER'}</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>↔</span>
                <input type="range" min={0} max={100} value={photoOffsetX} onChange={e => setPhotoOffsetX(Number(e.target.value))} className={styles.photoEditSlider} />
              </div>
            </div>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>VERTICAL</span>
                <span className={styles.photoEditSliderValue}>{photoOffsetY > 50 ? `DOWN ${photoOffsetY - 50}` : photoOffsetY < 50 ? `UP ${50 - photoOffsetY}` : 'CENTER'}</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>↕</span>
                <input type="range" min={0} max={100} value={photoOffsetY} onChange={e => setPhotoOffsetY(Number(e.target.value))} className={styles.photoEditSlider} />
              </div>
            </div>
            <div className={styles.photoEditSliderBlock}>
              <div className={styles.photoEditSliderHeader}>
                <span className={styles.photoEditSliderName}>ZOOM</span>
                <span className={styles.photoEditSliderValue}>{Math.round(photoZoom * 100)}%</span>
              </div>
              <div className={styles.photoEditRow}>
                <span className={styles.photoEditLabel}>🔍</span>
                <input type="range" min={100} max={250} value={Math.round(photoZoom * 100)} onChange={e => setPhotoZoom(Number(e.target.value) / 100)} className={styles.photoEditSlider} />
              </div>
            </div>
          </div>
          <div className={styles.photoEditFooter}>
            <p className={styles.photoEditHint}>Drag sliders to reposition · zoom in to fill the frame</p>
            <button className={styles.photoSaveBtn} onClick={() => setPhotoEditOpen(false)}>
              Save Photo
            </button>
          </div>
        </div>
      )}
    </>
  )
}
