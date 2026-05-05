import styles from '../ProfileScreen.module.css'
import { TRADE_ROLE_GROUPS } from '@/components/ui/TradeRoleSheet'
import { WORLD_CUISINES } from '@/components/ui/CuisineSheet'
import { SHOP_TYPE_OPTIONS } from '@/components/ui/ShopTypeSheet'
import { getCategoryCopy } from '@/constants/categoryCopy'

const DEFAULT_HOURS = { open: '', close: '', closed: false }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ProfileMakerFields({
  lookingFor,
  tradeRole, setTradeRoleOpen,
  shopType, setShopType, setShopTypeOpen,
  cuisineType, setCuisineType, setCuisineOpen,
  targetAudience, setTargetAudience,
  brandName, setBrandName,
  priceMin, setPriceMin, priceMax, setPriceMax,
  market, setMarket,
  businessHours, setBusinessHours,
  HelpTip,
}) {
  const updateHour = (day, field, value) =>
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))

  return (
    <>
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>I am here to</label>
          <HelpTip text="Are you selling products or services, buying, or both? This helps people understand your intent straight away." />
        </div>
        <button type="button" className={styles.lookingForTrigger} onClick={() => setTradeRoleOpen(true)}>
          {tradeRole
            ? (() => {
                const opt = TRADE_ROLE_GROUPS.flatMap(g => g.options).find(o => o.value === tradeRole)
                return opt ? <span>{opt.emoji} {opt.label}</span> : <span>{tradeRole}</span>
              })()
            : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
          }
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {getCategoryCopy(lookingFor).pageType !== null && (
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Profile Tab Type</label>
            <HelpTip text="Choose what your profile tab shows visitors — your products, services, or a menu." />
          </div>
          <button type="button" className={styles.lookingForTrigger} onClick={() => setShopTypeOpen(true)}>
            {(() => {
              const effective = shopType ?? getCategoryCopy(lookingFor).pageType
              const opt = SHOP_TYPE_OPTIONS.find(o => o.value === effective)
              return opt ? <span>{opt.emoji} {opt.label}</span> : <span className={styles.lookingForPlaceholder}>Tap to choose…</span>
            })()}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {shopType && (
            <button type="button" className={styles.brandQuickBtn} onClick={() => setShopType(null)}>↩ Reset to default</button>
          )}
        </div>
      )}

      {['restaurant','catering','bar_nightclub','hotel_accom','fresh_produce','food_drink'].includes(lookingFor) && (
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Cuisine Type</label>
            <HelpTip text="Let people know what type of food or cuisine you specialise in." />
          </div>
          <button type="button" className={styles.lookingForTrigger} onClick={() => setCuisineOpen(true)}>
            {cuisineType
              ? (() => {
                  const c = WORLD_CUISINES.find(x => x.value === cuisineType)
                  return c ? <span>{c.emoji} {c.label}</span> : <span>{cuisineType}</span>
                })()
              : <span className={styles.lookingForPlaceholder}>Select cuisine…</span>
            }
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {cuisineType && (
            <button type="button" className={styles.brandQuickBtn} onClick={() => setCuisineType(null)}>✕ Clear</button>
          )}
        </div>
      )}

      {['handmade','craft_supplies','art_craft','fashion','buy_sell'].includes(lookingFor) && (
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>Target Audience</label>
            <HelpTip text="Who are your products made for?" />
          </div>
          <div className={styles.selectWrap}>
            <select
              className={styles.fieldSelect}
              value={Array.isArray(targetAudience) ? (targetAudience[0] ?? '') : (targetAudience ?? '')}
              onChange={e => setTargetAudience(e.target.value ? [e.target.value] : [])}
            >
              <option value="">Select audience…</option>
              <option value="all">All Ages</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="children">Children</option>
              <option value="gifts">Gifts</option>
              <option value="teens">Teens</option>
              <option value="babies">Babies &amp; Toddlers</option>
              <option value="elderly">Elderly</option>
              <option value="unisex">Unisex</option>
            </select>
            <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}

      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Brand Name</label>
          <HelpTip text="Type your brand name, or choose a quick option below." />
        </div>
        <input
          className={styles.fieldInput}
          value={brandName}
          onChange={e => setBrandName(e.target.value)}
          placeholder="Type your brand name…"
          maxLength={50}
        />
        <div className={styles.brandQuickRow}>
          {['Unbranded', 'On Request'].map(opt => (
            <button
              key={opt}
              type="button"
              className={`${styles.brandQuickBtn} ${brandName === opt ? styles.brandQuickBtnActive : ''}`}
              onClick={() => setBrandName(brandName === opt ? '' : opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Price Range</label>
          <HelpTip text="Set a min and max price so visitors know what to expect before reaching out." />
        </div>
        <div className={styles.priceRangeRow}>
          <input className={styles.fieldInput} value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min price" maxLength={30} />
          <span className={styles.priceRangeSep}>–</span>
          <input className={styles.fieldInput} value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max price" maxLength={30} />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Market</label>
          <HelpTip text="Let people know whether you sell locally, export internationally, or both." />
        </div>
        <div className={styles.selectWrap}>
          <select className={styles.fieldSelect} value={market} onChange={e => setMarket(e.target.value)}>
            <option value="">Select market…</option>
            <option value="Local">Local</option>
            <option value="Export">Export</option>
            <option value="Local & Export">Local &amp; Export</option>
          </select>
          <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Business Hours */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>Business Hours</label>
          <HelpTip text="Set your hours for each day. Outside these hours your status shows as Invite Out automatically." />
        </div>
        <div className={styles.hoursGrid}>
          {DAYS.map(day => {
            const h = businessHours[day] ?? DEFAULT_HOURS
            return (
              <div key={day} className={styles.hoursRow}>
                <span className={`${styles.hoursDay} ${h.closed ? styles.hoursDayClosed : ''}`}>{day}</span>
                {h.closed ? (
                  <span className={styles.hoursClosedLabel}>Closed</span>
                ) : (
                  <>
                    <input type="time" className={styles.hoursInput} value={h.open} onChange={e => updateHour(day, 'open', e.target.value)} />
                    <span className={styles.hoursSep}>–</span>
                    <input type="time" className={styles.hoursInput} value={h.close} onChange={e => updateHour(day, 'close', e.target.value)} />
                  </>
                )}
                <button
                  type="button"
                  className={`${styles.hoursClosedBtn} ${h.closed ? styles.hoursClosedBtnActive : ''}`}
                  onClick={() => updateHour(day, 'closed', !h.closed)}
                >
                  {h.closed ? 'Open' : 'Closed'}
                </button>
              </div>
            )
          })}
        </div>
        <p className={styles.hoursHint}>
          Outside these hours your status will automatically show as <strong>Invite Out</strong>
        </p>
      </div>
    </>
  )
}
