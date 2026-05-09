/**
 * WebsiteFooter — Property website footer with working navigation links.
 */

const LOGO = 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/bold-3d-_indoo_-logo-design.png'

export default function WebsiteFooter({ onNavigate }) {
  const nav = (page) => { onNavigate?.(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="ws-container" style={{ padding: '48px 48px 24px', display: 'flex', gap: 48 }}>
        {/* Brand */}
        <div style={{ flex: 1.5, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <img src={LOGO} alt="Indoo" style={{ height: 28 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>PROPERTY</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
            Indonesia's most complete property platform. Buy, sell, rent — houses, villas, apartments, kos, land, and more.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', color: '#8DC63F', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>📱 Android</a>
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>🍎 iOS</a>
          </div>
        </div>

        {/* Property links */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Property</div>
          {[
            { label: 'For Sale', action: () => nav('sale') },
            { label: 'For Rent', action: () => nav('rent') },
            { label: 'New Projects', action: () => nav('newprojects') },
            { label: 'Kos', action: () => nav('search') },
            { label: 'Villa', action: () => nav('search') },
            { label: 'Land', action: () => nav('search') },
          ].map(link => (
            <button key={link.label} onClick={link.action} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', marginBottom: 4, textAlign: 'left', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8DC63F'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >{link.label}</button>
          ))}
        </div>

        {/* Services */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Services</div>
          {[
            { label: 'KPR Calculator', action: () => nav('kpr') },
            { label: 'Property Valuation', action: () => nav('home') },
            { label: 'Agent Directory', action: () => nav('agents') },
            { label: 'List Your Property', action: () => nav('home') },
          ].map(link => (
            <button key={link.label} onClick={link.action} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', marginBottom: 4, textAlign: 'left', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8DC63F'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >{link.label}</button>
          ))}
        </div>

        {/* Company */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Company</div>
          {['About INDOO', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map(label => (
            <div key={label} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: '4px 0', marginBottom: 4 }}>{label}</div>
          ))}
        </div>
      </div>

      <div className="ws-container" style={{ padding: '16px 48px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>© 2026 INDOO Indonesia. All rights reserved.</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>indoo.id</span>
      </div>
    </footer>
  )
}
