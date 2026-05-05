import { useState, useMemo } from 'react'
import styles from './CustomizeSheet.module.css'
import { SPICE_LEVELS, COMMON_EXTRAS, SIZE_OPTIONS, SPECIAL_REQUESTS } from '@/constants/foodCustomizations'

const fmtRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function CustomizeSheet({ open, item, onClose, onConfirm }) {
  const [spiceLevel, setSpiceLevel]         = useState(1)
  const [size, setSize]                     = useState('regular')
  const [extras, setExtras]                 = useState([])
  const [specialRequests, setSpecialRequests] = useState([])
  const [notes, setNotes]                   = useState('')

  const sizeOption = SIZE_OPTIONS.find(s => s.id === size) ?? SIZE_OPTIONS[0]

  const totalPrice = useMemo(() => {
    const base = (item?.price ?? 0) * sizeOption.priceMultiplier
    const extrasTotal = extras.reduce((sum, id) => {
      const ex = COMMON_EXTRAS.find(e => e.id === id)
      return sum + (ex?.price ?? 0)
    }, 0)
    return Math.round(base + extrasTotal)
  }, [item?.price, sizeOption.priceMultiplier, extras])

  const toggleExtra = (id) => {
    setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  const toggleRequest = (req) => {
    setSpecialRequests(prev => prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req])
  }

  const handleConfirm = () => {
    onConfirm({
      item,
      spiceLevel: SPICE_LEVELS[spiceLevel],
      size: sizeOption,
      extras: extras.map(id => COMMON_EXTRAS.find(e => e.id === id)).filter(Boolean),
      specialRequests,
      notes: notes.trim(),
      totalPrice,
    })
  }

  if (!open || !item) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.body}>
          {/* Header */}
          <div className={styles.header}>
            {item.photo_url ? (
              <img src={item.photo_url} alt="" className={styles.thumb} />
            ) : (
              <div className={styles.thumbFallback}>🍽️</div>
            )}
            <div className={styles.headerText}>
              <h3 className={styles.itemName}>{item.name}</h3>
              <div className={styles.itemPrice}>{fmtRp(item.price)}</div>
            </div>
          </div>

          {/* Spice Level */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Spice Level</div>
            <div className={styles.pillRow}>
              {SPICE_LEVELS.map(level => (
                <button
                  key={level.id}
                  className={`${styles.pill} ${spiceLevel === level.id ? styles.pillActive : ''}`}
                  style={spiceLevel === level.id ? { color: level.color, borderColor: level.color } : undefined}
                  onClick={() => setSpiceLevel(level.id)}
                >
                  {level.emoji} {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Size</div>
            <div className={styles.pillRow}>
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`${styles.pill} ${size === opt.id ? styles.pillActive : ''}`}
                  style={size === opt.id ? { color: '#8DC63F', borderColor: '#8DC63F' } : undefined}
                  onClick={() => setSize(opt.id)}
                >
                  {opt.label}
                  {opt.priceMultiplier !== 1 && (
                    <span className={styles.pillSub}>{opt.priceMultiplier}x price</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Extras</div>
            {COMMON_EXTRAS.map(extra => (
              <div
                key={extra.id}
                className={styles.extraRow}
                onClick={() => toggleExtra(extra.id)}
              >
                <div className={`${styles.checkbox} ${extras.includes(extra.id) ? styles.checkboxChecked : ''}`}>
                  {extras.includes(extra.id) && '✓'}
                </div>
                <span className={styles.extraLabel}>{extra.label}</span>
                <span className={styles.extraPrice}>+{fmtRp(extra.price)}</span>
              </div>
            ))}
          </div>

          {/* Special Requests */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Special Requests</div>
            <div className={styles.chipRow}>
              {SPECIAL_REQUESTS.map(req => (
                <button
                  key={req}
                  className={`${styles.chip} ${specialRequests.includes(req) ? styles.chipActive : ''}`}
                  onClick={() => toggleRequest(req)}
                >
                  {req}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Notes</div>
            <textarea
              className={styles.notesInput}
              placeholder="Any special instructions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalPrice}>{fmtRp(totalPrice)}</div>
          </div>
          <button className={styles.addBtn} onClick={handleConfirm}>
            Add to Cart - {fmtRp(totalPrice)}
          </button>
        </div>
      </div>
    </>
  )
}
