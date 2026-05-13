// POS Integrations — storage + status only. Each adapter card lets the
// vendor paste API keys and toggle is_active. Full sync workers ship in
// a later phase; this surface unblocks vendors that already have a POS
// from blocking on integration availability.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BRAND = {
  red:       '#DC2626',
  redLight:  '#EF4444',
  redGlow:   'rgba(220,38,38,0.18)',
  redBorder: 'rgba(220,38,38,0.30)',
}

const card  = { padding: 14, borderRadius: 14, marginBottom: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }
const label = { fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

const PROVIDERS = [
  { id: 'toast',      label: 'Toast',         tagline: 'US restaurant POS — menu + orders sync',  docUrl: 'https://doc.toasttab.com/' },
  { id: 'square',     label: 'Square',        tagline: 'Square for Restaurants — global card-on-file', docUrl: 'https://developer.squareup.com/docs/restaurants' },
  { id: 'loyverse',   label: 'Loyverse',      tagline: 'Free POS popular in Asia',                  docUrl: 'https://help.loyverse.com/' },
  { id: 'clover',     label: 'Clover',        tagline: 'US POS terminal + cloud',                   docUrl: 'https://docs.clover.com/' },
  { id: 'lightspeed', label: 'Lightspeed',    tagline: 'EU / US restaurant POS',                    docUrl: 'https://developers.lightspeedhq.com/' },
  { id: 'custom',     label: 'Custom webhook',tagline: 'Your own POS — receive food_orders updates via webhook', docUrl: '' },
]

export default function POSIntegrations({ restaurant, onBack }) {
  const [rows, setRows] = useState([])         // existing rows
  const [active, setActive] = useState(null)   // provider id being edited
  const [draft, setDraft] = useState({})
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase || !restaurant?.id) return
    const { data } = await supabase.from('pos_integrations').select('*').eq('restaurant_id', restaurant.id)
    setRows(data || [])
  }
  useEffect(() => { load() }, [restaurant?.id])

  const existing = (id) => rows.find(r => r.provider === id)

  const open = (p) => {
    const ex = existing(p.id)
    setDraft({
      provider: p.id,
      api_key: ex?.api_key || '',
      api_secret: ex?.api_secret || '',
      webhook_secret: ex?.webhook_secret || '',
      external_account_id: ex?.external_account_id || '',
      is_active: ex?.is_active ?? false,
    })
    setActive(p.id)
  }

  const save = async () => {
    if (!supabase || !restaurant?.id) return
    setMsg('Saving…')
    const payload = {
      restaurant_id: restaurant.id,
      provider:      draft.provider,
      api_key:       draft.api_key || null,
      api_secret:    draft.api_secret || null,
      webhook_secret:draft.webhook_secret || null,
      external_account_id: draft.external_account_id || null,
      is_active:     !!draft.is_active,
    }
    const { error } = await supabase.from('pos_integrations').upsert(payload, { onConflict: 'restaurant_id,provider' })
    if (error) { setMsg('Save failed: ' + error.message); return }
    setMsg('Saved.')
    setActive(null); setDraft({})
    await load()
    setTimeout(() => setMsg(''), 1500)
  }

  const disconnect = async (id) => {
    if (!window.confirm('Disconnect this POS? Stored keys will be deleted.')) return
    if (!supabase) return
    await supabase.from('pos_integrations').delete().eq('restaurant_id', restaurant.id).eq('provider', id)
    setRows(prev => prev.filter(r => r.provider !== id))
    setActive(null)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>POS Integrations</h2>
      </div>

      <div style={{ ...card, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Connect your POS</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
          Sync menu items and orders bidirectionally with your existing POS. Keys are stored encrypted on Supabase. Full sync runs through a background worker; toggle <strong>Active</strong> to enable.
        </div>
      </div>

      {PROVIDERS.map(p => {
        const ex = existing(p.id)
        const isOpen = active === p.id
        return (
          <div key={p.id} style={{ ...card, border: ex?.is_active ? `1.5px solid ${BRAND.red}` : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isOpen ? 12 : 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: ex?.is_active ? BRAND.redGlow : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ex?.is_active ? BRAND.redLight : '#fff', fontWeight: 900, fontSize: 13 }}>{p.label.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{p.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{p.tagline}</div>
              </div>
              {ex?.is_active
                ? <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>CONNECTED</span>
                : ex
                  ? <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: 'rgba(250,204,21,0.15)', color: '#FACC15' }}>SAVED</span>
                  : <button onClick={() => open(p)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: BRAND.red, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Connect</button>}
            </div>

            {!isOpen && ex && (
              <>
                {ex.last_synced_at && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Last synced: {new Date(ex.last_synced_at).toLocaleString()}</div>}
                {ex.last_sync_error && <div style={{ fontSize: 10, color: '#FCA5A5', marginTop: 4 }}>Last error: {ex.last_sync_error}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {ex.is_active && (
                    <button onClick={async () => {
                      setMsg('Syncing menu…')
                      try {
                        const { data, error } = await supabase.functions.invoke('pos-sync-menu', { body: { restaurantId: restaurant.id, provider: p.id } })
                        if (error || data?.error) setMsg(`Sync failed: ${data?.error || error?.message}`)
                        else setMsg(`Synced: ${data?.inserted || 0} added, ${data?.updated || 0} updated.`)
                        await load()
                        setTimeout(() => setMsg(''), 2500)
                      } catch (e) { setMsg('Sync error: ' + (e?.message || e)); setTimeout(() => setMsg(''), 2500) }
                    }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${BRAND.redBorder}`, background: BRAND.redGlow, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>↻ Sync menu</button>
                  )}
                  <button onClick={() => open(p)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit keys</button>
                  <button onClick={() => disconnect(p.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Disconnect</button>
                </div>
              </>
            )}

            {isOpen && (
              <>
                <span style={label}>API key</span>
                <input value={draft.api_key} onChange={e => setDraft(d => ({ ...d, api_key: e.target.value }))} type="password" placeholder="…" style={input} />
                <div style={{ height: 8 }} />
                <span style={label}>API secret</span>
                <input value={draft.api_secret} onChange={e => setDraft(d => ({ ...d, api_secret: e.target.value }))} type="password" placeholder="…" style={input} />
                <div style={{ height: 8 }} />
                <span style={label}>Webhook secret (optional)</span>
                <input value={draft.webhook_secret} onChange={e => setDraft(d => ({ ...d, webhook_secret: e.target.value }))} type="password" placeholder="…" style={input} />
                <div style={{ height: 8 }} />
                <span style={label}>External account / location ID (optional)</span>
                <input value={draft.external_account_id} onChange={e => setDraft(d => ({ ...d, external_account_id: e.target.value }))} placeholder="acc_..." style={input} />
                <div style={{ height: 10 }} />
                <button onClick={() => setDraft(d => ({ ...d, is_active: !d.is_active }))} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${draft.is_active ? BRAND.redBorder : 'rgba(255,255,255,0.1)'}`, background: draft.is_active ? BRAND.redGlow : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{draft.is_active ? '✓ Active — sync enabled' : 'Inactive (keys saved, sync paused)'}</button>
                {p.docUrl && <a href={p.docUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 11, color: BRAND.redLight, textDecoration: 'underline', marginTop: 8 }}>Where do I find these keys?</a>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setActive(null); setDraft({}) }} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={save} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: BRAND.red, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Save Connection</button>
                </div>
              </>
            )}
          </div>
        )
      })}

      {msg && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 12, background: msg.toLowerCase().includes('fail') ? '#EF4444' : BRAND.red, color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 999 }}>{msg}</div>}
    </>
  )
}
