/**
 * WhatsAppCTA — WhatsApp contact button using custom image.
 * Variants: large (full width), small (pill), fab (floating action button).
 */

const WA_IMG = 'https://ik.imagekit.io/nepgaxllc/dfggdfgees-removebg-preview.png?updatedAt=1777539531358'

export default function WhatsAppCTA({ phoneNumber, listingTitle, listingPrice, size = 'large' }) {
  const formattedPhone = phoneNumber ? String(phoneNumber).replace(/^0/, '62').replace(/^\+/, '') : '6281234567890'
  const priceText = listingPrice ? `Rp ${Number(String(listingPrice).replace(/\./g, '')).toLocaleString('id-ID')}` : ''
  const message = `Halo, saya tertarik dengan ${listingTitle || 'properti ini'}${priceText ? ` seharga ${priceText}` : ''}. Apakah masih tersedia?`
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

  if (size === 'fab') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        position: 'fixed', bottom: 90, right: 16, zIndex: 50,
        width: 56, height: 56, borderRadius: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
        textDecoration: 'none', background: 'transparent',
        animation: 'rd_pulse 2.5s ease-in-out infinite',
      }}>
        <img src={WA_IMG} alt="WhatsApp" style={{ height: 52, objectFit: 'contain' }} />
      </a>
    )
  }

  if (size === 'small') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center',
        textDecoration: 'none', cursor: 'pointer',
      }}>
        <img src={WA_IMG} alt="WhatsApp" style={{ height: 36, objectFit: 'contain' }} />
      </a>
    )
  }

  // large (default)
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', textDecoration: 'none', cursor: 'pointer',
    }}>
      <img src={WA_IMG} alt="Chat via WhatsApp" style={{ height: 48, objectFit: 'contain' }} />
    </a>
  )
}
