import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { startCheckout } from '@/services/checkoutService'
import styles from './UpgradeSheet.module.css'

/* ─────────────────────────────────────────
   SOCIAL packages (dating, friends, etc.)
───────────────────────────────────────── */
const SOCIAL_PACKAGES = [
  {
    id: 'boost',
    name: 'Boost',
    price: '$2.99',
    period: '/month',
    tagline: 'Stand out on the map',
    badge: null,
    features: [
      'Your photo shown on the map',
      'Larger profile circle',
      'More visible to nearby users',
    ],
    cta: 'Get Boost',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$6.99',
    period: '/month',
    tagline: 'Everything you need',
    badge: 'MOST POPULAR',
    features: [
      'Everything in Boost',
      'See who liked your profile',
      'Unlimited connect requests',
      'Priority in discovery list',
      'Pro badge on profile',
    ],
    cta: 'Get Pro',
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '$12.99',
    period: '/month',
    tagline: 'The full experience',
    badge: null,
    features: [
      'Everything in Pro',
      'Crown icon on map — always noticed',
      'Featured at top of discovery',
      'Verified badge on profile',
      'Early access to new features',
    ],
    cta: 'Get VIP',
  },
]

const SOCIAL_LIFETIME = {
  price: '$49.99',
  label: 'Lifetime Boost',
  sub: 'One-time payment — photo on map forever',
}

/* ─────────────────────────────────────────
   MAKER packages (handmade, craft, etc.)
───────────────────────────────────────── */
const MAKER_UNLOCK_PACKS = [
  { id: 'pack3',  label: '3 Contact Unlocks',  price: '£3.99', each: '£1.33', saves: null },
  { id: 'pack8',  label: '8 Contact Unlocks',  price: '£7.99', each: '£1.00', saves: 'Save 25%' },
]

const MAKER_SUBSCRIPTIONS = [
  {
    id: 'social',
    name: 'Listing',
    price: '£1.50',
    period: '/month',
    tagline: 'Be listed and contactable',
    badge: null,
    features: [
      '📍 Listed on the map — buyers can find you',
      '🤝 Local buyers contact you for free',
      '📲 Social Media page on your profile',
      '✅ Verified badge on your listing',
      'Instagram, TikTok, Facebook, YouTube & Website',
    ],
    cta: 'Activate Listing',
    highlight: '🤝 Local buyers contact you free',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '£4.99',
    period: '/month',
    tagline: 'Get noticed and sell more',
    badge: 'MOST POPULAR',
    features: [
      'Everything in Listing',
      '📸 Profile photo shown on the map',
      'Brand name + price range on listing',
      'Unlimited contact unlocks',
      'Priority in local discovery',
    ],
    cta: 'Get Premium',
    highlight: '📸 Photo on map included',
  },
  {
    id: 'business',
    name: 'Business',
    price: '£9.99',
    period: '/month',
    tagline: 'Sell locally and internationally',
    badge: null,
    features: [
      'Everything in Premium',
      '🌍 Listed in International Export directory',
      'Verified Exporter badge on profile',
      'Priority placement globally',
      'Featured in international buyer search',
    ],
    cta: 'Get Business',
    highlight: '🌍 International directory included',
  },
]

const MAKER_CATEGORIES = ['handmade', 'craft_supplies', 'property', 'professional']

