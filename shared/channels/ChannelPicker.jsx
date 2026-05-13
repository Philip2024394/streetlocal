/**
 * <ChannelPicker /> — overlay shown when a vendor has multiple inbound
 * channels enabled. Customer picks one; the parent decides what to do
 * with it (typically: call openChannel from shared/channels/index.js).
 *
 * Headless-ish styling: uses inline styles only so it inherits the host
 * app's font and works in every one of the 5 apps regardless of their
 * CSS pipeline.
 */
import React from 'react'
import { enabledChannelIds, CHANNEL_META } from './index.js'

export default function ChannelPicker({ channels, onPick, onClose, title = 'How should we send this order?' }) {
  const ids = enabledChannelIds(channels)

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.handle} />
        <div style={S.title}>{title}</div>
        <div style={S.list}>
          {ids.map((id) => {
            const m = CHANNEL_META[id]
            return (
              <button key={id} onClick={() => onPick(id)} style={{ ...S.row, borderColor: `${m.color}33` }}>
                <span style={{ ...S.icon, background: `${m.color}22`, color: m.color }}>{m.icon}</span>
                <span style={S.label}>{m.label}</span>
                <span style={S.arrow}>›</span>
              </button>
            )
          })}
        </div>
        <button onClick={onClose} style={S.cancel}>Cancel</button>
      </div>
    </div>
  )
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 10010,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 480,
    background: '#0f0f12', color: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 20px)',
    boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none',
  },
  handle: { width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' },
  title:  { fontSize: 15, fontWeight: 800, marginBottom: 14, textAlign: 'center' },
  list:   { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 14,
    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  icon: {
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, flexShrink: 0,
  },
  label: { flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 700, color: '#fff' },
  arrow: { fontSize: 18, color: 'rgba(255,255,255,0.4)' },
  cancel: {
    width: '100%', marginTop: 12, padding: 12, borderRadius: 12,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
