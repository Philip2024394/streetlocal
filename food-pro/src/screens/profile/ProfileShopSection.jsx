/**
 * ProfileShopSection — seller storefront panel (ECHO Commerce), MicroShopEditor tab,
 * bizWhatsapp, product condition, open seller dashboard button.
 *
 * Rendered conditionally when lookingFor === 'business' or profileTab === 'shop'.
 */
import MicroShopEditor from '@/components/ui/MicroShopEditor'
import EchoCommercePanel from '@/components/commerce/EchoCommercePanel'
import styles from '../ProfileScreen.module.css'

export default function ProfileShopSection({
  lookingFor,
  profileTab,
  hasShop,
  tier,
  user,
  brandName, setBrandName,
  bizWhatsapp, setBizWhatsapp,
  productCondition, setProductCondition,
  echoPanelOpen, setEchoPanelOpen,
  styles: _styles, // not used — using imported styles directly
}) {
  return (
    <>
      {/* ── ECHO Commerce inline fields — business intent only ── */}
      {lookingFor === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div style={{ background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752" alt="Indoo Market" style={{ height:20, objectFit:'contain' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Seller Setup</span>
            </div>

            {/* Brand name */}
            <div className={styles.fieldRow} style={{ marginBottom: 10 }}>
              <label className={styles.fieldLabel}>Brand / Business Name</label>
              <input
                className={styles.fieldInput}
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="e.g. My Store, ABC Supplies…"
              />
            </div>

            {/* WhatsApp number */}
            <div className={styles.fieldRow} style={{ marginBottom: 10 }}>
              <label className={styles.fieldLabel}>WhatsApp Number</label>
              <input
                className={styles.fieldInput}
                value={bizWhatsapp}
                onChange={e => setBizWhatsapp(e.target.value)}
                placeholder="+1 555 000 0000"
                type="tel"
              />
            </div>

            {/* Product condition */}
            <div className={styles.fieldRow} style={{ marginBottom: 10 }}>
              <label className={styles.fieldLabel}>Products are</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'new',         label: '✨ New' },
                  { value: 'used',        label: '♻️ Used' },
                  { value: 'both',        label: '🔀 Both' },
                  { value: 'refurbished', label: '🔧 Refurbished' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setProductCondition(opt.value)}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      background: productCondition === opt.value ? 'rgba(141,198,63,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${productCondition === opt.value ? 'rgba(141,198,63,0.45)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 9,
                      color: productCondition === opt.value ? '#8DC63F' : 'rgba(255,255,255,0.45)',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Open seller panel */}
            <button
              type="button"
              onClick={() => setEchoPanelOpen(true)}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.35)',
                color: '#8DC63F', fontSize: 14, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              💼 Open Seller Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ── ECHO Commerce panel (business intent only) ── */}
      {lookingFor === 'business' && (
        <EchoCommercePanel
          open={echoPanelOpen}
          onToggle={setEchoPanelOpen}
          userId={user?.uid ?? user?.id}
          businessName={brandName}
        />
      )}

      {/* ── Shop Tab (MicroShopEditor) ── */}
      {profileTab === 'shop' && hasShop && (
        <MicroShopEditor
          userId={user?.uid ?? user?.id}
          tier={tier}
          visible={profileTab === 'shop'}
        />
      )}
    </>
  )
}
