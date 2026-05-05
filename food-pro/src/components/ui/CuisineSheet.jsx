import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './CuisineSheet.module.css'

export const WORLD_CUISINES = [
  // European
  { value: 'italian',       emoji: '🇮🇹', label: 'Italian'         },
  { value: 'french',        emoji: '🇫🇷', label: 'French'          },
  { value: 'spanish',       emoji: '🇪🇸', label: 'Spanish'         },
  { value: 'greek',         emoji: '🇬🇷', label: 'Greek'           },
  { value: 'mediterranean', emoji: '🌊', label: 'Mediterranean'    },
  { value: 'british',       emoji: '🇬🇧', label: 'British'         },
  { value: 'portuguese',    emoji: '🇵🇹', label: 'Portuguese'      },
  { value: 'german',        emoji: '🇩🇪', label: 'German'          },
  // Americas
  { value: 'american',      emoji: '🇺🇸', label: 'American'        },
  { value: 'mexican',       emoji: '🇲🇽', label: 'Mexican'         },
  { value: 'brazilian',     emoji: '🇧🇷', label: 'Brazilian'       },
  { value: 'peruvian',      emoji: '🇵🇪', label: 'Peruvian'        },
  { value: 'caribbean',     emoji: '🌴', label: 'Caribbean'        },
  { value: 'jamaican',      emoji: '🇯🇲', label: 'Jamaican'        },
  // African
  { value: 'nigerian',      emoji: '🇳🇬', label: 'Nigerian'        },
  { value: 'ghanaian',      emoji: '🇬🇭', label: 'Ghanaian'        },
  { value: 'ethiopian',     emoji: '🇪🇹', label: 'Ethiopian'       },
  { value: 'senegalese',    emoji: '🇸🇳', label: 'Senegalese'      },
  { value: 'moroccan',      emoji: '🇲🇦', label: 'Moroccan'        },
  { value: 'south_african', emoji: '🇿🇦', label: 'South African'   },
  { value: 'kenyan',        emoji: '🇰🇪', label: 'Kenyan'          },
  { value: 'congolese',     emoji: '🇨🇩', label: 'Congolese'       },
  // Middle East
  { value: 'lebanese',      emoji: '🇱🇧', label: 'Lebanese'        },
  { value: 'turkish',       emoji: '🇹🇷', label: 'Turkish'         },
  { value: 'persian',       emoji: '🇮🇷', label: 'Persian'         },
  { value: 'arabic',        emoji: '🌙', label: 'Arabic'           },
  { value: 'israeli',       emoji: '🇮🇱', label: 'Israeli'         },
  // South Asia
  { value: 'indian',        emoji: '🇮🇳', label: 'Indian'          },
  { value: 'pakistani',     emoji: '🇵🇰', label: 'Pakistani'       },
  { value: 'bangladeshi',   emoji: '🇧🇩', label: 'Bangladeshi'     },
  { value: 'sri_lankan',    emoji: '🇱🇰', label: 'Sri Lankan'      },
  { value: 'nepali',        emoji: '🇳🇵', label: 'Nepali'          },
  // East & SE Asia
  { value: 'chinese',       emoji: '🇨🇳', label: 'Chinese'         },
  { value: 'japanese',      emoji: '🇯🇵', label: 'Japanese'        },
  { value: 'korean',        emoji: '🇰🇷', label: 'Korean'          },
  { value: 'thai',          emoji: '🇹🇭', label: 'Thai'            },
  { value: 'vietnamese',    emoji: '🇻🇳', label: 'Vietnamese'      },
  { value: 'indonesian',    emoji: '🇮🇩', label: 'Indonesian'      },
  { value: 'malaysian',     emoji: '🇲🇾', label: 'Malaysian'       },
  { value: 'filipino',      emoji: '🇵🇭', label: 'Filipino'        },
  // Special
  { value: 'fusion',        emoji: '🔀', label: 'Fusion'           },
  { value: 'international', emoji: '🌍', label: 'International'    },
  { value: 'vegan',         emoji: '🌱', label: 'Vegan / Plant-Based' },
  { value: 'halal',         emoji: '🌙', label: 'Halal'            },
  { value: 'kosher',        emoji: '✡️', label: 'Kosher'           },
]

export default function CuisineSheet({ open, value, onChange, onClose }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 80) onClose()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>🍽️ Select Cuisine Type</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.grid}>
          {WORLD_CUISINES.map(c => (
            <button
              key={c.value}
              type="button"
              className={`${styles.pill} ${value === c.value ? styles.pillActive : ''}`}
              onClick={() => { onChange(c.value); onClose() }}
            >
              <span className={styles.pillEmoji}>{c.emoji}</span>
              <span className={styles.pillLabel}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
