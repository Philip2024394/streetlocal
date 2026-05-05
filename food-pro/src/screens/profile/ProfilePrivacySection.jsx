/**
 * ProfilePrivacySection — the account side drawer (privacy/safety settings,
 * push notifications toggle, sign out, delete account, download data, reset
 * password) and the Get Verified tab (social links, verified badge, pricing).
 *
 * Also renders driver modals (incoming booking, active trip, earnings screen)
 * and the restaurant dashboard overlay.
 */
import { createPortal } from 'react-dom'
import { useState as useLocalState } from 'react'
import { deleteAccount, exportMyData } from '@/services/profileService'
import { signOut, sendPasswordReset } from '@/services/authService'
import { endSession } from '@/services/sessionService'
import { supabase } from '@/lib/supabase'
import DriverIncomingBooking from '@/components/driver/DriverIncomingBooking'
import DriverTripScreen from '@/components/driver/DriverTripScreen'
import DriverEarningsScreen from '@/components/driver/DriverEarningsScreen'
import RestaurantDashboard from '@/components/restaurant/RestaurantDashboard'
import styles from '../ProfileScreen.module.css'

export default function ProfilePrivacySection({
  // Drawer state
  drawerOpen, setDrawerOpen,
  drawerSigningOut, setDrawerSigningOut,
  deleteStep, setDeleteStep,
  exportingData, setExportingData,
  resetPwStep, setResetPwStep,
  notifOn,
  handleNotifToggle,
  // Auth
  user, userProfile,
  mySession,
  setToast,
  // Driver overlays
  incomingBooking, setIncomingBooking,
  activeTrip, setActiveTrip,
  earningsOpen, setEarningsOpen,
  driverId,
  // Restaurant
  restaurantDashOpen, setRestaurantDashOpen,
  // Verified tab (social links)
  profileTab, setProfileTab,
  pricing,
  instagramHandle, setInstagramHandle,
  tiktokHandle, setTiktokHandle,
  facebookHandle, setFacebookHandle,
  websiteUrl, setWebsiteUrl,
  youtubeHandle, setYoutubeHandle,
  confirmedLinks, setConfirmedLinks,
  onboarding,
  onClose,
  showToast,
}) {
  // ── ID verification upload ───────────────────────────────────────────────
  const [idFile,       setIdFile]       = useLocalState(null)
  const [idUploading,  setIdUploading]  = useLocalState(false)
  const [idStatus,     setIdStatus]     = useLocalState(
    userProfile?.id_verification_status ?? null  // 'pending' | 'approved' | 'rejected'
  )

  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIdFile(file)
    if (!supabase || (!user?.id && !user?.uid)) return
    setIdUploading(true)
    try {
      const uid  = user.uid ?? user.id
      const path = `id-documents/${uid}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
      await supabase.from('profiles').update({
        id_document_url:         urlData.publicUrl,
        id_verification_status:  'pending',
        id_verified:             false,
        updated_at:              new Date().toISOString(),
      }).eq('id', uid)
      setIdStatus('pending')
      showToast?.('ID submitted for review ✅')
    } catch (err) {
      showToast?.(err.message ?? 'Upload failed', 'error')
    }
    setIdUploading(false)
  }

  // ── Driver's licence upload ───────────────────────────────────────────────
  const [licenseFile,     setLicenseFile]     = useLocalState(null)
  const [licenseUploading, setLicenseUploading] = useLocalState(false)
  const [licenseStatus,   setLicenseStatus]   = useLocalState(
    userProfile?.licenseStatus ?? null   // 'pending' | 'approved' | 'rejected'
  )

  const handleLicenseUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLicenseFile(file)
    if (!supabase || !user?.id && !user?.uid) return
    setLicenseUploading(true)
    try {
      const uid  = user.uid ?? user.id
      const path = `driver-licenses/${uid}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
      await supabase.from('profiles').update({
        driver_license_url:    urlData.publicUrl,
        driver_license_status: 'pending',
        updated_at:            new Date().toISOString(),
      }).eq('id', uid)
      setLicenseStatus('pending')
      showToast?.('Licence submitted for review ✅')
    } catch (err) {
      showToast?.(err.message ?? 'Upload failed', 'error')
    }
    setLicenseUploading(false)
  }

  async function handleDrawerSignOut() {
    setDrawerSigningOut(true)
    try {
      if (mySession?.id) await endSession(mySession.id)
      await signOut()
      setDrawerOpen(false)
    } catch {
      setToast({ message: 'Could not sign out. Try again.', type: 'error' })
    }
    setDrawerSigningOut(false)
  }

  // ── Get Verified tab ─────────────────────────────────────────────────────────
  const SOCIAL_LINKS = [
    { key: 'instagram', label: 'Instagram', placeholder: 'your_username', value: instagramHandle, set: setInstagramHandle, color: '#8B0000',
      getUrl: v => `https://instagram.com/${v}`,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
    },
    { key: 'tiktok', label: 'TikTok', placeholder: 'your_username', value: tiktokHandle, set: setTiktokHandle, color: '#010101',
      getUrl: v => `https://tiktok.com/@${v}`,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.12a4.85 4.85 0 01-1-.43z"/></svg>,
    },
    { key: 'facebook', label: 'Facebook', placeholder: 'page name or URL', value: facebookHandle, set: setFacebookHandle, color: '#1877F2',
      getUrl: v => `https://facebook.com/${v}`,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    { key: 'youtube', label: 'YouTube', placeholder: '@channel or handle', value: youtubeHandle, set: setYoutubeHandle, color: '#FF0000',
      getUrl: v => `https://youtube.com/${v.startsWith('@') ? v : '@' + v}`,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    },
    { key: 'website', label: 'Website', placeholder: 'https://yoursite.com', value: websiteUrl, set: setWebsiteUrl, color: '#8DC63F',
      getUrl: v => v.startsWith('http') ? v : `https://${v}`,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    },
  ]

  const hasAnyLink      = SOCIAL_LINKS.some(l => l.value.trim())
  const hasAnyConfirmed = SOCIAL_LINKS.some(l => l.value.trim() && confirmedLinks[l.key])
  const spotsTotal = 10000
  const spotsTaken = 8241
  const spotsLeft  = spotsTotal - spotsTaken
  const barPct     = Math.round((spotsTaken / spotsTotal) * 100)

  return (
    <>
      {/* ── Get Verified Tab ── */}
      {profileTab === 'verified' && (
        <div className={styles.verifiedScroll}>
          <div className={styles.vHero}>
            <span className={styles.vHeroTitle}>0% Commission</span>
            <p className={styles.vHeroSub}>
              indoo.id never takes a cut — no commission on sales, no fee when contact changes hands.
              Get verified and your account is fully live, open for business, and completely yours.
            </p>
          </div>

          <div className={styles.vBenefits}>
            {[
              'Verified badge on your profile',
              'Social media links shown to all buyers',
              'Higher listing on indoo.id',
              'Local buyers message you free — no unlock fee',
              'No commission, ever',
            ].map(b => (
              <div key={b} className={styles.vBenefitRow}>
                <span className={styles.vBenefitCheck}>✓</span>
                <span className={styles.vBenefitText}>{b}</span>
              </div>
            ))}
          </div>

          <div className={styles.vDivider} />

          <div className={styles.vSeats}>
            <div className={styles.vSeatsTop}>
              <span className={styles.vSeatCount}>{spotsLeft.toLocaleString()}</span>
              <span className={styles.vSeatLabel}> founding seats remaining</span>
            </div>
            <div className={styles.vBar}>
              <div className={styles.vBarFill} style={{ width: `${barPct}%` }} />
            </div>
            <p className={styles.vSeatSub}>Window closing fast — {spotsTaken.toLocaleString()} of {spotsTotal.toLocaleString()} seats filled</p>
          </div>

          <div className={styles.vPrice}>
            <span className={styles.vPriceAmount}>{pricing.display}</span>
            <span className={styles.vPricePer}>/mo</span>
            <span className={styles.vPriceTag}>Full premium · Price locked 3 years</span>
          </div>

          <div className={styles.vDivider} />

          <div className={styles.vSocialSection}>
            <p className={styles.vSocialTitle}>Your Social Links</p>
            <p className={styles.vSocialHint}>Add one or all — edit and update any time. Tap Confirm to verify each link works.</p>
            <div className={styles.vSocialList}>
              {SOCIAL_LINKS.map(({ key, label, placeholder, value, set, color, getUrl, icon }) => (
                <div key={key} className={styles.vSocialRow}>
                  <div className={styles.vSocialIcon} style={{ background: color }}>{icon}</div>
                  <div className={styles.vSocialInputWrap}>
                    <span className={styles.vSocialName}>{label}</span>
                    <input
                      className={styles.vSocialInput}
                      value={value}
                      onChange={e => { set(e.target.value); setConfirmedLinks(p => ({ ...p, [key]: false })) }}
                      placeholder={placeholder}
                      maxLength={100}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>
                  {value.trim() && (
                    <button
                      className={`${styles.vConfirmBtn} ${confirmedLinks[key] ? styles.vConfirmBtnDone : ''}`}
                      type="button"
                      onClick={() => {
                        window.open(getUrl(value.trim()), '_blank', 'noopener')
                        setConfirmedLinks(p => ({ ...p, [key]: true }))
                      }}
                    >
                      {confirmedLinks[key] ? '✓' : 'Confirm'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.vDivider} />

          <div className={styles.vActions}>
            {hasAnyConfirmed ? (
              <button
                className={styles.vGetVerifiedBtn}
                onClick={() => {
                  showToast('Payment coming soon — we\'ll notify you when it\'s live.')
                  if (onboarding) setTimeout(() => onClose?.(), 1800)
                }}
              >
                Get Verified — {pricing.display}/mo
              </button>
            ) : hasAnyLink ? (
              <button className={styles.vGetVerifiedBtnWaiting} disabled>
                Confirm a link above to continue
              </button>
            ) : (
              <button className={styles.vGetVerifiedBtnWaiting} disabled>
                Add a social link above to get verified
              </button>
            )}
            <button
              className={styles.vPassBtn}
              onClick={() => {
                if (onboarding) { onClose?.() }
                else { setProfileTab('profile'); showToast('No problem — your basic profile is live.') }
              }}
            >
              {onboarding ? 'Continue to App →' : 'Pass Offer — Stay on Basic'}
            </button>
            <p className={styles.vFootnote}>No commission · No price increases · Cancel any time</p>
          </div>

          {/* ── Driver's licence upload ── */}
          <div className={styles.vDivider} />
          <div className={styles.licenseSection}>
            <div className={styles.licenseTitleRow}>
              <span className={styles.licenseTitleIcon}>🪪</span>
              <div>
                <div className={styles.licenseTitle}>Driver's Licence Verification</div>
                <div className={styles.licenseSub}>Upload your licence to unlock driver features and display a verified badge.</div>
              </div>
            </div>

            {licenseStatus === 'approved' && (
              <div className={styles.licenseStatusBadge} style={{ background: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.3)', color: '#4ADE80' }}>
                ✅ Verified — Licence approved
              </div>
            )}
            {licenseStatus === 'pending' && (
              <div className={styles.licenseStatusBadge} style={{ background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)', color: '#FBBF24' }}>
                ⏳ Under review — we'll notify you within 24h
              </div>
            )}
            {licenseStatus === 'rejected' && (
              <div className={styles.licenseStatusBadge} style={{ background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.3)', color: '#F87171' }}>
                ❌ Rejected — please re-upload a clear photo
              </div>
            )}

            {licenseStatus !== 'approved' && (
              <label className={styles.licenseUploadBtn}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleLicenseUpload}
                  disabled={licenseUploading}
                />
                {licenseUploading
                  ? '⏳ Uploading…'
                  : licenseFile
                  ? `📄 ${licenseFile.name} — tap to re-upload`
                  : '📷 Upload Licence Photo or PDF'
                }
              </label>
            )}
            <p className={styles.licenseNote}>
              Your licence is stored securely and only reviewed by Indoo staff. It is never shared with other users.
            </p>
          </div>

          {/* ── Identity verification ── */}
          <div className={styles.vDivider} />
          <div className={styles.licenseSection}>
            <div className={styles.licenseTitleRow}>
              <span className={styles.licenseTitleIcon}>🪪</span>
              <div>
                <div className={styles.licenseTitle}>Identity Verification</div>
                <div className={styles.licenseSub}>
                  Upload a government-issued ID (passport, national ID, or driving licence). Once approved by our team a ⭐ badge will appear before your name on your dating profile.
                </div>
              </div>
            </div>

            {idStatus === 'approved' && (
              <div className={styles.licenseStatusBadge} style={{ background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.35)', color: '#FBBF24' }}>
                ⭐ Verified — ID approved · badge is live on your profile
              </div>
            )}
            {idStatus === 'pending' && (
              <div className={styles.licenseStatusBadge} style={{ background: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.25)', color: '#FBBF24' }}>
                ⏳ Under review — we'll notify you within 24 hours
              </div>
            )}
            {idStatus === 'rejected' && (
              <div className={styles.licenseStatusBadge} style={{ background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.3)', color: '#F87171' }}>
                ❌ Rejected — please re-upload a clear, legible photo
              </div>
            )}

            {idStatus !== 'approved' && (
              <label className={styles.licenseUploadBtn}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleIdUpload}
                  disabled={idUploading}
                />
                {idUploading
                  ? '⏳ Uploading…'
                  : idFile
                  ? `📄 ${idFile.name} — tap to re-upload`
                  : '📷 Upload Passport / National ID'
                }
              </label>
            )}
            <p className={styles.licenseNote}>
              Your document is stored securely and only reviewed by Indoo staff. It is never visible to other users.
            </p>
          </div>
        </div>
      )}

      {/* ── Account Drawer — portal ── */}
      {drawerOpen && createPortal(
        <div className={styles.drawerOverlay}>
          <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)} />
          <div className={styles.drawerPanel}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderUser}>
                <div className={styles.drawerAvatar}>
                  {userProfile?.photoURL
                    ? <img src={userProfile.photoURL} alt="" className={styles.drawerAvatarImg} />
                    : <span className={styles.drawerAvatarInitial}>{(userProfile?.displayName ?? 'Y')[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div className={styles.drawerName}>{userProfile?.displayName ?? 'You'}</div>
                  <div className={styles.drawerEmail}>{user?.email ?? ''}</div>
                </div>
              </div>
              <button className={styles.drawerCloseBtn} onClick={() => setDrawerOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.drawerContent}>
              <button className={styles.drawerRow} onClick={handleNotifToggle}>
                <span className={styles.drawerRowIcon}>🔔</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Push Notifications</span>
                  <span className={styles.drawerRowSub}>{notifOn ? 'On — tap to disable' : 'Off — tap to enable'}</span>
                </div>
                <div className={`${styles.drawerToggle} ${notifOn ? styles.drawerToggleOn : ''}`}>
                  <div className={styles.drawerToggleThumb} />
                </div>
              </button>

              <button className={styles.drawerRow} onClick={() => setToast({ message: 'Privacy controls coming soon.', type: 'error' })}>
                <span className={styles.drawerRowIcon}>🔒</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Privacy Controls</span>
                  <span className={styles.drawerRowSub}>Manage what others can see</span>
                </div>
                <svg className={styles.drawerRowArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button className={styles.drawerRow} onClick={() => setToast({ message: 'Block list coming soon.', type: 'error' })}>
                <span className={styles.drawerRowIcon}>🚫</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Blocked Users</span>
                  <span className={styles.drawerRowSub}>Manage people you've blocked</span>
                </div>
                <svg className={styles.drawerRowArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button className={styles.drawerRow} onClick={() => setToast({ message: 'Always meet in a public place. Trust your instincts.', type: 'error' })}>
                <span className={styles.drawerRowIcon}>🛡️</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>Safety Centre</span>
                  <span className={styles.drawerRowSub}>Tips for staying safe while out</span>
                </div>
                <svg className={styles.drawerRowArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button className={styles.drawerRow} onClick={() => setToast({ message: "Indoo v0.1.0 — who's hanging near you?", type: 'error' })}>
                <span className={styles.drawerRowIcon}>ℹ️</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>About Indoo</span>
                  <span className={styles.drawerRowSub}>Version 0.1.0</span>
                </div>
              </button>

              <button
                className={styles.drawerRow}
                onClick={async () => {
                  setExportingData(true)
                  try { await exportMyData(user?.id) }
                  catch { setToast({ message: 'Export failed — try again', type: 'error' }) }
                  finally { setExportingData(false) }
                }}
                disabled={exportingData}
              >
                <span className={styles.drawerRowIcon}>📥</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>{exportingData ? 'Preparing download…' : 'Download My Data'}</span>
                  <span className={styles.drawerRowSub}>GDPR export — all your data as JSON</span>
                </div>
              </button>

              {user?.email && (
                <button
                  className={styles.drawerRow}
                  onClick={async () => {
                    try {
                      await sendPasswordReset(user.email)
                      setResetPwStep('sent')
                      setTimeout(() => setResetPwStep(null), 6000)
                    } catch (e) {
                      setToast({ message: e.message, type: 'error' })
                    }
                  }}
                >
                  <span className={styles.drawerRowIcon}>🔑</span>
                  <div className={styles.drawerRowText}>
                    <span className={styles.drawerRowLabel}>
                      {resetPwStep === 'sent' ? '✅ Reset link sent!' : 'Reset Password'}
                    </span>
                    <span className={styles.drawerRowSub}>
                      {resetPwStep === 'sent' ? `Check ${user.email}` : 'Send a reset link to your email'}
                    </span>
                  </div>
                </button>
              )}

              <div className={styles.drawerDivider} />
              <button className={`${styles.drawerRow} ${styles.drawerRowDanger}`} onClick={handleDrawerSignOut} disabled={drawerSigningOut}>
                <span className={styles.drawerRowIcon}>🚪</span>
                <div className={styles.drawerRowText}>
                  <span className={styles.drawerRowLabel}>{drawerSigningOut ? 'Signing out…' : 'Sign Out'}</span>
                  <span className={styles.drawerRowSub}>Your listing drops from the map instantly</span>
                </div>
              </button>

              <div className={styles.drawerDivider} />
              {deleteStep === null && (
                <button className={`${styles.drawerRow} ${styles.drawerRowDanger}`} onClick={() => setDeleteStep('confirm')}>
                  <span className={styles.drawerRowIcon}>🗑️</span>
                  <div className={styles.drawerRowText}>
                    <span className={styles.drawerRowLabel}>Delete Account</span>
                    <span className={styles.drawerRowSub}>Permanently remove all your data</span>
                  </div>
                </button>
              )}
              {deleteStep === 'confirm' && (
                <div className={styles.drawerDeleteConfirm}>
                  <p className={styles.drawerDeleteWarning}>
                    ⚠️ This permanently deletes your profile, photos, and all data. This cannot be undone.
                  </p>
                  <div className={styles.drawerDeleteBtns}>
                    <button className={styles.drawerDeleteCancel} onClick={() => setDeleteStep(null)}>Cancel</button>
                    <button
                      className={styles.drawerDeleteConfirmBtn}
                      onClick={async () => {
                        setDeleteStep('deleting')
                        try {
                          await deleteAccount(user?.id)
                          await signOut()
                        } catch (e) {
                          setDeleteStep(null)
                          setToast({ message: e.message, type: 'error' })
                        }
                      }}
                    >
                      Yes, delete everything
                    </button>
                  </div>
                </div>
              )}
              {deleteStep === 'deleting' && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowIcon}>⏳</span>
                  <div className={styles.drawerRowText}>
                    <span className={styles.drawerRowLabel}>Deleting your account…</span>
                    <span className={styles.drawerRowSub}>Please wait</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Driver: incoming booking modal ── */}
      {incomingBooking && !activeTrip && (
        <DriverIncomingBooking
          booking={incomingBooking}
          driverId={driverId}
          onAccepted={(booking) => { setIncomingBooking(null); setActiveTrip(booking) }}
          onDeclined={() => setIncomingBooking(null)}
        />
      )}

      {/* ── Driver: active trip screen ── */}
      {activeTrip && (
        <DriverTripScreen
          booking={activeTrip}
          driverId={driverId}
          onCompleted={() => setActiveTrip(null)}
          onClose={() => setActiveTrip(null)}
        />
      )}

      {/* ── Driver: earnings screen ── */}
      {earningsOpen && (
        <DriverEarningsScreen
          driverId={driverId}
          profile={userProfile}
          onClose={() => setEarningsOpen(false)}
        />
      )}

      {/* ── Restaurant dashboard ── */}
      {restaurantDashOpen && (
        <RestaurantDashboard
          userId={driverId}
          onClose={() => setRestaurantDashOpen(false)}
        />
      )}
    </>
  )
}
