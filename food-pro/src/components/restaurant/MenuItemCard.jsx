import styles from './RestaurantMenuSheet.module.css'
import { fmtRp, CATEGORY_GRADIENTS } from './menuSheetConstants'

// ── Menu item card — full-screen ──────────────────────────────────────────────
export default function MenuItemCard({ item, qty, onAdd, onRemove, onCustomize, itemRef, badge, tags, dealBadge }) {
  const bg = item.photo_url
    ? `url("${item.photo_url}")`
    : CATEGORY_GRADIENTS[item.category] ?? 'linear-gradient(160deg, #1a1200 0%, #0d0d0d 100%)'

  return (
    <div className={styles.itemCard} ref={itemRef}>
      {/* Background */}
      <div className={styles.itemBg} style={{ backgroundImage: bg }} />
      <div className={styles.itemOverlay} />

      {/* Badge banner top-right */}
      {badge && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 3,
          width: 60, height: 60,
        }}>
          <img src={badge.image} alt={badge.label} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
        </div>
      )}

      {/* Deal badge top-left */}
      {dealBadge && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 3,
          padding: '5px 10px', borderRadius: 8, backgroundColor: '#FACC15',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#000' }}>🏷️ {dealBadge.discountPercent}% OFF</span>
        </div>
      )}

      {/* Prep time top-right */}
      {item.prep_time_min && (
        <div className={styles.itemPrep}>⏱ {item.prep_time_min} min</div>
      )}

      {/* Sold out overlay */}
      {item.is_available === false && (
        <div className={styles.soldOutOverlay}>
          <span className={styles.soldOutText}>Sold Out</span>
        </div>
      )}

      {/* Bottom content */}
      <div className={styles.itemBottom}>
        {/* Dish attribute icons — above name */}
        {tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            {tags.map(tag => (
              <span key={tag.id} style={{ fontSize: 20 }} title={tag.label}>
                {tag.emoji}
              </span>
            ))}
          </div>
        )}

        <h2 className={styles.itemName}>{item.name}</h2>

        {item.description && (
          <p className={styles.itemDesc}>{item.description}</p>
        )}
        <div className={styles.itemFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {dealBadge && item.original_price && item.original_price > item.price && (
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{fmtRp(item.original_price)}</span>
            )}
            <span className={styles.itemPrice} style={dealBadge ? { color: '#8DC63F' } : {}}>{fmtRp(item.price)}</span>
          </div>

          {item.is_available !== false && (
            qty > 0 ? (
              <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={onRemove}>−</button>
                <span className={styles.qtyNum}>{qty}</span>
                <button className={styles.qtyBtn} onClick={onAdd}>+</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={styles.addBtn} onClick={onAdd}>
                  + Add
                </button>
                {onCustomize && (
                  <button
                    className={styles.addBtn}
                    onClick={() => onCustomize(item)}
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', minWidth: 0, padding: '0 12px' }}
                  >
                    ⚙
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
