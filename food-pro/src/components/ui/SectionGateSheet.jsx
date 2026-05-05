/**
 * SectionGateSheet — popup form shown when user first enters a section.
 * Collects required fields specific to that section.
 * One-time setup — saved to profile, never asked again.
 *
 * Sections:
 * - dating: relationship goal, interests, what looking for
 * - marketplace: buyer/seller, product categories of interest
 * - food: delivery address
 * - rides: phone verified
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './SectionGateSheet.module.css'

const DATING_GOALS = ['Casual dating', 'Serious relationship', 'Marriage', 'Friends first', 'Not sure yet']
const DATING_INTERESTS = ['Music', 'Travel', 'Food', 'Sports', 'Art', 'Movies', 'Gaming', 'Photography', 'Fitness', 'Reading', 'Nature', 'Fashion', 'Cooking', 'Dancing', 'Tech']
const MARKETPLACE_CATEGORIES = ["Women's Fashion", "Men's Fashion", 'Shoes', 'Bags & Luggage', 'Watches & Jewellery', 'Muslim Fashion', 'Phones & Accessories', 'Computers & Laptops', 'Electronics', 'TV & Home Appliances', 'Beauty & Skincare', 'Health', 'Food & Beverages', 'Mom & Baby', 'Toys & Games', 'Sports & Outdoors', 'Home & Living', 'Furniture & Decor', 'Automotive', 'Books & Stationery', 'Pet Supplies', 'Hobbies & Collections']

export function checkSectionAccess(section, userProfile) {
  if (!userProfile) return { allowed: false, missing: 'profile' }
  switch (section) {
    case 'dating':
      if (!userProfile.datingSetup) return { allowed: false, missing: 'dating' }
      return { allowed: true }
    case 'marketplace':
      if (!userProfile.marketplaceSetup) return { allowed: false, missing: 'marketplace' }
      return { allowed: true }
    case 'food':
    case 'rides':
      return { allowed: true } // basic sections — no gate
    default:
      return { allowed: true }
  }
}

export default function SectionGateSheet({ open, section, onClose, onComplete }) {
  // Dating fields
  const [relationshipGoal, setRelationshipGoal] = useState('')
  const [interests, setInterests] = useState([])
  const [lookingForText, setLookingForText] = useState('')

  // Marketplace fields
  const [buyerOrSeller, setBuyerOrSeller] = useState('buyer')
  const [categories, setCategories] = useState([])

  if (!open) return null

  const toggleInterest = (i) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  const toggleCategory = (c) => setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const handleComplete = () => {
    if (section === 'dating') {
      if (!relationshipGoal || interests.length === 0) return
      onComplete?.({
        datingSetup: true,
        relationshipGoal,
        datingInterests: interests,
        datingLookingFor: lookingForText.trim(),
      })
    } else if (section === 'marketplace') {
      onComplete?.({
        marketplaceSetup: true,
        marketplaceRole: buyerOrSeller,
        marketplaceCategories: categories,
      })
    }
  }

  const isDating = section === 'dating'
  const isMarketplace = section === 'marketplace'

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>{isDating ? '💕' : '🛍️'}</span>
          <div>
            <span className={styles.title}>
              {isDating ? 'Set Up Dating Profile' : 'Set Up Marketplace'}
            </span>
            <span className={styles.subtitle}>
              One-time setup · Takes 30 seconds
            </span>
          </div>
        </div>

        {/* Privacy note */}
        <div className={styles.privacyNote}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>
            {isDating
              ? 'Your dating profile is only visible in the Dating section. Marketplace users cannot see it.'
              : 'Your marketplace preferences help us show you relevant products. This info is private.'}
          </span>
        </div>

        <div className={styles.body}>
          {/* ── Dating setup ── */}
          {isDating && (
            <>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>What are you looking for?</span>
                <div className={styles.chips}>
                  {DATING_GOALS.map(g => (
                    <button key={g} className={`${styles.chip} ${relationshipGoal === g ? styles.chipOn : ''}`} onClick={() => setRelationshipGoal(g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Your interests (select 3+)</span>
                <div className={styles.chips}>
                  {DATING_INTERESTS.map(i => (
                    <button key={i} className={`${styles.chip} ${interests.includes(i) ? styles.chipOn : ''}`} onClick={() => toggleInterest(i)}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Describe your ideal match (optional)</span>
                <textarea
                  className={styles.textInput}
                  value={lookingForText}
                  onChange={e => setLookingForText(e.target.value)}
                  placeholder="e.g. Someone kind, adventurous, loves food..."
                  rows={3}
                  maxLength={200}
                />
              </div>
            </>
          )}

          {/* ── Marketplace setup ── */}
          {isMarketplace && (
            <>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>I am a</span>
                <div className={styles.roleRow}>
                  <button className={`${styles.roleBtn} ${buyerOrSeller === 'buyer' ? styles.roleBtnOn : ''}`} onClick={() => setBuyerOrSeller('buyer')}>
                    🛒 Buyer
                  </button>
                  <button className={`${styles.roleBtn} ${buyerOrSeller === 'seller' ? styles.roleBtnOn : ''}`} onClick={() => setBuyerOrSeller('seller')}>
                    🏪 Seller
                  </button>
                  <button className={`${styles.roleBtn} ${buyerOrSeller === 'both' ? styles.roleBtnOn : ''}`} onClick={() => setBuyerOrSeller('both')}>
                    Both
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Categories that interest you</span>
                <div className={styles.chips}>
                  {MARKETPLACE_CATEGORIES.map(c => (
                    <button key={c} className={`${styles.chip} ${categories.includes(c) ? styles.chipOn : ''}`} onClick={() => toggleCategory(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.skipBtn} onClick={onClose}>Maybe Later</button>
          <button className={styles.enterBtn} onClick={handleComplete}
            disabled={isDating ? (!relationshipGoal || interests.length < 3) : false}
          >
            {isDating ? 'Enter Dating' : 'Enter Marketplace'} →
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
