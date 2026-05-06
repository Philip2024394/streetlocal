import React from 'react'

const GREEN = '#8DC63F'
const GOLD = '#FACC15'

export default function GlobalAgentBadge({ agent }) {
  if (!agent) return null

  const { name, languages = [], specialization = [], deals_closed, rating, certified } = agent

  return (
    <div style={{
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: certified ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: certified
          ? `linear-gradient(135deg, ${GOLD}33, ${GREEN}33)`
          : 'rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
      }}>
        {agent.photo
          ? <img src={agent.photo} alt={name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
          : <span>{name?.charAt(0) || 'A'}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          {certified && (
            <span style={{ color: GOLD, fontSize: 14 }} title="INDOO Certified">&#x2714;&#xFE0F;</span>
          )}
        </div>

        {/* Languages */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
          {languages.map(lang => (
            <span key={lang} style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              {lang}
            </span>
          ))}
        </div>

        {/* Specializations */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {specialization.map(spec => (
            <span key={spec} style={{
              background: `${GREEN}18`,
              color: GREEN,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ color: GOLD, fontSize: 12 }}>&#x2605;</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{rating}</span>
          </div>
        )}
        {deals_closed != null && (
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            {deals_closed} deals
          </span>
        )}
      </div>
    </div>
  )
}
