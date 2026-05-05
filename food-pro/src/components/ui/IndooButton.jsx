/**
 * IndooButton — Standard green action button used across the entire app.
 * Uses the INDOO branded button image as background with text overlay.
 */
const BTN_IMG = 'https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png'

export default function IndooButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: 0, border: 'none', cursor: disabled ? 'default' : 'pointer',
        position: 'relative', overflow: 'hidden', borderRadius: 14,
        opacity: disabled ? 0.4 : 1, transition: 'opacity 0.2s',
        ...style,
      }}
    >
      <img src={BTN_IMG} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 16, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        fontFamily: 'inherit',
      }}>
        {children}
      </span>
    </button>
  )
}
