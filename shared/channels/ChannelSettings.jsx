/**
 * <ChannelSettings /> — vendor-facing toggle UI for the channel flip.
 * Lives in each app's vendor dashboard. Reads + writes vendor.channels.
 *
 * Props:
 *   - vendor          (current vendor row; reads `channels`)
 *   - appKind         'food' | 'products' | 'services'
 *   - availableIds    optional override of which channels this app allows.
 *                     Defaults: food = ['whatsapp','chat'], products/services = all 3
 *   - onSave(channels) → persist to DB. Caller decides which table.
 *   - onBack          → close the page
 */
import React, { useState } from 'react'
import { resolveChannels, CHANNEL_META, enabledChannelIds } from './index.js'

const AVAILABLE_BY_KIND = {
  food:     ['whatsapp', 'chat'],
  products: ['whatsapp', 'chat'],
  services: ['whatsapp', 'chat'],
}

export default function ChannelSettings({ vendor, appKind = 'food', availableIds, onSave, onBack }) {
  const initial = resolveChannels(vendor, appKind)
  const allowed = availableIds || AVAILABLE_BY_KIND[appKind] || ['whatsapp', 'chat']

  const [channels, setChannels] = useState(initial)
  const [msg, setMsg] = useState('')
  const [dirty, setDirty] = useState(false)

  const set = (id, patch) => {
    setChannels((c) => ({ ...c, [id]: { ...c[id], ...patch } }))
    setDirty(true)
  }

  const handleSave = async () => {
    setMsg('Saving…')
    try {
      await onSave(channels)
      setMsg('Saved.')
      setDirty(false)
      setTimeout(() => setMsg(''), 1500)
    } catch (e) {
      setMsg('Save failed: ' + (e?.message || e))
    }
  }

  const enabledCount = enabledChannelIds(channels).filter((id) => allowed.includes(id)).length

  return (
    <div style={S.root}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn} aria-label="Back">←</button>
        <div style={S.headerTitle}>Order Channels</div>
      </div>

      <div style={S.intro}>
        <div style={S.introTitle}>How customers send you orders</div>
        <div style={S.introBody}>
          Enable one or more channels. If only one is enabled, customers go straight to it.
          If multiple are enabled, customers pick at checkout.
        </div>
      </div>

      {allowed.map((id) => {
        const meta = CHANNEL_META[id]
        const ch = channels[id] || {}
        const isOn = !!ch.enabled
        const needsPhone = id === 'whatsapp'
        const needsEmail = id === 'email'
        return (
          <div key={id} style={{ ...S.card, borderColor: isOn ? `${meta.color}55` : 'rgba(255,255,255,0.06)' }}>
            <div style={S.cardHeader}>
              <span style={{ ...S.icon, background: `${meta.color}22`, color: meta.color }}>{meta.icon}</span>
              <span style={S.cardTitle}>{meta.label}</span>
              <button onClick={() => set(id, { enabled: !isOn })} style={{
                ...S.toggle,
                background: isOn ? meta.color : 'rgba(255,255,255,0.15)',
              }}>
                <span style={{ ...S.toggleKnob, transform: `translateX(${isOn ? 22 : 2}px)` }} />
              </button>
            </div>

            {needsPhone && isOn && (
              <>
                <label style={S.label}>WhatsApp number</label>
                <input
                  type="tel"
                  value={ch.phone || ''}
                  onChange={(e) => set(id, { phone: e.target.value })}
                  placeholder="6281234567890"
                  style={S.input}
                />
                <div style={S.hint}>Country code without "+" or "00", then number. e.g. 6281234567890</div>
              </>
            )}

            {needsEmail && isOn && (
              <>
                <label style={S.label}>Order email address</label>
                <input
                  type="email"
                  value={ch.address || ''}
                  onChange={(e) => set(id, { address: e.target.value })}
                  placeholder="orders@yourshop.com"
                  style={S.input}
                />
                <div style={S.hint}>This is where customer orders will be sent.</div>
              </>
            )}
          </div>
        )
      })}

      {enabledCount === 0 && (
        <div style={S.warning}>
          ⚠️ No channels enabled. Customers won't be able to order from you.
          Turn on at least one channel above.
        </div>
      )}

      {msg && <div style={S.msg}>{msg}</div>}

      <button onClick={handleSave} disabled={!dirty || enabledCount === 0} style={{
        ...S.save,
        opacity: dirty && enabledCount > 0 ? 1 : 0.5,
        cursor: dirty && enabledCount > 0 ? 'pointer' : 'not-allowed',
      }}>{dirty ? 'Save Channels' : 'No changes'}</button>
    </div>
  )
}

const S = {
  root: { padding: 16, color: '#fff', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtn: {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 16, cursor: 'pointer',
  },
  headerTitle: { fontSize: 18, fontWeight: 900 },
  intro: {
    padding: 14, borderRadius: 14, marginBottom: 12,
    background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)',
  },
  introTitle: { fontSize: 13, fontWeight: 800, marginBottom: 6 },
  introBody: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 },
  card: {
    padding: 14, borderRadius: 14, marginBottom: 10,
    background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: 800 },
  toggle: {
    width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
    position: 'relative', padding: 0, transition: 'background 0.2s',
  },
  toggleKnob: {
    display: 'block', width: 22, height: 22, borderRadius: 11, background: '#fff',
    position: 'absolute', top: 2, transition: 'transform 0.2s',
  },
  label: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  warning: {
    padding: 12, borderRadius: 12, marginBottom: 12, fontSize: 13,
    background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.30)', color: '#FACC15',
  },
  msg: {
    padding: 10, borderRadius: 12, marginBottom: 12, fontSize: 13, textAlign: 'center',
    background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)',
  },
  save: {
    width: '100%', padding: 16, borderRadius: 14, border: 'none',
    background: '#DC2626', color: '#fff', fontSize: 15, fontWeight: 900,
  },
}
