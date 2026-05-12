import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { purchaseUnlockPack, purchaseSubscription, UNLOCK_PACK, PLAN_PRICES } from '@/services/unlockService'
import styles from './UnlockGate.module.css'

/**
 * UnlockGate
 * Full-screen modal shown when free chat time runs out (or ≤5 min left).
 *
 * Props:
 *   unlockBalance       — current credits (0 = must buy)
 *   onUnlockWithCredit  — callback: consume 1 credit
 *   onUnlockWithPlan    — callback(plan): upgrade completed
 *   onDismiss           — close without unlocking
 *   expired             — true = time ran out, false = warning at 5 min
 */
export default function UnlockGate({
  unlockBalance = 0,
  isBuyer = false,
  onUnlockWithCredit,
  onUnlockWithPlan,
  onDismiss,
  expired = false,
  theme = null,
}) {
  const { user } = useAuth()
  const userId = user?.uid ?? user?.id
  const [loading, setLoading] = useState(null) // 'credits' | 'standard' | 'premium'
  const [tab, setTab] = useState('unlock') // 'unlock' | 'subscribe'

  async function handleBuyCredits() {
    setLoading('credits')
    await purchaseUnlockPack(userId, () => {
      onUnlockWithCredit?.()
    })
    setLoading(null)
  }

  async function handleSubscribe(plan) {
    setLoading(plan)
    await purchaseSubscription(userId, plan, () => {
      onUnlockWithPlan?.(plan)
    })
    setLoading(null)
  }

  const isMarket = theme === 'market'
  const isDating = theme === 'dating'
  const buyerMode = isBuyer || isMarket

  // ── Dating-specific unlock gate ─────────────────────────────────────────────
  if (isDating) {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.sheet} ${styles.sheetDating}`}>
          {!expired && (
            <button className={styles.closeBtn} onClick={onDismiss} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <div className={`${styles.iconWrap} ${styles.iconWrapDating}`}>
            <span className={styles.icon}>{expired ? '💕' : '⏳'}</span>
          </div>
          <h2 className={styles.title}>
            {expired ? 'Keep Chatting' : '5 Minutes Left'}
          </h2>
          <p className={styles.sub}>
            {expired
              ? 'Your free chat window is up — unlock to keep the conversation going.'
              : 'Your free 20-min chat is almost up. Unlock now to keep connecting.'
            }
          </p>

          {/* Tab switcher */}
          <div className={styles.tabs}>
            <button className={[styles.tab, tab === 'unlock' ? styles.tabActiveDating : ''].join(' ')} onClick={() => setTab('unlock')}>One-Time</button>
            <button className={[styles.tab, tab === 'subscribe' ? styles.tabActiveDating : ''].join(' ')} onClick={() => setTab('subscribe')}>Monthly</button>
          </div>

          {/* One-time */}
          {tab === 'unlock' && (
            <div className={styles.optionBlock}>
              {unlockBalance > 0 ? (
                <>
                  <div className={`${styles.creditBadge} ${styles.creditBadgeDating}`}>
                    <span className={styles.creditNum}>{unlockBalance}</span>
                    <span className={styles.creditLabel}>chat pass{unlockBalance !== 1 ? 'es' : ''} available</span>
                  </div>
                  <button className={`${styles.primaryBtn} ${styles.primaryBtnDating}`} onClick={onUnlockWithCredit} disabled={!!loading}>
                    Use 1 Chat Pass
                  </button>
                  <p className={styles.hint}>{unlockBalance - 1} pass{unlockBalance - 1 !== 1 ? 'es' : ''} remaining after this</p>
                </>
              ) : (
                <>
                  <div className={styles.packCard}>
                    <div className={styles.packLeft}>
                      <span className={styles.packEmoji}>💌</span>
                      <div>
                        <div className={styles.packTitle}>2 Chat Passes</div>
                        <div className={styles.packDesc}>Valid for 90 days · Unlimited time per chat</div>
                      </div>
                    </div>
                    <span className={`${styles.packPrice} ${styles.packPriceDating}`}>${UNLOCK_PACK.usd}</span>
                  </div>
                  <button className={`${styles.primaryBtn} ${styles.primaryBtnDating}`} onClick={handleBuyCredits} disabled={!!loading}>
                    {loading === 'credits' ? 'Processing…' : `Get 2 Chat Passes — $${UNLOCK_PACK.usd}`}
                  </button>
                  <p className={styles.hint}>One-time · No subscription · No expiry</p>
                </>
              )}
            </div>
          )}

          {/* Monthly dating plans */}
          {tab === 'subscribe' && (
            <div className={styles.plansBlock}>
              {/* Social */}
              <div className={styles.planCard}>
                <div className={styles.planHeader}>
                  <span className={styles.planName}>Social</span>
                  <span className={`${styles.planPrice} ${styles.planPriceDating}`}>$1.99/mo</span>
                </div>
                <ul className={styles.planFeatures}>
                  <li>✓ Unlimited dating chats</li>
                  <li>✓ 30-day message history</li>
                  <li>✓ Keep all your connections</li>
                </ul>
                <button className={`${styles.planBtn} ${styles.planBtnDating}`} onClick={() => handleSubscribe('standard')} disabled={!!loading}>
                  {loading === 'standard' ? 'Processing…' : 'Subscribe — $1.99/mo'}
                </button>
              </div>
              {/* Connect */}
              <div className={[styles.planCard, styles.planCardDating].join(' ')}>
                <div className={`${styles.planBadge} ${styles.planBadgeDating}`}>BEST VALUE</div>
                <div className={styles.planHeader}>
                  <span className={styles.planName}>Connect</span>
                  <span className={`${styles.planPrice} ${styles.planPriceDating}`}>$3.99/mo</span>
                </div>
                <ul className={styles.planFeatures}>
                  <li>✓ Everything in Social</li>
                  <li>✓ 1× Profile Boost per month</li>
                  <li>✓ 1 free Vibe Blast per week</li>
                  <li>✓ Priority in nearby search</li>
                </ul>
                <button className={`${styles.planBtn} ${styles.planBtnDatingPremium}`} onClick={() => handleSubscribe('premium')} disabled={!!loading}>
                  {loading === 'premium' ? 'Processing…' : 'Subscribe — $3.99/mo'}
                </button>
              </div>
              <p className={styles.hint}>Cancel anytime · Auto-renews monthly</p>
            </div>
          )}

          {tab === 'unlock' && unlockBalance === 0 && (
            <p className={styles.nudge}>
              💡 2 passes = $3.98 · Social monthly = $1.99 · <button className={`${styles.nudgeBtn} ${styles.nudgeBtnDating}`} onClick={() => setTab('subscribe')}>See plans →</button>
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Market / default unlock gate ────────────────────────────────────────────
  return (
    <div className={styles.overlay}>
      <div className={`${styles.sheet} ${isMarket ? styles.sheetMarket : ''}`}>

        {/* Close */}
        {!expired && (
          <button className={styles.closeBtn} onClick={onDismiss} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        {/* Icon */}
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{expired ? '🔒' : '⏳'}</span>
        </div>

        {/* Headline */}
        <h2 className={styles.title}>
          {buyerMode
            ? 'Unlock all sellers'
            : expired ? 'Free chat time ended' : '5 minutes left'
          }
        </h2>
        <p className={styles.sub}>
          {buyerMode
            ? 'Chat freely with any seller, share contacts & view social shop links — 30 days for $1.99.'
            : expired
              ? 'Your 20-minute free window is up. Unlock to keep chatting.'
              : 'Your free 20-min chat is almost up. Unlock now to keep the conversation going.'
          }
        </p>

        {/* Tab switcher — hidden on market (shows all) */}
        {!isMarket && (
          <div className={styles.tabs}>
            <button
              className={[styles.tab, tab === 'unlock' ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab('unlock')}
            >
              One-Time
            </button>
            <button
              className={[styles.tab, tab === 'subscribe' ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab('subscribe')}
            >
              Monthly
            </button>
          </div>
        )}

        {/* ── One-time unlock block ── */}
        {(isMarket || tab === 'unlock') && (
          <div className={styles.optionBlock}>
            {isMarket && <p className={styles.sectionLabel}>🔓 One-Time Unlock</p>}
            {unlockBalance > 0 ? (
              <>
                <div className={styles.creditBadge}>
                  <span className={styles.creditNum}>{unlockBalance}</span>
                  <span className={styles.creditLabel}>unlock{unlockBalance !== 1 ? 's' : ''} available</span>
                </div>
                <button
                  className={`${styles.primaryBtn} ${isMarket ? styles.primaryBtnMarket : ''}`}
                  onClick={onUnlockWithCredit}
                  disabled={!!loading}
                >
                  Use 1 Unlock Credit
                </button>
                <p className={styles.hint}>{unlockBalance - 1} credit{unlockBalance - 1 !== 1 ? 's' : ''} will remain after this</p>
              </>
            ) : (
              <>
                <div className={styles.packCard}>
                  <div className={styles.packLeft}>
                    <span className={styles.packEmoji}>🔓</span>
                    <div>
                      <div className={styles.packTitle}>
                        {buyerMode ? 'All Sellers · 30 Days' : '2 Chat Unlocks'}
                      </div>
                      <div className={styles.packDesc}>
                        {buyerMode
                          ? 'Chat, share contacts & view shop links'
                          : 'Valid for 90 days · Use anytime'}
                      </div>
                    </div>
                  </div>
                  <span className={styles.packPrice}>${UNLOCK_PACK.usd}</span>
                </div>
                <button
                  className={`${styles.primaryBtn} ${isMarket ? styles.primaryBtnMarket : ''}`}
                  onClick={handleBuyCredits}
                  disabled={!!loading}
                >
                  {loading === 'credits'
                    ? 'Processing…'
                    : buyerMode
                      ? `Unlock All Sellers — $${UNLOCK_PACK.usd}`
                      : `Buy 2 Unlocks — $${UNLOCK_PACK.usd}`}
                </button>
                <p className={styles.hint}>
                  {buyerMode ? '30-day access · All sellers · No subscription' : 'One-time payment · No subscription'}
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Monthly subscription block ── */}
        {(isMarket || tab === 'subscribe') && (
          <div className={styles.plansBlock}>
            {isMarket && <p className={styles.sectionLabel}>📦 Monthly Plans</p>}

            {/* Standard */}
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <span className={styles.planName}>Standard</span>
                <span className={styles.planPrice}>{PLAN_PRICES.standard.label}</span>
              </div>
              <ul className={styles.planFeatures}>
                <li>✓ Unlimited chat unlocks</li>
                <li>✓ List up to 50 products</li>
                <li>✓ Full seller dashboard</li>
                <li>✓ Order tracking</li>
              </ul>
              <button
                className={`${styles.planBtn} ${isMarket ? styles.planBtnMarket : ''}`}
                onClick={() => handleSubscribe('standard')}
                disabled={!!loading}
              >
                {loading === 'standard' ? 'Processing…' : 'Subscribe — 40.000 rp/bln'}
              </button>
            </div>

            {/* Premium */}
            <div className={[styles.planCard, styles.planCardPremium].join(' ')}>
              <div className={styles.planBadge}>BEST VALUE</div>
              <div className={styles.planHeader}>
                <span className={styles.planName}>Premium</span>
                <span className={styles.planPrice}>{PLAN_PRICES.premium.label}</span>
              </div>
              <ul className={styles.planFeatures}>
                <li>✓ Everything in Standard</li>
                <li>✓ Unlimited products & images</li>
                <li>✓ 1× Profile Boost per month</li>
                <li>✓ Priority badge in search</li>
              </ul>
              <button
                className={[styles.planBtn, styles.planBtnPremium].join(' ')}
                onClick={() => handleSubscribe('premium')}
                disabled={!!loading}
              >
                {loading === 'premium' ? 'Processing…' : 'Subscribe — 79.000 rp/bln'}
              </button>
            </div>

            <p className={styles.hint}>Cancel anytime · Auto-renews monthly</p>
          </div>
        )}

        {/* Math nudge — non-market only */}
        {!isMarket && tab === 'unlock' && unlockBalance === 0 && (
          <p className={styles.nudge}>
            💡 2 unlocks = $3.98 · Monthly Standard = ~$2.50 · <button className={styles.nudgeBtn} onClick={() => setTab('subscribe')}>Save more →</button>
          </p>
        )}

      </div>
    </div>
  )
}