export default function UpgradeSheet({ open, onClose, showToast, lookingFor, onClaimSpot }) {
  const { user } = useAuth()
  const isMaker = MAKER_CATEGORIES.includes(lookingFor)
  const [makerView, setMakerView]       = useState('subscribe')
  const [selectedSub, setSelectedSub]   = useState('social')
  const [selectedPack, setSelectedPack] = useState('pack8')
  const [selectedSocial, setSelectedSocial] = useState('pro')
  const [paying, setPaying] = useState(false)

  if (!open) return null

  async function handlePay(priceKey, mode = 'subscription') {
    if (paying) return
    setPaying(true)
    try {
      await startCheckout(priceKey, mode, user?.id)
      // startCheckout redirects the browser — if we reach here something failed
    } catch (err) {
      showToast?.(err.message ?? 'Payment unavailable — try again')
      setPaying(false)
    }
  }

  /* ── MAKER SHEET ── */
  if (isMaker) {
    const sub  = MAKER_SUBSCRIPTIONS.find(s => s.id === selectedSub)
    const pack = MAKER_UNLOCK_PACKS.find(p => p.id === selectedPack)

    return (
      <div className={styles.overlay}>
        <div className={styles.backdrop} onClick={onClose} />
        <div className={styles.sheet} style={{ borderTopColor: '#8DC63F' }}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div className={styles.header}>
            <h2 className={styles.title}>Upgrade Your Profile</h2>
            <p className={styles.subtitle}>Get seen on the map and connect with more buyers</p>
          </div>

          {/* View toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${makerView === 'subscribe' ? styles.toggleBtnActive : ''}`}
              onClick={() => setMakerView('subscribe')}
            >
              Monthly Plans
            </button>
            <button
              className={`${styles.toggleBtn} ${makerView === 'unlocks' ? styles.toggleBtnActive : ''}`}
              onClick={() => setMakerView('unlocks')}
            >
              Contact Unlocks
            </button>
          </div>

          {/* ── SUBSCRIPTION VIEW ── */}
          {makerView === 'subscribe' && (
            <>
              <div className={styles.tabs}>
                {MAKER_SUBSCRIPTIONS.map(s => (
                  <button
                    key={s.id}
                    className={`${styles.tab} ${selectedSub === s.id ? styles.tabActive : ''}`}
                    style={selectedSub === s.id ? { borderColor: '#F5C518', background: 'rgba(245,197,24,0.08)' } : {}}
                    onClick={() => setSelectedSub(s.id)}
                  >
                    {s.badge && <span className={styles.tabBadge} style={{ background: '#F5C518', color: '#000' }}>{s.badge}</span>}
                    <span className={styles.tabName} style={selectedSub === s.id ? { color: '#F5C518' } : {}}>{s.name}</span>
                    <span className={styles.tabPrice} style={selectedSub === s.id ? { color: '#F5C518' } : {}}>{s.price}</span>
                  </button>
                ))}
              </div>

              <div className={styles.highlightBanner} style={{ borderColor: '#F5C518' }}>
                {sub.highlight}
              </div>

              <div className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardName}>{sub.name}</div>
                    <div className={styles.cardTagline}>{sub.tagline}</div>
                  </div>
                  <div className={styles.cardPricing}>
                    <span className={styles.cardPrice} style={{ color: '#F5C518' }}>{sub.price}</span>
                    <span className={styles.cardPeriod}>{sub.period}</span>
                  </div>
                </div>
                <ul className={styles.features}>
                  {sub.features.map((f, i) => (
                    <li key={i} className={styles.feature}>
                      <span className={styles.featureTick} style={{ color: '#F5C518' }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={styles.ctaBtn}
                style={{ background: '#F5C518', color: '#000' }}
                onClick={() => handlePay(`maker_${sub.id}`, 'subscription')}
                disabled={paying}
              >
                {paying ? 'Redirecting to checkout…' : `${sub.cta} — ${sub.price}${sub.period}`}
              </button>
              <p className={styles.ctaSub}>Renews monthly · Cancel anytime</p>

              <div className={styles.unlockNote}>
                <span>Only need a few contact unlocks?</span>
                <button className={styles.unlockNoteBtn} onClick={() => setMakerView('unlocks')}>
                  Buy unlock pack →
                </button>
              </div>
            </>
          )}

          {/* ── UNLOCK PACKS VIEW ── */}
          {makerView === 'unlocks' && (
            <>
              <p className={styles.unlockIntro}>
                Unlock buyer contacts one at a time. No subscription needed.
              </p>

              <div className={styles.packList}>
                {MAKER_UNLOCK_PACKS.map(p => (
                  <button
                    key={p.id}
                    className={`${styles.packCard} ${selectedPack === p.id ? styles.packCardActive : ''}`}
                    style={selectedPack === p.id ? { borderColor: '#F5C518' } : {}}
                    onClick={() => setSelectedPack(p.id)}
                  >
                    <div className={styles.packInfo}>
                      <span className={styles.packLabel}>{p.label}</span>
                      <span className={styles.packEach}>{p.each} per unlock</span>
                    </div>
                    <div className={styles.packRight}>
                      {p.saves && <span className={styles.packSave} style={{ color: '#F5C518' }}>{p.saves}</span>}
                      <span className={styles.packPrice}>{p.price}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                className={styles.ctaBtn}
                style={{ background: '#F5C518', color: '#000' }}
                onClick={() => handlePay(`maker_${pack.id}`, 'payment')}
                disabled={paying}
              >
                {paying ? 'Redirecting to checkout…' : `Buy ${pack.label} — ${pack.price}`}
              </button>
              <p className={styles.ctaSub}>Expires in 30 days · No subscription</p>

              <div className={styles.unlockNote}>
                <span>Getting lots of messages?</span>
                <button className={styles.unlockNoteBtn} onClick={() => setMakerView('subscribe')}>
                  View monthly plans →
                </button>
              </div>
            </>
          )}

          <button className={styles.spotBanner} onClick={() => { onClose(); onClaimSpot?.() }}>
            <span className={styles.spotBannerIcon}>📍</span>
            <div className={styles.spotBannerBody}>
              <p className={styles.spotBannerTitle}>Own your map spot</p>
              <p className={styles.spotBannerSub}>Claim your postcode — first come, first served</p>
            </div>
            <span className={styles.spotBannerPrice}>$1.99/mo · $19.99/yr</span>
          </button>

        </div>
      </div>
    )
  }

  /* ── SOCIAL SHEET ── */
  const pkg = SOCIAL_PACKAGES.find(p => p.id === selectedSocial)

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet} style={{ borderTopColor: '#8DC63F' }}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>Upgrade Your Profile</h2>
          <p className={styles.subtitle}>Show your photo on the map and get noticed by people nearby</p>
        </div>

        <div className={styles.tabs}>
          {SOCIAL_PACKAGES.map(p => (
            <button
              key={p.id}
              className={`${styles.tab} ${selectedSocial === p.id ? styles.tabActive : ''}`}
              onClick={() => setSelectedSocial(p.id)}
            >
              {p.badge && <span className={styles.tabBadge}>{p.badge}</span>}
              <span className={styles.tabName}>{p.name}</span>
              <span className={styles.tabPrice}>{p.price}</span>
            </button>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.cardName}>{pkg.name}</div>
              <div className={styles.cardTagline}>{pkg.tagline}</div>
            </div>
            <div className={styles.cardPricing}>
              <span className={styles.cardPrice}>{pkg.price}</span>
              <span className={styles.cardPeriod}>{pkg.period}</span>
            </div>
          </div>
          <ul className={styles.features}>
            {pkg.features.map((f, i) => (
              <li key={i} className={styles.feature}>
                <span className={styles.featureTick}>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <button className={styles.ctaBtn} onClick={() => handlePay(`social_${pkg.id}`, 'subscription')} disabled={paying}>
          {paying ? 'Redirecting to checkout…' : `${pkg.cta} — ${pkg.price}${pkg.period}`}
        </button>
        <p className={styles.ctaSub}>Cancel anytime. No commitment.</p>

        <button className={styles.lifetimeBtn} onClick={() => handlePay('social_lifetime', 'payment')} disabled={paying}>
          <div className={styles.lifetimeLeft}>
            <span className={styles.lifetimeName}>{SOCIAL_LIFETIME.label}</span>
            <span className={styles.lifetimeSub}>{SOCIAL_LIFETIME.sub}</span>
          </div>
          <span className={styles.lifetimePrice}>{SOCIAL_LIFETIME.price}</span>
        </button>

        <button className={styles.spotBanner} onClick={() => { onClose(); onClaimSpot?.() }}>
          <span className={styles.spotBannerIcon}>📍</span>
          <div className={styles.spotBannerBody}>
            <p className={styles.spotBannerTitle}>Own your map spot</p>
            <p className={styles.spotBannerSub}>Claim your postcode — first come, first served</p>
          </div>
          <span className={styles.spotBannerPrice}>$1.99/mo · $19.99/yr</span>
        </button>

      </div>
    </div>
  )
}
