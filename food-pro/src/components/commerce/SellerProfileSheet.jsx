import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getBuyerUnlockStatus } from '@/services/unlockService'
import { fetchProducts, DEMO_PRODUCTS } from '@/services/commerceService'
import ProductCatalogSlider from './ProductCatalogSlider'
import UnlockGate from '@/components/chat/UnlockGate'
import GiftOrderSheet from '@/components/gifting/GiftOrderSheet'
import styles from './SellerProfileSheet.module.css'

function ContactIcon({ type, color }) {
  const s = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2.2', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'whatsapp')  return <svg {...s}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  if (type === 'instagram')  return <svg {...s}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill={color}/></svg>
  if (type === 'tiktok')     return <svg {...s}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
  if (type === 'facebook')   return <svg {...s}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  if (type === 'website')    return <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  return null
}

export default function SellerProfileSheet({ seller, onClose, onOpenChat, onOrderViaChat, onMakeOffer, giftFor = null, wishlistMode = false, onWishlistAdd = null, showToast }) {
  const { user } = useAuth()
  const userId = user?.uid ?? user?.id ?? null

  const [products,       setProducts]       = useState(DEMO_PRODUCTS.slice(0, 9))
  const [catalogOpen,    setCatalogOpen]    = useState(wishlistMode) // auto-open in wishlist mode
  const [hoursOpen,      setHoursOpen]      = useState(false)
  const [contactOpen,    setContactOpen]    = useState(false)
  const [buyerUnlocked,  setBuyerUnlocked]  = useState(false)
  const [unlockGateOpen, setUnlockGateOpen] = useState(false)
  const [giftProduct,    setGiftProduct]    = useState(null) // product chosen for gifting

  useEffect(() => {
    if (!userId) return
    getBuyerUnlockStatus(userId).then(s => setBuyerUnlocked(s.active))
  }, [userId])

  useEffect(() => {
    if (!seller?.id || seller.id.startsWith('d')) return
    fetchProducts(seller.id).then(p => setProducts(p))
  }, [seller?.id])

  if (!seller) return null

  // WhatsApp only available if seller has paid monthly plan
  const sellerSubscribed = ['standard', 'premium'].includes(seller.seller_plan ?? seller.sellerPlan)
  const waLink = (sellerSubscribed && seller.bizWhatsapp)
    ? `https://wa.me/${seller.bizWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I found your store on Indoo!')}`
    : null

  // All social links the seller has added
  const socialLinks = [
    waLink        && { key: 'whatsapp',  label: 'WhatsApp',  sub: seller.bizWhatsapp,                          href: waLink,                                    color: '#25D366', icon: 'wa'  },
    seller.instagram && { key: 'instagram', label: 'Instagram', sub: `@${seller.instagram}`,                     href: `https://instagram.com/${seller.instagram}`,  color: '#E4405F', icon: 'ig'  },
    seller.tiktok    && { key: 'tiktok',    label: 'TikTok',    sub: `@${seller.tiktok}`,                         href: `https://tiktok.com/@${seller.tiktok}`,       color: '#fff',    icon: 'tt'  },
    seller.facebook  && { key: 'facebook',  label: 'Facebook',  sub: seller.facebook,                             href: `https://facebook.com/${seller.facebook}`,    color: '#1877F2', icon: 'fb'  },
    seller.website   && { key: 'website',   label: 'Website',   sub: seller.website.replace(/^https?:\/\//, ''),  href: seller.website,                              color: '#8DC63F', icon: 'web' },
  ].filter(Boolean)

  const openTime  = seller.openTime  ?? '9:00 AM'
  const closeTime = seller.closeTime ?? '6:00 PM'

  return (
    <div className={styles.page}>

      {/* Full-height background image */}
      {seller.photoURL
        ? <img src={seller.photoURL} alt="" className={styles.bgImg} />
        : <div className={styles.bgFallback}>
            <span className={styles.bgInitial}>{(seller.brandName ?? seller.displayName)[0]}</span>
          </div>
      }
      <div className={styles.bgGrad} />

      {/* Top bar — logo left, back button right */}
      <div className={styles.topBar}>
        <div className={styles.indooLogoWrap}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752"
            alt="Indoo Market"
            className={styles.indooLogoImg}
          />
        </div>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
      </div>


      {/* Opening hours card (toggled by clock button) */}
      {hoursOpen && (
        <div className={styles.hoursCard}>
          <span className={styles.hoursTitle}>Opening Hours</span>
          <span className={styles.hoursTime}>{openTime} — {closeTime}</span>
        </div>
      )}

      {/* Floating right side panel */}
      <div className={styles.sidePanel}>
        {/* Catalogue round button */}
        <button className={styles.sidePanelBtn} onClick={() => setCatalogOpen(true)} aria-label="View products">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </button>

        {/* Opening hours toggle */}
        <button
          className={[styles.sidePanelBtn, hoursOpen ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={() => setHoursOpen(v => !v)}
          aria-label="Opening hours"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>

        {/* Reviews — star */}
        <button className={styles.sidePanelBtn} onClick={() => {}} aria-label="Reviews" title="Reviews">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>

        {/* Safe Trade — shield */}
        <button className={styles.sidePanelBtn} onClick={() => {}} aria-label="Safe Trade" title="Safe Trade">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </button>

        {/* Video — play */}
        <button className={styles.sidePanelBtn} onClick={() => {}} aria-label="Video" title="Video">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
      </div>

      {/* Bottom overlay — brand name + chips + bio + contact btn */}
      <div className={styles.bottomOverlay}>
        <div className={styles.brandName}>{seller.brandName || seller.displayName}</div>
        {seller.brandName && seller.displayName !== seller.brandName && (
          <div className={styles.ownerName}>by {seller.displayName}</div>
        )}
        {seller.city && (
          <p className={styles.locationText}>
            📍 {seller.city}{seller.country ? `, ${seller.country}` : ''}
          </p>
        )}
        {seller.bio && (
          <p className={styles.bio}>{seller.bio.slice(0, 350)}</p>
        )}

        {/* Action row — Chat + Contact */}
        <div className={styles.actionRow}>
          {(onOpenChat || onOrderViaChat) && (
            <button
              className={styles.chatBtn}
              onClick={() => (onOpenChat ?? onOrderViaChat)?.({ seller, type: 'seller' })}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat with Seller
            </button>
          )}
          <button className={styles.contactRowBtn} onClick={() => setContactOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Socials
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto'}}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Contact slide-up sheet */}
      {contactOpen && (
        <div className={styles.contactBackdrop} onClick={() => setContactOpen(false)}>
          <div className={styles.contactSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.contactHandle} />
            <div className={styles.contactTitle}>{seller.brandName || seller.displayName}</div>

            {buyerUnlocked ? (
              /* ── Buyer already paid — show everything immediately ── */
              <>
                <div className={styles.contactSub}>Your 30-day access is active</div>
                <div className={styles.contactList}>
                  {socialLinks.length === 0 && (
                    <p className={styles.contactEmpty}>This seller hasn't added contact details yet.</p>
                  )}
                  {socialLinks.map(link => (
                    <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer"
                      className={link.key === 'whatsapp' ? styles.contactItemWa : styles.contactItem}>
                      <span className={styles.contactIcon}
                        style={{ background: `${link.color}18`, border: `1px solid ${link.color}44` }}>
                        <ContactIcon type={link.key} color={link.color} />
                      </span>
                      <span className={styles.contactItemText}>
                        <span className={styles.contactItemLabel}
                          style={link.key === 'whatsapp' ? { color: '#000' } : undefined}>
                          {link.label}
                        </span>
                        <span className={styles.contactItemSub}
                          style={link.key === 'whatsapp' ? { color: 'rgba(0,0,0,0.55)' } : undefined}>
                          {link.sub}
                        </span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke={link.key === 'whatsapp' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)'}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              /* ── Buyer not unlocked — show choices + locked preview ── */
              <>
                <div className={styles.contactSub}>Chat free for 20 min, or unlock all contacts for 30 days</div>

                {/* Two action buttons */}
                <div className={styles.contactChoices}>
                  <button className={styles.choiceChat} onClick={() => {
                    setContactOpen(false)
                    onOpenChat?.(seller)
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>
                      <strong>Free Chat</strong>
                      <span>20 min free</span>
                    </span>
                  </button>

                  <button className={styles.choiceUnlock} onClick={() => {
                    setContactOpen(false)
                    setUnlockGateOpen(true)
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>
                      <strong>Unlock Contacts</strong>
                      <span>All sellers · 30 days · $1.99</span>
                    </span>
                  </button>
                </div>

                {/* Locked preview of social links */}
                {socialLinks.length > 0 && (
                  <div className={styles.lockedPreview}>
                    {socialLinks.map(link => (
                      <div key={link.key} className={styles.lockedRow}>
                        <span className={styles.lockedIcon}>🔒</span>
                        <span className={styles.lockedLabel}>{link.label}</span>
                        <span className={styles.lockedBlur}>{'●'.repeat(10)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!sellerSubscribed && (
                  <p className={styles.contactEmpty}>
                    WhatsApp available when seller upgrades to a monthly plan.
                  </p>
                )}
              </>
            )}

            <button className={styles.contactDismiss} onClick={() => setContactOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Unlock gate — opened from contact sheet */}
      {unlockGateOpen && (
        <UnlockGate
          isBuyer
          unlockBalance={0}
          onUnlockWithCredit={() => { setBuyerUnlocked(true); setUnlockGateOpen(false); setContactOpen(true) }}
          onUnlockWithPlan={() => { setBuyerUnlocked(true); setUnlockGateOpen(false); setContactOpen(true) }}
          onDismiss={() => setUnlockGateOpen(false)}
          expired={false}
          theme="market"
        />
      )}

      {/* Product catalog slider */}
      <ProductCatalogSlider
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        products={products}
        sellerWa={seller.bizWhatsapp}
        sellerName={seller.brandName || seller.displayName}
        onWishlistAdd={wishlistMode ? (p) => { setCatalogOpen(false); onWishlistAdd?.(p) } : null}
        onGiftSelect={giftFor && !wishlistMode ? (p) => { setCatalogOpen(false); setGiftProduct(p) } : null}
        giftRecipientName={giftFor?.displayName ?? null}
        onMakeOffer={onMakeOffer}
        seller={seller}
      />

      <GiftOrderSheet
        open={!!giftProduct && !!giftFor}
        product={giftProduct}
        seller={seller}
        giftFor={giftFor}
        onClose={() => setGiftProduct(null)}
        showToast={showToast}
      />
    </div>
  )
}
