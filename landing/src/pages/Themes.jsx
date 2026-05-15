/* ─────────────────────────────────────────────────────────────
   /themes — the theme catalogue. Numbered SL-001 through SL-021.
   These are the "design #1, #2 … #12" landing-page templates the
   donut app + future verticals build on. The donut app's own
   theme is SL-018 (or pick another at vendor setup time).

   Restored from the legacy landing/src/App.jsx 'themes' page,
   wrapped in the new SLLayout chrome.
   ───────────────────────────────────────────────────────────── */
import React, { useState } from 'react'
import SLLayout from '../SLLayout.jsx'

const ALL_THEMES = [
  { id: 'noodle',      ref: 'SL-001', label: 'Noodles',         accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_41_03-am.png' },
  { id: 'coffee',      ref: 'SL-002', label: 'Coffee',          accent: '#8A570F', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_11_01-am.png' },
  { id: 'satay',       ref: 'SL-003', label: 'Satay',           accent: '#C15D15', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012941.png' },
  { id: 'juice',       ref: 'SL-004', label: 'Fresh Juice',     accent: '#E8B92C', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013408.png' },
  { id: 'chicken',     ref: 'SL-005', label: 'Crispy Chicken',  accent: '#C15D15', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014830.png',                                                  popular: true,  activations: 156 },
  { id: 'bakso',       ref: 'SL-006', label: 'Bakso',           accent: '#E8992C', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_45_14-am.png',  popular: true,  activations: 203 },
  { id: 'friedrice',   ref: 'SL-007', label: 'Nasi Goreng',     accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012403.png',                                                  popular: true,  activations: 312 },
  { id: 'pecellele',   ref: 'SL-008', label: 'Pecel Lele',      accent: '#6B8A0F', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_17_10-am.png' },
  { id: 'kebab',       ref: 'SL-009', label: 'Kebab',           accent: '#FF6B35', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_04_20-pm.png' },
  { id: 'martabak',    ref: 'SL-010', label: 'Martabak',        accent: '#8A0F8A', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_08_25-am.png' },
  { id: 'escendol',    ref: 'SL-011', label: 'Es Cendol',       accent: '#4D8A0F', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_06_43-pm.png' },
  { id: 'ketoprak',    ref: 'SL-012', label: 'Ketoprak',        accent: '#B8860B', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_10_51-pm.png' },
  { id: 'cilok',       ref: 'SL-013', label: 'Cilok Cimol',     accent: '#C15D15', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_12_27-pm.png' },
  { id: 'ikanbakar',   ref: 'SL-014', label: 'Ikan Bakar',      accent: '#E8512C', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_14_52-pm.png' },
  { id: 'nasiuduk',    ref: 'SL-015', label: 'Nasi Uduk',       accent: '#E8B92C', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_26_08-pm.png' },
  { id: 'bebekgoreng', ref: 'SL-016', label: 'Bebek Goreng',    accent: '#6B8A0F', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_27_16-pm.png' },
  { id: 'burger',      ref: 'SL-017', label: 'Burgers',         accent: '#B8860B', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014403.png',                                                  popular: true,  activations: 134 },
  { id: 'donut',       ref: 'SL-018', label: 'Donuts',          accent: '#DB2777', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png', livePreview: '/donut' },
  { id: 'hotdog',      ref: 'SL-019', label: 'Hot Dogs',        accent: '#DC2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_39_59-am.png' },
  { id: 'pizza',       ref: 'SL-020', label: 'Pizza',           accent: '#DC2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_54_57-am.png' },
  { id: 'vegetables',  ref: 'SL-021', label: 'Vegetables',      accent: '#27AE60', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_46_34%20PM.png' },
]

const STYLE = `
  .th-search { display: flex; gap: 10px; margin-bottom: 28px; }
  .th-search input { flex: 1; padding: 14px 18px; border-radius: 14px; border: 1px solid var(--sl-gray-200); background: #fff; font-size: 15px; font-family: inherit; outline: none; }
  .th-search input:focus { border-color: var(--sl-yellow-deep); box-shadow: 0 0 0 3px rgba(250,204,21,0.18); }
  .th-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (min-width: 600px) { .th-grid { grid-template-columns: 1fr 1fr 1fr; gap: 22px; } }
  @media (min-width: 900px) { .th-grid { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 24px; } }
  .th-card { background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid var(--sl-gray-200); box-shadow: 0 8px 22px rgba(0,0,0,0.06); transition: transform 180ms ease, box-shadow 180ms ease; cursor: pointer; }
  .th-card:hover { transform: translateY(-4px); box-shadow: 0 14px 38px rgba(0,0,0,0.12); }
  .th-card__media { position: relative; width: 100%; aspect-ratio: 9 / 16; overflow: hidden; background: #1a1a1a; }
  .th-card__media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .th-card__notch { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 44px; height: 7px; background: #000; border-radius: 4px; z-index: 2; }
  .th-card__overlay { position: absolute; inset: 0; background: linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 16px 14px; color: #fff; }
  .th-card__label { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; text-shadow: 0 2px 6px rgba(0,0,0,0.6); }
  .th-card__ref { font-size: 11px; font-weight: 700; opacity: 0.85; letter-spacing: 0.6px; margin-top: 2px; }
  .th-card__chip { position: absolute; top: 12px; right: 12px; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 0.4px; text-transform: uppercase; z-index: 3; }
  .th-card__chip--popular { background: #FACC15; color: #0A0A0A; }
  .th-card__chip--live    { background: #22C55E; color: #fff; }
  .th-card__body { padding: 12px 14px 14px; }
  .th-card__body strong { display: block; color: var(--sl-black); font-size: 14px; font-weight: 800; }
  .th-card__body span { display: block; font-size: 12px; color: var(--sl-gray-500); margin-top: 3px; letter-spacing: 0.4px; }
  .th-empty { padding: 60px 20px; text-align: center; color: var(--sl-gray-500); font-size: 15px; }
`

export default function Themes () {
  const [query, setQuery] = useState('')
  const filtered = query
    ? ALL_THEMES.filter(t => t.label.toLowerCase().includes(query.toLowerCase()) || t.ref.toLowerCase().includes(query.toLowerCase()))
    : ALL_THEMES

  return (
    <SLLayout
      kicker="Theme catalogue"
      title="Phone-splash themes · 21 designs."
      lede="Every StreetLocal shop launches with one of these phone-splash themes — distinct illustration, colour palette, and motion. Pick one at signup; swap any time. The Donuts theme (SL-018) is live now — tap it to see the full customer experience."
    >
      <style>{STYLE}</style>
      <section className="sl-container" style={{ paddingBottom: 80 }}>

        {/* Cross-link: the 12 saved landing-page design templates
            (Classic / Glass Card / Discover / Float / Warm Card /
            Beyond / Showcase / Hyper / Chrome / Diamond / Solutions /
            Neo Grid) live in /landing-themes.html — the original
            HTML gallery. The donut app's current splash is based on
            Theme #6 "Beyond" from that gallery. */}
        <a href="/landing-themes.html" target="_blank" rel="noopener" style={{ display: 'block', textDecoration: 'none', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(250,204,21,0.10), rgba(234,179,8,0.04))', border: '1px solid rgba(250,204,21,0.35)', transition: 'transform 180ms ease' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--sl-yellow), var(--sl-yellow-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 6px 18px rgba(250,204,21,0.45)' }}>🎨</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sl-yellow-deep)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Looking for the 12 landing-page design templates?</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-black)', marginBottom: 2 }}>Open the saved gallery → Classic, Glass Card, Discover, Float, Warm Card, <strong style={{ color: 'var(--sl-yellow-deep)' }}>Beyond (#6)</strong>, Showcase, Hyper, Chrome, Diamond, Solutions, Neo Grid</div>
              <div style={{ fontSize: 13, color: 'var(--sl-gray-600)', marginTop: 4 }}>The donut app currently uses <strong>Theme #6 Beyond</strong> — pink/cyan luxury gradient. Opens in a new tab.</div>
            </div>
            <div style={{ flexShrink: 0, fontSize: 22, color: 'var(--sl-yellow-deep)', fontWeight: 900 }}>↗</div>
          </div>
        </a>

        <div className="th-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone-splash themes by name or reference (e.g. donuts, SL-006)…"
            autoComplete="off"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="th-empty">
            No theme matches "<strong style={{ color: 'var(--sl-black)' }}>{query}</strong>". Email <a href="mailto:streetlocallive@gmail.com" style={{ color: 'var(--sl-yellow-deep)' }}>streetlocallive@gmail.com</a> to request one.
          </div>
        ) : (
          <div className="th-grid">
            {filtered.map((t) => {
              const inner = (
                <div className="th-card" key={t.id}>
                  <div className="th-card__media">
                    <div className="th-card__notch" />
                    <img loading="lazy" src={t.img} alt={t.label} />
                    <div className="th-card__overlay">
                      <div className="th-card__label">{t.label}</div>
                      <div className="th-card__ref">{t.ref}</div>
                    </div>
                    {t.popular && <span className="th-card__chip th-card__chip--popular">Popular</span>}
                    {t.livePreview && <span className="th-card__chip th-card__chip--live">Live demo</span>}
                  </div>
                  <div className="th-card__body">
                    <strong>{t.label}</strong>
                    <span>{t.ref}{t.activations ? ` · ${t.activations} active` : ''}</span>
                  </div>
                </div>
              )
              return t.livePreview
                ? <a key={t.id} href={t.livePreview} style={{ textDecoration: 'none' }}>{inner}</a>
                : <div key={t.id}>{inner}</div>
            })}
          </div>
        )}

        <div style={{ marginTop: 60, padding: '24px 28px', borderRadius: 18, background: 'var(--sl-gray-50)', border: '1px solid var(--sl-gray-200)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-yellow-deep)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Need a custom theme?</div>
          <div style={{ fontSize: 15, color: 'var(--sl-gray-700)', lineHeight: 1.55 }}>
            We build new themes on Enterprise. Email <a href="mailto:streetlocallive@gmail.com" style={{ color: 'var(--sl-yellow-deep)', fontWeight: 700 }}>streetlocallive@gmail.com</a> with your vertical (laundry? car wash? barber? gym?) and we'll commission a design + add it to the catalogue.
          </div>
        </div>
      </section>
    </SLLayout>
  )
}
