import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ADMIN_PIN = '5050'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'alerts', label: 'Alerts', icon: '🚨' },
  { id: 'users', label: 'Users', icon: '🧑' },
  { id: 'members', label: 'Subscribers', icon: '👥' },
  { id: 'payments', label: 'Payments', icon: '💰' },
  { id: 'affiliates', label: 'Affiliates', icon: '🤝' },
  { id: 'fleet', label: 'Fleet Health', icon: '🏥' },
  { id: 'tickets', label: 'Support', icon: '🎫' },
  { id: 'audit', label: 'Audit Log', icon: '📝' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const STATUS_COLOR = { pending_verification: '#F59E0B', active: '#22c55e', deactivated: '#EF4444' }
const STATUS_LABEL = { pending_verification: 'Pending', active: 'Active', deactivated: 'Deactivated' }

export default function Admin({ onClose }) {
  const [auth, setAuth] = useState(false)
  const [pin, setPin] = useState('')
  const [page, setPage] = useState('dashboard')
  const [drawer, setDrawer] = useState(false)
  const [regs, setRegs] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterApp, setFilterApp] = useState('all')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [alertForm, setAlertForm] = useState({ app_type: '', severity: 'warning', title: '', description: '' })
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [settings, setSettings] = useState({})
  const [users, setUsers] = useState([])
  const [settingsEditing, setSettingsEditing] = useState(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [affiliates, setAffiliates] = useState([])
  const [affReferrals, setAffReferrals] = useState([])
  const [affFilter, setAffFilter] = useState('all')
  const [affSearch, setAffSearch] = useState('')
  const [promoMaterials, setPromoMaterials] = useState([])
  const [promoForm, setPromoForm] = useState({ category_id: 'food', app_id: '', type: 'image', title: '', url: '', thumbnail_url: '' })
  const [promoUploading, setPromoUploading] = useState(false)
  const [fleetStatus, setFleetStatus] = useState([])
  const [fleetConfig, setFleetConfig] = useState({})
  const [fleetLogs, setFleetLogs] = useState([])
  const [tickets, setTickets] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [ticketReply, setTicketReply] = useState('')
  const [ticketReplying, setTicketReplying] = useState(null)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [regsRes, alertsRes, settingsRes, usersRes, affRes, affRefRes, promoRes, fleetRes, configRes, healthRes, resetRes, ticketsRes, auditRes] = await Promise.all([
        supabase.from('app_registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('app_alerts').select('*').order('created_at', { ascending: false }),
        supabase.from('admin_settings').select('*'),
        supabase.from('user_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_agents').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_promo_materials').select('*').order('sort_order'),
        supabase.from('vendor_status').select('*').order('last_health_check', { ascending: false }),
        supabase.from('vendor_remote_config').select('*').eq('id', 'basic_v1').single(),
        supabase.from('vendor_health_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('vendor_reset_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('vendor_support_tickets').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      ])
      if (regsRes.data) setRegs(regsRes.data)
      if (alertsRes.data) setAlerts(alertsRes.data)
      if (usersRes.data) setUsers(usersRes.data)
      if (affRes.data) setAffiliates(affRes.data)
      if (affRefRes.data) setAffReferrals(affRefRes.data)
      if (promoRes.data) setPromoMaterials(promoRes.data)
      if (fleetRes.data) setFleetStatus(fleetRes.data)
      if (configRes.data) setFleetConfig(configRes.data)
      if (healthRes.data) setFleetLogs(healthRes.data)
      if (ticketsRes.data) setTickets(ticketsRes.data)
      if (auditRes.data) setAuditLogs(auditRes.data)
      // Collect errors
      const errs = [regsRes, alertsRes, settingsRes, usersRes, affRes, affRefRes, promoRes, fleetRes, ticketsRes, auditRes].filter(r => r.error).map(r => r.error.message)
      if (errs.length > 0) setLoadError(errs.join('; '))
      if (settingsRes.data) {
        const obj = {}
        settingsRes.data.forEach(s => { obj[s.id] = s.value })
        setSettings(obj)
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load data')
    }
    setLoading(false)
  }

  // Auto-detect issues
  const autoAlerts = []
  const now = new Date()
  // Expired subscriptions
  regs.filter(r => r.status === 'active' && r.expires_at && new Date(r.expires_at) < now).forEach(r => {
    autoAlerts.push({ id: 'exp-' + r.id, severity: 'critical', title: `Subscription expired: ${r.business_name}`, description: `Expired on ${new Date(r.expires_at).toLocaleDateString()}. App still marked active.`, app_type: r.app_type, auto: true })
  })
  // Expiring within 7 days
  const weekFromNow = new Date(now.getTime() + 7 * 86400000)
  regs.filter(r => r.status === 'active' && r.expires_at && new Date(r.expires_at) > now && new Date(r.expires_at) < weekFromNow).forEach(r => {
    autoAlerts.push({ id: 'expiring-' + r.id, severity: 'warning', title: `Expiring soon: ${r.business_name}`, description: `Expires on ${new Date(r.expires_at).toLocaleDateString()}. Contact to renew.`, app_type: r.app_type, auto: true })
  })
  // Pending for more than 48 hours
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600000)
  regs.filter(r => r.status === 'pending_verification' && new Date(r.created_at) < twoDaysAgo).forEach(r => {
    autoAlerts.push({ id: 'stale-' + r.id, severity: 'warning', title: `Pending 48h+: ${r.business_name}`, description: `Registered on ${new Date(r.created_at).toLocaleDateString()}. Verify payment or follow up.`, app_type: r.app_type, auto: true })
  })

  const allAlerts = [...autoAlerts, ...alerts]
  const openAlerts = allAlerts.filter(a => a.status !== 'resolved')
  const criticalCount = openAlerts.filter(a => a.severity === 'critical').length
  const warningCount = openAlerts.filter(a => a.severity === 'warning').length

  const updateStatus = async (id, status) => {
    await supabase.from('app_registrations').update({
      status,
      verified_at: status === 'active' ? new Date().toISOString() : null
    }).eq('id', id)
    load()
  }

  useEffect(() => { if (auth) load() }, [auth])

  const [loginError, setLoginError] = useState(false)

  const checkPin = async () => {
    const { data } = await supabase.from('admin_settings').select('value').eq('id', 'admin_pin').single()
    const correctPin = data?.value || ADMIN_PIN
    if (pin === correctPin) {
      setAuth(true)
      setLoginError(false)
    } else {
      setPin('')
      setLoginError(true)
      setTimeout(() => setLoginError(false), 2000)
    }
  }

  // Login
  if (!auth) {
    return (
      <div style={s.page}>
        <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Admin Panel</h2>
          <p style={{ fontSize: 14, color: loginError ? '#EF4444' : '#888', marginBottom: 24 }}>
            {loginError ? 'Wrong PIN. Try again.' : 'Enter your PIN to continue'}
          </p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') checkPin() }}
            placeholder="••••"
            style={{ ...s.input, textAlign: 'center', fontSize: 28, letterSpacing: 12, marginBottom: 16, borderColor: loginError ? '#EF4444' : '#e0e0e0' }}
          />
          <button onClick={checkPin} style={s.btnYellow}>
            Login
          </button>
          <button onClick={onClose} style={{ ...s.btnGhost, marginTop: 8 }}>Back to Home</button>
        </div>
      </div>
    )
  }

  // Derived data
  const pending = regs.filter(r => r.status === 'pending_verification')
  const active = regs.filter(r => r.status === 'active')
  const deactivated = regs.filter(r => r.status === 'deactivated')
  const appTypes = [...new Set(regs.map(r => r.app_type))]
  const monthly = regs.filter(r => r.billing_cycle === 'monthly')
  const yearly = regs.filter(r => r.billing_cycle === 'yearly')

  // Revenue calculation
  const parsePrice = (p) => parseInt((p || '0').replace(/[^0-9]/g, ''))
  const totalRevenue = regs.filter(r => r.status === 'active').reduce((sum, r) => sum + parsePrice(r.price), 0)
  const monthlyRevenue = active.filter(r => r.billing_cycle === 'monthly').reduce((sum, r) => sum + parsePrice(r.price), 0)
  const yearlyRevenue = active.filter(r => r.billing_cycle === 'yearly').reduce((sum, r) => sum + parsePrice(r.price), 0)

  // Country detection from WhatsApp numbers
  const getCountry = (wa) => {
    if (!wa) return 'Unknown'
    const n = wa.replace(/[^0-9]/g, '')
    if (n.startsWith('62')) return '🇮🇩 Indonesia'
    if (n.startsWith('60')) return '🇲🇾 Malaysia'
    if (n.startsWith('65')) return '🇸🇬 Singapore'
    if (n.startsWith('66')) return '🇹🇭 Thailand'
    if (n.startsWith('63')) return '🇵🇭 Philippines'
    if (n.startsWith('84')) return '🇻🇳 Vietnam'
    if (n.startsWith('44')) return '🇬🇧 UK'
    if (n.startsWith('1')) return '🇺🇸 US'
    if (n.startsWith('61')) return '🇦🇺 Australia'
    return '🌍 Other'
  }

  const countryStats = regs.reduce((acc, r) => {
    const c = getCountry(r.whatsapp)
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})

  // Filtered members
  const filtered = regs.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterApp !== 'all' && r.app_type !== filterApp) return false
    if (search && !r.business_name.toLowerCase().includes(search.toLowerCase()) && !r.slug.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Days since registration
  const daysAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff}d ago`
  }

  const fmtRp = (n) => 'Rp ' + n.toLocaleString('id-ID')

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Street Local</div>
          <div style={{ fontSize: 11, color: '#FFD600', fontWeight: 700 }}>ADMIN PANEL</div>
        </div>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{ ...s.sidebarItem, ...(page === p.id ? s.sidebarItemActive : {}) }}>
            <span style={{ fontSize: 16 }}>{p.icon}</span>
            <span style={{ flex: 1 }}>{p.label}</span>
            {p.id === 'alerts' && openAlerts.length > 0 && (
              <span style={{ background: criticalCount > 0 ? '#EF4444' : '#F59E0B', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{openAlerts.length}</span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 6 }}>Back to Home</button>
          <button onClick={() => { setAuth(false) }} style={{ width: '100%', ...s.logoutBtn }}>Logout</button>
          <div style={{ fontSize: 10, color: '#444', marginTop: 8, textAlign: 'center' }}>v1.0 — streetlocal.live</div>
        </div>
      </div>

      {/* Main area */}
      <div style={s.mainArea}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.headerTitle}>{PAGES.find(p => p.id === page)?.label}</h1>
        {openAlerts.length > 0 && page !== 'alerts' && (
          <button onClick={() => setPage('alerts')} style={{ background: criticalCount > 0 ? '#EF4444' : '#F59E0B', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', animation: criticalCount > 0 ? 'pulse 1.5s infinite' : 'none' }}>
            🚨 {openAlerts.length}
          </button>
        )}
        <button onClick={() => { setAuth(false); onClose() }} style={s.logoutBtn}>Logout</button>
      </div>

      {/* Side Drawer */}
      {drawer && (
        <div style={s.drawerOverlay} onClick={() => setDrawer(false)}>
          <div style={s.drawer} onClick={e => e.stopPropagation()}>
            <div style={s.drawerHeader}>
              <span style={{ fontSize: 20, fontWeight: 900 }}>Street Local</span>
              <span style={{ fontSize: 12, color: '#FFD600' }}>ADMIN</span>
            </div>
            {PAGES.map(p => (
              <button
                key={p.id}
                onClick={() => { setPage(p.id); setDrawer(false) }}
                style={{ ...s.drawerItem, ...(page === p.id ? s.drawerItemActive : {}) }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <span style={{ flex: 1 }}>{p.label}</span>
                {p.id === 'alerts' && openAlerts.length > 0 && (
                  <span style={{ background: criticalCount > 0 ? '#EF4444' : '#F59E0B', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, animation: criticalCount > 0 ? 'pulse 1.5s infinite' : 'none' }}>
                    {openAlerts.length}
                  </span>
                )}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={s.drawerFooter}>
              <span style={{ fontSize: 11, color: '#666' }}>v1.0 — streetlocal.live</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={s.content}>

        {/* Error banner */}
        {loadError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Data Load Error</div>
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{loadError}</div>
            <button onClick={load} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>Loading...</div>}

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <>
            {/* Stats cards */}
            <div style={s.statsRow}>
              <div style={{ ...s.statCard, borderLeft: '4px solid #FFD600' }}>
                <div style={s.statNum}>{regs.length}</div>
                <div style={s.statLabel}>Total Members</div>
              </div>
              <div style={{ ...s.statCard, borderLeft: '4px solid #22c55e' }}>
                <div style={s.statNum}>{active.length}</div>
                <div style={s.statLabel}>Active</div>
              </div>
            </div>
            <div style={s.statsRow}>
              <div style={{ ...s.statCard, borderLeft: '4px solid #F59E0B' }}>
                <div style={s.statNum}>{pending.length}</div>
                <div style={s.statLabel}>Pending</div>
              </div>
              <div style={{ ...s.statCard, borderLeft: '4px solid #EF4444' }}>
                <div style={s.statNum}>{deactivated.length}</div>
                <div style={s.statLabel}>Deactivated</div>
              </div>
            </div>

            {/* Revenue */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Revenue</h3>
              <div style={{ ...s.statCard, background: '#1a1a1a', color: '#fff' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFD600' }}>{fmtRp(totalRevenue)}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Active subscriptions</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtRp(monthlyRevenue)}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Monthly</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtRp(yearlyRevenue)}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Yearly</div>
                  </div>
                </div>
              </div>
            </div>

            {/* MRR + Churn + Export */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Business Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={s.statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{fmtRp(monthlyRevenue + Math.round(yearlyRevenue / 12))}</div>
                  <div style={s.statLabel}>MRR (Monthly)</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#3B82F6' }}>{fmtRp((monthlyRevenue + Math.round(yearlyRevenue / 12)) * 12)}</div>
                  <div style={s.statLabel}>ARR (Annual)</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: regs.length > 0 ? (deactivated.length / regs.length * 100 > 10 ? '#EF4444' : '#22c55e') : '#888' }}>
                    {regs.length > 0 ? (deactivated.length / regs.length * 100).toFixed(1) : 0}%
                  </div>
                  <div style={s.statLabel}>Churn Rate</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#8B5CF6' }}>
                    {regs.length > 0 ? fmtRp(Math.round(totalRevenue / Math.max(active.length, 1))) : 'Rp 0'}
                  </div>
                  <div style={s.statLabel}>ARPU</div>
                </div>
              </div>

              {/* 30-day signups vs churns */}
              {(() => {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
                const newSignups = regs.filter(r => new Date(r.created_at) > thirtyDaysAgo).length
                const recentChurns = regs.filter(r => r.status === 'deactivated' && r.updated_at && new Date(r.updated_at) > thirtyDaysAgo).length
                return (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, padding: 10, borderRadius: 10, background: '#F0FDF4', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>+{newSignups}</div>
                      <div style={{ fontSize: 11, color: '#065F46' }}>New (30 days)</div>
                    </div>
                    <div style={{ flex: 1, padding: 10, borderRadius: 10, background: '#FEF2F2', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#EF4444' }}>-{recentChurns}</div>
                      <div style={{ fontSize: 11, color: '#991B1B' }}>Churned (30 days)</div>
                    </div>
                    <div style={{ flex: 1, padding: 10, borderRadius: 10, background: '#EFF6FF', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#1E40AF' }}>{newSignups - recentChurns >= 0 ? '+' : ''}{newSignups - recentChurns}</div>
                      <div style={{ fontSize: 11, color: '#1E40AF' }}>Net Growth</div>
                    </div>
                  </div>
                )
              })()}

              {/* CSV Export */}
              <button onClick={() => {
                const headers = 'Business Name,App Type,Status,Billing,Price,WhatsApp,Created\n'
                const rows = regs.map(r => `"${r.business_name || ''}","${r.app_type || ''}","${r.status || ''}","${r.billing_cycle || ''}","${r.price || ''}","${r.whatsapp || ''}","${r.created_at || ''}"`).join('\n')
                const blob = new Blob([headers + rows], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `streetlocal-vendors-${new Date().toISOString().slice(0,10)}.csv`; a.click()
              }} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                📊 Export Vendors CSV
              </button>
            </div>

            {/* App breakdown */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>By App Type</h3>
              {appTypes.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No data yet</p>}
              {appTypes.map(type => {
                const count = regs.filter(r => r.app_type === type).length
                const activeCount = regs.filter(r => r.app_type === type && r.status === 'active').length
                return (
                  <div key={type} style={s.appTypeRow}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{type === 'basic' ? 'FoodLocal' : type === 'pro' ? 'Food Pro' : type}</span>
                      <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{activeCount} active</span>
                    </div>
                    <span style={s.badge}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Recent signups */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Recent Signups</h3>
              {pending.length === 0 && active.slice(0, 3).length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No registrations yet</p>}
              {[...pending, ...active].slice(0, 5).map(r => (
                <div key={r.id} style={s.miniCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{r.business_name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.app_tier} — {daysAgo(r.created_at)}</div>
                  </div>
                  <span style={{ ...s.statusDot, background: STATUS_COLOR[r.status] }} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ALERTS ── */}
        {page === 'alerts' && (
          <>
            {/* Alert stats */}
            <div style={s.statsRow}>
              <div style={{ ...s.statCard, borderLeft: '4px solid #EF4444', background: criticalCount > 0 ? '#fef2f2' : '#fff' }}>
                <div style={{ ...s.statNum, color: '#EF4444' }}>{criticalCount}</div>
                <div style={s.statLabel}>Critical</div>
              </div>
              <div style={{ ...s.statCard, borderLeft: '4px solid #F59E0B' }}>
                <div style={{ ...s.statNum, color: '#F59E0B' }}>{warningCount}</div>
                <div style={s.statLabel}>Warnings</div>
              </div>
              <div style={{ ...s.statCard, borderLeft: '4px solid #22c55e' }}>
                <div style={{ ...s.statNum, color: '#22c55e' }}>{alerts.filter(a => a.status === 'resolved').length}</div>
                <div style={s.statLabel}>Resolved</div>
              </div>
            </div>

            {/* Create alert button */}
            <button onClick={() => setShowAlertForm(!showAlertForm)} style={{ ...s.btnYellow, marginBottom: 16 }}>
              {showAlertForm ? '✕ Cancel' : '+ Log New Issue'}
            </button>

            {/* Alert form */}
            {showAlertForm && (
              <div style={{ ...s.memberCard, border: '2px solid #FFD600', marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Log Issue</h4>
                <select
                  value={alertForm.severity}
                  onChange={e => setAlertForm({ ...alertForm, severity: e.target.value })}
                  style={{ ...s.input, marginBottom: 10 }}
                >
                  <option value="critical">🔴 Critical — App down / broken</option>
                  <option value="warning">🟡 Warning — Bug / needs fix</option>
                  <option value="info">🔵 Info — Needs investigation</option>
                </select>
                <select
                  value={alertForm.app_type}
                  onChange={e => setAlertForm({ ...alertForm, app_type: e.target.value })}
                  style={{ ...s.input, marginBottom: 10 }}
                >
                  <option value="">Select app...</option>
                  <option value="food-basic">FoodLocal</option>
                  <option value="food-pro">Food Pro (Restaurant)</option>
                  <option value="landing">Landing Page (streetlocal.live)</option>
                  <option value="admin">Admin Dashboard</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={e => setAlertForm({ ...alertForm, title: e.target.value })}
                  placeholder="e.g. Menu not loading for Warung Sari"
                  style={{ ...s.input, marginBottom: 10 }}
                />
                <textarea
                  value={alertForm.description}
                  onChange={e => setAlertForm({ ...alertForm, description: e.target.value })}
                  placeholder="What happened? Steps to reproduce, affected users, etc."
                  rows={3}
                  style={{ ...s.input, resize: 'vertical', marginBottom: 10 }}
                />
                <button
                  onClick={async () => {
                    if (!alertForm.title || !alertForm.app_type) return
                    await supabase.from('app_alerts').insert({
                      app_type: alertForm.app_type,
                      severity: alertForm.severity,
                      title: alertForm.title,
                      description: alertForm.description,
                      reported_by: 'admin',
                      status: 'open',
                    })
                    setAlertForm({ app_type: '', severity: 'warning', title: '', description: '' })
                    setShowAlertForm(false)
                    load()
                  }}
                  style={s.btnYellow}
                >
                  Log Issue
                </button>
              </div>
            )}

            {/* Open alerts */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Active Issues ({openAlerts.length})</h3>
              {openAlerts.map(alert => {
                const sevColor = alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : '#3B82F6'
                const sevIcon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'
                return (
                  <div key={alert.id} style={{ ...s.memberCard, borderLeft: `4px solid ${sevColor}`, animation: alert.severity === 'critical' ? 'pulse 2s infinite' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{sevIcon}</span>
                        <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{alert.title}</h4>
                      </div>
                      {alert.auto && <span style={{ fontSize: 10, fontWeight: 700, color: '#888', background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                    </div>
                    {alert.description && <p style={{ fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 1.5 }}>{alert.description}</p>}
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                      <span>App: {alert.app_type}</span>
                      {alert.created_at && <span> — {new Date(alert.created_at).toLocaleDateString()}</span>}
                    </div>
                    {!alert.auto && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={async () => {
                            await supabase.from('app_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: 'admin' }).eq('id', alert.id)
                            load()
                          }}
                          style={s.btnGreen}
                        >
                          ✓ Resolve
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.from('app_alerts').delete().eq('id', alert.id)
                            load()
                          }}
                          style={s.btnRed}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              {openAlerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>✅</span>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>All clear — no issues</p>
                  <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>All apps running smoothly</p>
                </div>
              )}
            </div>

            {/* Resolved alerts */}
            {alerts.filter(a => a.status === 'resolved').length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Resolved</h3>
                {alerts.filter(a => a.status === 'resolved').map(alert => (
                  <div key={alert.id} style={{ ...s.memberCard, opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span>✅</span>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, textDecoration: 'line-through' }}>{alert.title}</h4>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {alert.app_type} — Resolved {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── USERS (Accounts) ── */}
        {page === 'users' && (
          <>
            <div style={s.statsRow}>
              <div style={{ ...s.statCard, borderLeft: '4px solid #3B82F6' }}>
                <div style={s.statNum}>{users.length}</div>
                <div style={s.statLabel}>Total Users</div>
              </div>
              <div style={{ ...s.statCard, borderLeft: '4px solid #FFD600' }}>
                <div style={s.statNum}>{[...new Set(users.map(u => u.country_code))].length}</div>
                <div style={s.statLabel}>Countries</div>
              </div>
            </div>

            {/* Country breakdown */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>By Country</h3>
              {Object.entries(users.reduce((acc, u) => { const c = u.country_name || u.country_code || 'Unknown'; acc[c] = (acc[c] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                <div key={country} style={s.appTypeRow}>
                  <span style={{ fontSize: 14 }}>{country}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: Math.max(20, users.length > 0 ? count / users.length * 120 : 20), height: 8, borderRadius: 4, background: '#3B82F6' }} />
                    <span style={s.badge}>{count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* User list */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>All Users ({users.length})</h3>
              {users.map(u => (
                <div key={u.id} style={s.memberCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f0f0f0' }}>
                      {u.country_name || u.country_code || '?'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 6, display: 'flex', gap: 12 }}>
                    <span>📱 {u.phone}</span>
                    <span>📅 {new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>No users yet</p>}
            </div>
          </>
        )}

        {/* ── MEMBERS ── */}
        {page === 'members' && (
          <>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search business name or URL..."
              style={{ ...s.input, marginBottom: 12 }}
            />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {['all', 'pending_verification', 'active', 'deactivated'].map(st => (
                <button key={st} onClick={() => setFilterStatus(st)} style={{ ...s.filterBtn, ...(filterStatus === st ? s.filterBtnActive : {}) }}>
                  {st === 'all' ? 'All' : STATUS_LABEL[st]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setFilterApp('all')} style={{ ...s.filterBtn, ...(filterApp === 'all' ? s.filterBtnActive : {}) }}>All Apps</button>
              {appTypes.map(type => (
                <button key={type} onClick={() => setFilterApp(type)} style={{ ...s.filterBtn, ...(filterApp === type ? s.filterBtnActive : {}) }}>
                  {type === 'basic' ? 'FoodLocal' : type === 'pro' ? 'Food Pro' : type}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{filtered.length} members</div>

            {/* Member cards */}
            {filtered.map(reg => (
              <div key={reg.id} style={s.memberCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{reg.business_name}</h3>
                    <p style={{ fontSize: 12, color: '#FFD600', margin: '2px 0', fontWeight: 700 }}>streetlocal.live/{reg.slug}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: STATUS_COLOR[reg.status] + '20', color: STATUS_COLOR[reg.status] }}>
                    {STATUS_LABEL[reg.status] || reg.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                  <div>📱 {reg.whatsapp}</div>
                  <div>{getCountry(reg.whatsapp)}</div>
                  {reg.email && <div>📧 {reg.email}</div>}
                  <div>📦 {reg.app_tier}</div>
                  <div>💳 {reg.price || 'N/A'} ({reg.billing_cycle || 'monthly'})</div>
                  <div>📅 {new Date(reg.created_at).toLocaleDateString()}</div>
                  {reg.expires_at && <div>⏰ Exp: {new Date(reg.expires_at).toLocaleDateString()}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {reg.status !== 'active' && (
                    <button onClick={() => updateStatus(reg.id, 'active')} style={s.btnGreen}>✓ Confirm</button>
                  )}
                  {reg.status !== 'deactivated' && (
                    <button onClick={() => updateStatus(reg.id, 'deactivated')} style={s.btnRed}>✕ Deactivate</button>
                  )}
                  <a href={`https://wa.me/${reg.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={s.btnWhatsApp}>💬</a>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>No members found</p>}
          </>
        )}

        {/* ── PAYMENTS ── */}
        {page === 'payments' && (() => {
          const pendingPayments = regs.filter(r => r.status === 'pending_verification')
          const expiringIn7 = regs.filter(r => r.status === 'active' && r.expires_at && new Date(r.expires_at) > new Date() && new Date(r.expires_at) < new Date(Date.now() + 7 * 86400000))
          const expired = regs.filter(r => r.status === 'active' && r.expires_at && new Date(r.expires_at) < new Date())

          async function verifyPayment(id) {
            const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString()
            await supabase.from('app_registrations').update({ status: 'active', verified_at: new Date().toISOString(), expires_at: expiresAt }).eq('id', id)
            await supabase.from('admin_audit_log').insert({ action: 'payment_verified', target_type: 'vendor', target_id: id, details: { expires_at: expiresAt } })
            load()
          }

          async function rejectPayment(id) {
            await supabase.from('app_registrations').update({ status: 'deactivated' }).eq('id', id)
            await supabase.from('admin_audit_log').insert({ action: 'payment_rejected', target_type: 'vendor', target_id: id })
            load()
          }

          async function renewSubscription(id) {
            const reg = regs.find(r => r.id === id)
            const currentExpiry = reg?.expires_at ? new Date(reg.expires_at) : new Date()
            const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + 30 * 86400000).toISOString()
            await supabase.from('app_registrations').update({ status: 'active', expires_at: newExpiry, verified_at: new Date().toISOString() }).eq('id', id)
            await supabase.from('admin_audit_log').insert({ action: 'payment_verified', target_type: 'vendor', target_id: id, details: { renewal: true, new_expiry: newExpiry } })
            load()
          }

          function sendBillingReminder(reg) {
            const msg = encodeURIComponent(`Hi ${reg.business_name}! Your Street Local subscription ${reg.expires_at && new Date(reg.expires_at) < new Date() ? 'has expired' : 'is expiring soon'}. Please renew to keep your food ordering app active. Thank you!`)
            const wa = reg.whatsapp?.replace(/[^0-9]/g, '')
            if (wa) window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
          }

          function bulkSendReminders(list) {
            list.forEach((reg, i) => {
              setTimeout(() => sendBillingReminder(reg), i * 1500)
            })
            supabase.from('admin_audit_log').insert({ action: 'billing_reminder', target_type: 'bulk', target_id: 'all', details: { count: list.length } })
          }

          return (
            <>
              {/* Revenue summary */}
              <div style={s.statsRow}>
                <div style={{ ...s.statCard, borderLeft: '4px solid #22c55e' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{fmtRp(totalRevenue)}</div>
                  <div style={s.statLabel}>Total Active Revenue</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={s.statCard}>
                  <div style={s.statNum}>{monthly.length}</div>
                  <div style={s.statLabel}>Monthly</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statNum}>{yearly.length}</div>
                  <div style={s.statLabel}>Yearly</div>
                </div>
                <div style={{ ...s.statCard, borderLeft: pendingPayments.length > 0 ? '3px solid #F59E0B' : 'none' }}>
                  <div style={{ ...s.statNum, color: pendingPayments.length > 0 ? '#F59E0B' : '#888' }}>{pendingPayments.length}</div>
                  <div style={s.statLabel}>Pending</div>
                </div>
              </div>

              {/* Pending Payment Verification */}
              {pendingPayments.length > 0 && (
                <div style={s.section}>
                  <h3 style={{ ...s.sectionTitle, color: '#F59E0B' }}>Pending Verification ({pendingPayments.length})</h3>
                  {pendingPayments.map(reg => (
                    <div key={reg.id} style={{ ...s.memberCard, borderLeft: '4px solid #F59E0B', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{reg.business_name}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{reg.app_tier} — {reg.billing_cycle || 'monthly'} — {reg.price || 'N/A'}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>Registered {daysAgo(reg.created_at)} | {getCountry(reg.whatsapp)}</div>
                        </div>
                      </div>
                      {reg.payment_proof && (
                        <div style={{ marginBottom: 8 }}>
                          <img src={reg.payment_proof} alt="Payment proof" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #e0e0e0' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => verifyPayment(reg.id)} style={{ ...s.btnGreen, flex: 1 }}>Verify & Activate</button>
                        <button onClick={() => rejectPayment(reg.id)} style={{ ...s.btnRed, flex: 1 }}>Reject</button>
                        {reg.whatsapp && (
                          <a href={`https://wa.me/${reg.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi! We received your payment for Street Local. Can you confirm the amount and date of transfer?')}`} target="_blank" rel="noopener noreferrer" style={{ ...s.btnWhatsApp, flex: 0 }}>💬</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Billing Reminders — Expiring & Expired */}
              {(expiringIn7.length > 0 || expired.length > 0) && (
                <div style={s.section}>
                  <h3 style={{ ...s.sectionTitle, color: '#EF4444' }}>Billing Reminders</h3>

                  {expired.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>Expired ({expired.length})</div>
                      {expired.map(reg => (
                        <div key={reg.id} style={{ ...s.miniCard, borderLeft: '3px solid #EF4444', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 800 }}>{reg.business_name}</span>
                            <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Expired {daysAgo(reg.expires_at)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => sendBillingReminder(reg)} style={{ ...s.filterBtn, background: '#25D366', color: '#fff', fontSize: 11, flex: 1 }}>Send Reminder</button>
                            <button onClick={() => renewSubscription(reg.id)} style={{ ...s.filterBtn, background: '#22c55e', color: '#fff', fontSize: 11, flex: 1 }}>Renew +30 days</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {expiringIn7.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', marginBottom: 6 }}>Expiring Soon ({expiringIn7.length})</div>
                      {expiringIn7.map(reg => {
                        const daysLeft = Math.ceil((new Date(reg.expires_at) - Date.now()) / 86400000)
                        return (
                          <div key={reg.id} style={{ ...s.miniCard, borderLeft: '3px solid #F59E0B', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 800 }}>{reg.business_name}</span>
                              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => sendBillingReminder(reg)} style={{ ...s.filterBtn, background: '#25D366', color: '#fff', fontSize: 11, flex: 1 }}>Send Reminder</button>
                              <button onClick={() => renewSubscription(reg.id)} style={{ ...s.filterBtn, background: '#22c55e', color: '#fff', fontSize: 11, flex: 1 }}>Renew +30 days</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Bulk action */}
                  {(expired.length + expiringIn7.length) > 1 && (
                    <button onClick={() => { if (confirm(`Send WhatsApp reminder to ${expired.length + expiringIn7.length} vendors?`)) bulkSendReminders([...expired, ...expiringIn7]) }} style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      📨 Bulk Send Reminders ({expired.length + expiringIn7.length} vendors)
                    </button>
                  )}
                </div>
              )}

              {/* All subscriptions */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>All Subscriptions</h3>
                {regs.map(reg => (
                  <div key={reg.id} style={{ ...s.miniCard, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{reg.business_name}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: reg.status === 'active' ? '#22c55e' : '#F59E0B' }}>{reg.price || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                      <span>{reg.app_tier} — {reg.billing_cycle || 'monthly'}</span>
                      <span>{STATUS_LABEL[reg.status]}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                      <span>Registered: {new Date(reg.created_at).toLocaleDateString()}</span>
                      {reg.expires_at && <span style={{ color: new Date(reg.expires_at) < new Date() ? '#EF4444' : '#888' }}>Expires: {new Date(reg.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
                {regs.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No payments yet</p>}
              </div>
            </>
          )
        })()}

        {/* ── AFFILIATES ── */}
        {page === 'affiliates' && (() => {
          const AGENT_STATUS_COLOR = { pending_payment: '#9CA3AF', pending_verification: '#F59E0B', active: '#22c55e', suspended: '#EF4444' }
          const AGENT_STATUS_LABEL = { pending_payment: 'Awaiting Payment', pending_verification: 'Pending Verify', active: 'Active', suspended: 'Suspended' }
          const VERIFY_COLOR = { submitted: '#3B82F6', verified: '#22c55e' }
          const filtered = affiliates.filter(a => {
            if (affFilter !== 'all' && a.status !== affFilter) return false
            if (affSearch && !a.name?.toLowerCase().includes(affSearch.toLowerCase()) && !a.agent_code?.toLowerCase().includes(affSearch.toLowerCase()) && !a.whatsapp?.includes(affSearch)) return false
            return true
          })
          const totalActive = affiliates.filter(a => a.status === 'active').length
          const totalPending = affiliates.filter(a => a.status === 'pending_verification').length
          const pendingVerify = affiliates.filter(a => a.verification_status === 'submitted' && a.verification_status !== 'verified').length
          const totalCommissions = affReferrals.reduce((s, r) => s + (r.commission_amount || 0), 0)

          async function updateAgentStatus(id, status) {
            await supabase.from('affiliate_agents').update({ status }).eq('id', id)
            setAffiliates(affiliates.map(a => a.id === id ? { ...a, status } : a))
          }
          async function verifyAgent(id) {
            await supabase.from('affiliate_agents').update({ verification_status: 'verified' }).eq('id', id)
            setAffiliates(affiliates.map(a => a.id === id ? { ...a, verification_status: 'verified' } : a))
          }

          return (
            <>
              {/* Seats remaining */}
              <div style={{ ...s.section, background: '#1a1a1a', border: 'none', marginBottom: 16, borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Indonesia Seats</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FFD600' }}>{1000 - affiliates.filter(a => a.country === 'ID' && a.status !== 'cancelled').length} / 1,000</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Filled</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FF6B35' }}>{affiliates.filter(a => a.country === 'ID' && a.status !== 'cancelled').length}</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={s.statCard}><div style={s.statNum}>{affiliates.length}</div><div style={s.statLabel}>Total Agents</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#22c55e' }}>{totalActive}</div><div style={s.statLabel}>Active</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#F59E0B' }}>{totalPending}</div><div style={s.statLabel}>Pending Payment</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#3B82F6' }}>{pendingVerify}</div><div style={s.statLabel}>Pending KTP Verify</div></div>
              </div>

              {/* Total commissions */}
              <div style={{ ...s.section, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#065F46', fontWeight: 700 }}>Total Commissions Owed</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>Rp {totalCommissions.toLocaleString()}</div>
              </div>

              {/* Filters */}
              <div style={s.section}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {['all', 'pending_payment', 'pending_verification', 'active', 'suspended'].map(f => (
                    <button key={f} onClick={() => setAffFilter(f)} style={{ ...s.filterBtn, background: affFilter === f ? '#1a1a1a' : '#f0f0f0', color: affFilter === f ? '#fff' : '#666' }}>
                      {f === 'all' ? 'All' : AGENT_STATUS_LABEL[f] || f}
                    </button>
                  ))}
                </div>
                <input style={{ ...s.input, marginBottom: 0 }} placeholder="Search name, code, or WhatsApp..." value={affSearch} onChange={e => setAffSearch(e.target.value)} />
              </div>

              {/* Agent List */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Agents ({filtered.length})</h3>
                {filtered.map(agent => {
                  const agentRefs = affReferrals.filter(r => r.agent_id === agent.id)
                  const agentEarnings = agentRefs.reduce((s, r) => s + (r.commission_amount || 0), 0)
                  return (
                    <div key={agent.id} style={{ padding: 14, background: '#FAFAFA', borderRadius: 14, border: '1px solid #f0f0f0', marginBottom: 10 }}>
                      {/* Agent info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{agent.name}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{agent.agent_code} — {agent.country}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>WA: {agent.whatsapp}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: AGENT_STATUS_COLOR[agent.status] || '#999', padding: '3px 8px', borderRadius: 6 }}>
                            {AGENT_STATUS_LABEL[agent.status] || agent.status}
                          </span>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span>Referrals: <strong>{agentRefs.length}</strong></span>
                        <span>Earnings: <strong style={{ color: '#22c55e' }}>Rp {agentEarnings.toLocaleString()}</strong></span>
                        <span>Clicks: <strong>{agent.total_clicks || 0}</strong></span>
                      </div>

                      {/* Verification status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, color: VERIFY_COLOR[agent.verification_status] || '#999' }}>
                          KTP: {agent.verification_status === 'verified' ? 'Verified' : agent.verification_status === 'submitted' ? 'Submitted' : 'Not submitted'}
                        </span>
                        {agent.bank_name && <span style={{ color: '#888' }}>| Bank: {agent.bank_name} — {agent.bank_account}</span>}
                      </div>

                      {/* KTP preview */}
                      {agent.ktp_url && (
                        <div style={{ marginBottom: 10 }}>
                          <a href={agent.ktp_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700 }}>View KTP Photo</a>
                        </div>
                      )}

                      {/* Payment proof */}
                      {agent.payment_proof && (
                        <div style={{ marginBottom: 10 }}>
                          <a href={agent.payment_proof} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700 }}>View Payment Proof</a>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {agent.status === 'pending_verification' && (
                          <button onClick={() => updateAgentStatus(agent.id, 'active')} style={{ ...s.filterBtn, background: '#22c55e', color: '#fff', fontSize: 11 }}>Activate</button>
                        )}
                        {agent.status === 'pending_payment' && (
                          <button onClick={() => updateAgentStatus(agent.id, 'pending_verification')} style={{ ...s.filterBtn, background: '#F59E0B', color: '#fff', fontSize: 11 }}>Mark Paid</button>
                        )}
                        {agent.status === 'active' && (
                          <button onClick={() => updateAgentStatus(agent.id, 'suspended')} style={{ ...s.filterBtn, background: '#EF4444', color: '#fff', fontSize: 11 }}>Suspend</button>
                        )}
                        {agent.status === 'suspended' && (
                          <button onClick={() => updateAgentStatus(agent.id, 'active')} style={{ ...s.filterBtn, background: '#22c55e', color: '#fff', fontSize: 11 }}>Reactivate</button>
                        )}
                        {agent.verification_status === 'submitted' && agent.verification_status !== 'verified' && (
                          <button onClick={() => verifyAgent(agent.id)} style={{ ...s.filterBtn, background: '#3B82F6', color: '#fff', fontSize: 11 }}>Verify KTP</button>
                        )}
                      </div>

                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 8 }}>Joined: {new Date(agent.created_at).toLocaleDateString()}</div>
                    </div>
                  )
                })}
                {filtered.length === 0 && <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: 20 }}>No agents found</p>}
              </div>

              {/* Recent Referrals */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Recent Referrals</h3>
                {affReferrals.slice(0, 20).map((ref, i) => {
                  const agent = affiliates.find(a => a.id === ref.agent_id)
                  return (
                    <div key={i} style={{ padding: 10, background: '#FAFAFA', borderRadius: 10, border: '1px solid #f0f0f0', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{ref.customer_name || 'User'}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>via {agent?.agent_code || 'unknown'} — {ref.app_type || 'App'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>Rp {(ref.commission_amount || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: ref.status === 'paid' ? '#22c55e' : '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>{ref.status}</div>
                      </div>
                    </div>
                  )
                })}
                {affReferrals.length === 0 && <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: 20 }}>No referrals yet</p>}
              </div>

              {/* Promo Materials Management */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Promo Materials (Share Kit)</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Upload banners and videos that agents can share. Assigned by category or specific app.</p>

                {/* Add new promo form */}
                <div style={{ background: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 16, border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Add New Material</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <select style={{ ...s.input, flex: 1, marginBottom: 0, minWidth: 100 }} value={promoForm.category_id} onChange={e => setPromoForm({ ...promoForm, category_id: e.target.value })}>
                      <option value="food">Food</option>
                      <option value="property">Property</option>
                      <option value="general">General</option>
                    </select>
                    <select style={{ ...s.input, flex: 1, marginBottom: 0, minWidth: 100 }} value={promoForm.app_id} onChange={e => setPromoForm({ ...promoForm, app_id: e.target.value })}>
                      <option value="">All apps in category</option>
                      <option value="basic">FoodLocal</option>
                      <option value="pro">Restaurant Pro</option>
                    </select>
                    <select style={{ ...s.input, flex: 1, marginBottom: 0, minWidth: 80 }} value={promoForm.type} onChange={e => setPromoForm({ ...promoForm, type: e.target.value })}>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <input style={{ ...s.input, marginBottom: 8 }} placeholder="Title (optional)" value={promoForm.title} onChange={e => setPromoForm({ ...promoForm, title: e.target.value })} />
                  <input style={{ ...s.input, marginBottom: 8 }} placeholder="File URL (image or video link)" value={promoForm.url} onChange={e => setPromoForm({ ...promoForm, url: e.target.value })} />
                  {promoForm.type === 'video' && (
                    <input style={{ ...s.input, marginBottom: 8 }} placeholder="Thumbnail URL (optional)" value={promoForm.thumbnail_url} onChange={e => setPromoForm({ ...promoForm, thumbnail_url: e.target.value })} />
                  )}
                  {/* File upload option */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ padding: '8px 14px', borderRadius: 8, background: '#e0e0e0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Upload File
                      <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        setPromoUploading(true)
                        const ext = file.name.split('.').pop()
                        const path = `promo-materials/${Date.now()}.${ext}`
                        const { error: upErr } = await supabase.storage.from('images').upload(path, file, { contentType: file.type })
                        if (!upErr) {
                          const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
                          setPromoForm({ ...promoForm, url: urlData?.publicUrl || '' })
                        }
                        setPromoUploading(false)
                      }} />
                    </label>
                    {promoUploading && <span style={{ fontSize: 12, color: '#888' }}>Uploading...</span>}
                    {promoForm.url && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>File ready</span>}
                  </div>
                  <button
                    onClick={async () => {
                      if (!promoForm.url) return
                      const { data } = await supabase.from('affiliate_promo_materials').insert({
                        category_id: promoForm.category_id,
                        app_id: promoForm.app_id || null,
                        type: promoForm.type,
                        title: promoForm.title || null,
                        url: promoForm.url,
                        thumbnail_url: promoForm.thumbnail_url || null,
                        sort_order: promoMaterials.length,
                        active: true,
                      }).select().single()
                      if (data) setPromoMaterials([...promoMaterials, data])
                      setPromoForm({ category_id: 'food', app_id: '', type: 'image', title: '', url: '', thumbnail_url: '' })
                    }}
                    style={{ ...s.filterBtn, background: '#22c55e', color: '#fff', width: '100%', padding: 10 }}
                    disabled={!promoForm.url}
                  >
                    Add Material
                  </button>
                </div>

                {/* Existing materials list */}
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Current Materials ({promoMaterials.length})</div>
                {promoMaterials.map(promo => (
                  <div key={promo.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#FAFAFA', borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 8 }}>
                    {/* Thumbnail */}
                    {promo.type === 'image' ? (
                      <img src={promo.url} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 50, height: 50, borderRadius: 8, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 18 }}>🎬</span>
                      </div>
                    )}
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{promo.title || '(No title)'}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{promo.category_id}{promo.app_id ? ` > ${promo.app_id}` : ''} — {promo.type}</div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={async () => {
                        await supabase.from('affiliate_promo_materials').update({ active: !promo.active }).eq('id', promo.id)
                        setPromoMaterials(promoMaterials.map(p => p.id === promo.id ? { ...p, active: !p.active } : p))
                      }} style={{ ...s.filterBtn, fontSize: 10, padding: '4px 8px', background: promo.active ? '#22c55e' : '#999', color: '#fff' }}>
                        {promo.active ? 'ON' : 'OFF'}
                      </button>
                      <button onClick={async () => {
                        await supabase.from('affiliate_promo_materials').delete().eq('id', promo.id)
                        setPromoMaterials(promoMaterials.filter(p => p.id !== promo.id))
                      }} style={{ ...s.filterBtn, fontSize: 10, padding: '4px 8px', background: '#EF4444', color: '#fff' }}>
                        Del
                      </button>
                    </div>
                  </div>
                ))}
                {promoMaterials.length === 0 && <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 16 }}>No materials uploaded yet</p>}
              </div>
            </>
          )
        })()}

        {/* ── ANALYTICS ── */}
        {/* ── FLEET HEALTH ── */}
        {page === 'fleet' && (() => {
          const healthy = fleetStatus.filter(v => v.current_status === 'healthy').length
          const warning = fleetStatus.filter(v => v.current_status === 'warning').length
          const errors = fleetStatus.filter(v => v.current_status === 'error' || v.current_status === 'critical').length
          const needsAttention = fleetStatus.filter(v => v.needs_attention)
          const total = fleetStatus.length

          async function resetVendorTheme(vendorId, themeId, accentColor) {
            await supabase.from('vendor_status').upsert({ vendor_id: vendorId, force_reset: true, reset_theme: themeId || 'noodle', reset_accent: accentColor || '#8B0000' }, { onConflict: 'vendor_id' })
            await supabase.from('vendor_reset_log').insert({ vendor_id: vendorId, reset_type: 'theme', previous_theme: fleetStatus.find(v => v.vendor_id === vendorId)?.theme_id, new_theme: themeId || 'noodle' })
            setFleetStatus(fleetStatus.map(v => v.vendor_id === vendorId ? { ...v, force_reset: true, needs_attention: false } : v))
          }

          async function resetAllThemes() {
            for (const v of fleetStatus) {
              await supabase.from('vendor_status').update({ force_reset: true, reset_theme: 'noodle', reset_accent: '#8B0000' }).eq('vendor_id', v.vendor_id)
            }
            alert('Reset pushed to all vendors. They will update on next app load.')
            load()
          }

          async function toggleMaintenance() {
            const newMode = !fleetConfig.maintenance_mode
            await supabase.from('vendor_remote_config').update({ maintenance_mode: newMode, updated_at: new Date().toISOString() }).eq('id', 'basic_v1')
            setFleetConfig({ ...fleetConfig, maintenance_mode: newMode })
          }

          return (
            <>
              {/* Health overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={s.statCard}><div style={s.statNum}>{total}</div><div style={s.statLabel}>Total</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#22c55e' }}>{healthy}</div><div style={s.statLabel}>Healthy</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#F59E0B' }}>{warning}</div><div style={s.statLabel}>Warning</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#EF4444' }}>{errors}</div><div style={s.statLabel}>Errors</div></div>
              </div>

              {/* Remote config controls */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Remote Controls</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button onClick={toggleMaintenance} style={{ ...s.filterBtn, background: fleetConfig.maintenance_mode ? '#EF4444' : '#22c55e', color: '#fff' }}>
                    {fleetConfig.maintenance_mode ? '🔴 Maintenance ON' : '🟢 Maintenance OFF'}
                  </button>
                  <button onClick={resetAllThemes} style={{ ...s.filterBtn, background: '#F59E0B', color: '#fff' }}>
                    🔄 Reset All Themes
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  App Version: <strong>{fleetConfig.app_version || '1.0.0'}</strong> |
                  Last Config Update: <strong>{fleetConfig.updated_at ? new Date(fleetConfig.updated_at).toLocaleString() : 'Never'}</strong>
                </div>
              </div>

              {/* Needs attention */}
              {needsAttention.length > 0 && (
                <div style={s.section}>
                  <h3 style={{ ...s.sectionTitle, color: '#EF4444' }}>⚠️ Needs Attention ({needsAttention.length})</h3>
                  {needsAttention.map(v => (
                    <div key={v.vendor_id} style={{ padding: 12, background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{v.vendor_id.slice(0, 8)}...</div>
                          <div style={{ fontSize: 11, color: '#888' }}>Theme: {v.theme_id} | Errors: {v.error_count} | Items: {v.menu_count}</div>
                        </div>
                        <button onClick={() => resetVendorTheme(v.vendor_id)} style={{ ...s.filterBtn, background: '#EF4444', color: '#fff', fontSize: 11 }}>Reset Theme</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All vendors */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>All Vendors ({total})</h3>
                {fleetStatus.map(v => {
                  const statusColor = v.current_status === 'healthy' ? '#22c55e' : v.current_status === 'warning' ? '#F59E0B' : '#EF4444'
                  return (
                    <div key={v.vendor_id} style={{ padding: 10, background: '#FAFAFA', borderRadius: 10, border: '1px solid #f0f0f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: statusColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{v.vendor_id.slice(0, 12)}...</div>
                        <div style={{ fontSize: 10, color: '#888' }}>
                          v{v.app_version} | {v.theme_id} | {v.menu_count} items | {v.last_health_check ? new Date(v.last_health_check).toLocaleString() : 'Never'}
                        </div>
                      </div>
                      {v.force_reset && <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>Resetting...</span>}
                      <button onClick={() => resetVendorTheme(v.vendor_id)} style={{ ...s.filterBtn, fontSize: 10, padding: '3px 8px', background: '#f0f0f0', color: '#555' }}>Reset</button>
                    </div>
                  )
                })}
                {fleetStatus.length === 0 && <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>No vendor health data yet</p>}
              </div>

              {/* Recent Health Logs */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Recent Health Reports ({fleetLogs.length})</h3>
                {fleetLogs.slice(0, 20).map((log, i) => (
                  <div key={i} style={{ padding: 8, background: log.status === 'healthy' ? '#F0FDF4' : log.status === 'warning' ? '#FEF3C7' : '#FEF2F2', borderRadius: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: log.status === 'healthy' ? '#22c55e' : log.status === 'warning' ? '#F59E0B' : '#EF4444', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>{log.vendor_id?.slice(0, 8)}... — v{log.app_version}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{log.theme_id} | {log.menu_count} items | {log.screen_width}px | {new Date(log.created_at).toLocaleString()}</div>
                      {log.error_message && <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>{log.error_message}</div>}
                    </div>
                  </div>
                ))}
                {fleetLogs.length === 0 && <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 12 }}>No health reports yet</p>}
              </div>

              {/* Fleet CSV Export */}
              <button onClick={() => {
                const headers = 'Vendor ID,Status,Version,Theme,Accent,Menu Count,Last Check,Errors\n'
                const rows = fleetStatus.map(v => `"${v.vendor_id}","${v.current_status}","${v.app_version}","${v.theme_id}","${v.accent_color}","${v.menu_count}","${v.last_health_check}","${v.error_count}"`).join('\n')
                const blob = new Blob([headers + rows], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `fleet-health-${new Date().toISOString().slice(0,10)}.csv`; a.click()
              }} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
                📊 Export Fleet CSV
              </button>
            </>
          )
        })()}

        {/* ── SUPPORT TICKETS ── */}
        {page === 'tickets' && (() => {
          const TICKET_STATUS = { open: '#F59E0B', in_progress: '#3B82F6', resolved: '#22c55e', closed: '#9CA3AF' }
          const TICKET_PRIORITY = { low: '#9CA3AF', medium: '#F59E0B', high: '#EF4444', urgent: '#DC2626' }
          const [ticketFilter, setTicketFilter] = useState('all')
          const filteredTickets = tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter)
          const openCount = tickets.filter(t => t.status === 'open').length
          const inProgressCount = tickets.filter(t => t.status === 'in_progress').length

          async function updateTicketStatus(id, status) {
            await supabase.from('vendor_support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
            await supabase.from('admin_audit_log').insert({ action: 'ticket_status_change', target_type: 'ticket', target_id: id, details: { new_status: status } })
            setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))
          }

          async function replyToTicket(id) {
            if (!ticketReply.trim()) return
            const ticket = tickets.find(t => t.id === id)
            const replies = ticket.admin_replies || []
            replies.push({ message: ticketReply, timestamp: new Date().toISOString() })
            await supabase.from('vendor_support_tickets').update({ admin_replies: replies, status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', id)
            await supabase.from('admin_audit_log').insert({ action: 'ticket_reply', target_type: 'ticket', target_id: id, details: { reply: ticketReply } })
            setTickets(tickets.map(t => t.id === id ? { ...t, admin_replies: replies, status: 'in_progress' } : t))
            setTicketReply('')
            setTicketReplying(null)
          }

          return (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={s.statCard}><div style={s.statNum}>{tickets.length}</div><div style={s.statLabel}>Total</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#F59E0B' }}>{openCount}</div><div style={s.statLabel}>Open</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#3B82F6' }}>{inProgressCount}</div><div style={s.statLabel}>In Progress</div></div>
                <div style={s.statCard}><div style={{ ...s.statNum, color: '#22c55e' }}>{tickets.filter(t => t.status === 'resolved').length}</div><div style={s.statLabel}>Resolved</div></div>
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
                  <button key={f} onClick={() => setTicketFilter(f)} style={{ ...s.filterBtn, ...(ticketFilter === f ? s.filterBtnActive : {}) }}>
                    {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Ticket list */}
              {filteredTickets.map(ticket => (
                <div key={ticket.id} style={{ ...s.memberCard, borderLeft: `4px solid ${TICKET_STATUS[ticket.status] || '#9CA3AF'}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{ticket.subject || 'No subject'}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        Vendor: {ticket.vendor_id?.slice(0, 8)}... | {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {ticket.priority && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: TICKET_PRIORITY[ticket.priority] || '#9CA3AF', padding: '2px 6px', borderRadius: 4 }}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: TICKET_STATUS[ticket.status] || '#9CA3AF', padding: '2px 6px', borderRadius: 4 }}>
                        {ticket.status === 'in_progress' ? 'IN PROGRESS' : (ticket.status || 'open').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {ticket.message && (
                    <div style={{ fontSize: 13, color: '#444', background: '#f9f9f9', borderRadius: 8, padding: 10, marginBottom: 8, lineHeight: 1.5 }}>
                      {ticket.message}
                    </div>
                  )}

                  {/* Admin replies */}
                  {ticket.admin_replies && ticket.admin_replies.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {ticket.admin_replies.map((r, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#1a1a1a', background: '#EFF6FF', borderRadius: 8, padding: 8, marginBottom: 4, borderLeft: '3px solid #3B82F6' }}>
                          <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 700, marginBottom: 2 }}>Admin — {new Date(r.timestamp).toLocaleString()}</div>
                          {r.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <>
                        <button onClick={() => setTicketReplying(ticketReplying === ticket.id ? null : ticket.id)} style={{ ...s.filterBtn, background: '#3B82F6', color: '#fff', fontSize: 11 }}>Reply</button>
                        <button onClick={() => updateTicketStatus(ticket.id, 'resolved')} style={{ ...s.filterBtn, background: '#22c55e', color: '#fff', fontSize: 11 }}>Resolve</button>
                      </>
                    )}
                    {ticket.status === 'resolved' && (
                      <button onClick={() => updateTicketStatus(ticket.id, 'closed')} style={{ ...s.filterBtn, background: '#9CA3AF', color: '#fff', fontSize: 11 }}>Close</button>
                    )}
                    {ticket.status === 'closed' && (
                      <button onClick={() => updateTicketStatus(ticket.id, 'open')} style={{ ...s.filterBtn, background: '#F59E0B', color: '#fff', fontSize: 11 }}>Reopen</button>
                    )}
                    {ticket.whatsapp && (
                      <a href={`https://wa.me/${ticket.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ ...s.filterBtn, background: '#25D366', color: '#fff', fontSize: 11, textDecoration: 'none' }}>WhatsApp</a>
                    )}
                  </div>

                  {/* Reply box */}
                  {ticketReplying === ticket.id && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <input value={ticketReply} onChange={e => setTicketReply(e.target.value)} placeholder="Type your reply..." style={{ ...s.input, flex: 1, marginBottom: 0 }} onKeyDown={e => { if (e.key === 'Enter') replyToTicket(ticket.id) }} />
                      <button onClick={() => replyToTicket(ticket.id)} style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Send</button>
                    </div>
                  )}
                </div>
              ))}

              {filteredTickets.length === 0 && <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 30 }}>No support tickets {ticketFilter !== 'all' ? `with status "${ticketFilter}"` : 'yet'}</p>}
            </>
          )
        })()}

        {/* ── AUDIT LOG ── */}
        {page === 'audit' && (() => {
          const ACTION_COLOR = {
            ticket_reply: '#3B82F6', ticket_status_change: '#8B5CF6',
            vendor_reset: '#F59E0B', payment_verified: '#22c55e', payment_rejected: '#EF4444',
            status_change: '#22c55e', theme_reset: '#F59E0B', bulk_message: '#3B82F6',
            billing_reminder: '#8B5CF6',
          }
          const ACTION_ICON = {
            ticket_reply: '💬', ticket_status_change: '🎫',
            vendor_reset: '🔄', payment_verified: '✅', payment_rejected: '❌',
            status_change: '🔄', theme_reset: '🎨', bulk_message: '📨',
            billing_reminder: '💰',
          }
          const [auditFilter, setAuditFilter] = useState('all')
          const actionTypes = [...new Set(auditLogs.map(l => l.action))]
          const filteredLogs = auditLogs.filter(l => auditFilter === 'all' || l.action === auditFilter)

          return (
            <>
              <div style={s.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}>Activity Log ({auditLogs.length})</h3>
                  <button onClick={() => {
                    const headers = 'Action,Target,Details,Timestamp\n'
                    const rows = auditLogs.map(l => `"${l.action}","${l.target_type}:${l.target_id}","${JSON.stringify(l.details || {})}","${l.created_at}"`).join('\n')
                    const blob = new Blob([headers + rows], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`; a.click()
                  }} style={{ ...s.filterBtn, background: '#1a1a1a', color: '#FFD600', fontSize: 11 }}>Export CSV</button>
                </div>

                {/* Filter by action type */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  <button onClick={() => setAuditFilter('all')} style={{ ...s.filterBtn, ...(auditFilter === 'all' ? s.filterBtnActive : {}) }}>All</button>
                  {actionTypes.map(a => (
                    <button key={a} onClick={() => setAuditFilter(a)} style={{ ...s.filterBtn, ...(auditFilter === a ? s.filterBtnActive : {}) }}>
                      {(ACTION_ICON[a] || '📋') + ' ' + a.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Log entries */}
                {filteredLogs.map((log, i) => (
                  <div key={log.id || i} style={{ padding: 10, background: '#fff', borderRadius: 10, border: '1px solid #f0f0f0', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 10, borderLeft: `3px solid ${ACTION_COLOR[log.action] || '#9CA3AF'}` }}>
                    <div style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{ACTION_ICON[log.action] || '📋'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{log.action?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        {log.target_type && <span>Target: {log.target_type} {log.target_id?.slice(0, 12)}</span>}
                        {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                          <span style={{ marginLeft: 8 }}>
                            {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</div>
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>No audit log entries {auditFilter !== 'all' ? `for "${auditFilter}"` : 'yet'}</p>}
              </div>
            </>
          )
        })()}

        {page === 'analytics' && (
          <>
            {/* Subscription trend */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Subscription Overview</h3>
              <div style={s.statsRow}>
                <div style={s.statCard}>
                  <div style={s.statNum}>{regs.length}</div>
                  <div style={s.statLabel}>Total Signups</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNum, color: '#22c55e' }}>{active.length > 0 ? Math.round(active.length / regs.length * 100) : 0}%</div>
                  <div style={s.statLabel}>Conversion Rate</div>
                </div>
              </div>
            </div>

            {/* Country breakdown */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Countries</h3>
              {Object.entries(countryStats).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                <div key={country} style={s.appTypeRow}>
                  <span style={{ fontSize: 14 }}>{country}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: Math.max(20, count / regs.length * 120), height: 8, borderRadius: 4, background: '#FFD600' }} />
                    <span style={s.badge}>{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(countryStats).length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No data yet</p>}
            </div>

            {/* App type breakdown */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>By App Type</h3>
              {appTypes.map(type => {
                const total = regs.filter(r => r.app_type === type).length
                const act = regs.filter(r => r.app_type === type && r.status === 'active').length
                const pend = regs.filter(r => r.app_type === type && r.status === 'pending_verification').length
                return (
                  <div key={type} style={{ ...s.memberCard, padding: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{type === 'basic' ? 'FoodLocal' : type === 'pro' ? 'Food Pro' : type}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                      <span style={{ color: '#22c55e' }}>{act} active</span>
                      <span style={{ color: '#F59E0B' }}>{pend} pending</span>
                      <span style={{ color: '#888' }}>{total} total</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Billing breakdown */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Billing Plans</h3>
              <div style={s.statsRow}>
                <div style={s.statCard}>
                  <div style={s.statNum}>{monthly.length}</div>
                  <div style={s.statLabel}>Monthly</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statNum}>{yearly.length}</div>
                  <div style={s.statLabel}>Yearly</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SETTINGS ── */}
        {page === 'settings' && (() => {
          const SETTING_FIELDS = [
            { id: 'admin_pin', label: 'Admin PIN', icon: '🔐', type: 'password', placeholder: 'Enter new PIN' },
            { id: 'whatsapp', label: 'WhatsApp Number', icon: '📱', type: 'tel', placeholder: '+62 813 9200 0050' },
            { id: 'bank_name', label: 'Bank Name', icon: '🏦', type: 'text', placeholder: 'Bank BCA' },
            { id: 'account_number', label: 'Account Number', icon: '💳', type: 'text', placeholder: 'XXXX-XXXX-XXXX' },
            { id: 'account_holder', label: 'Account Holder', icon: '👤', type: 'text', placeholder: 'Full Name' },
          ]

          const saveSetting = async (id, value) => {
            await supabase.from('admin_settings').upsert({ id, value, updated_at: new Date().toISOString() })
            setSettings(prev => ({ ...prev, [id]: value }))
            setSettingsEditing(null)
            setSettingsSaved(true)
            setTimeout(() => setSettingsSaved(false), 2000)
          }

          return (
            <>
              {settingsSaved && (
                <div style={{ background: '#22c55e', color: '#fff', padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 12, animation: 'pulse 1s' }}>
                  ✓ Settings saved
                </div>
              )}

              <div style={s.section}>
                <h3 style={s.sectionTitle}>Account & Security</h3>
                {SETTING_FIELDS.filter(f => f.id === 'admin_pin').map(field => (
                  <div key={field.id} style={s.memberCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: settingsEditing === field.id ? 10 : 0 }}>
                      <div>
                        <span style={{ marginRight: 8 }}>{field.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{field.label}</span>
                      </div>
                      <button
                        onClick={() => setSettingsEditing(settingsEditing === field.id ? null : field.id)}
                        style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#FFD600', cursor: 'pointer' }}
                      >
                        {settingsEditing === field.id ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {settingsEditing !== field.id && (
                      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                        {field.type === 'password' ? '••••' : (settings[field.id] || field.placeholder)}
                      </div>
                    )}
                    {settingsEditing === field.id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type={field.type === 'password' ? 'text' : field.type}
                          defaultValue={settings[field.id] || ''}
                          placeholder={field.placeholder}
                          id={`setting-${field.id}`}
                          style={{ ...s.input, flex: 1, marginBottom: 0 }}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`setting-${field.id}`).value
                            if (val) saveSetting(field.id, val)
                          }}
                          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={s.section}>
                <h3 style={s.sectionTitle}>Payment Details</h3>
                {SETTING_FIELDS.filter(f => ['bank_name', 'account_number', 'account_holder'].includes(f.id)).map(field => (
                  <div key={field.id} style={{ ...s.memberCard, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: settingsEditing === field.id ? 10 : 0 }}>
                      <div>
                        <span style={{ marginRight: 8 }}>{field.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{field.label}</span>
                      </div>
                      <button
                        onClick={() => setSettingsEditing(settingsEditing === field.id ? null : field.id)}
                        style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#FFD600', cursor: 'pointer' }}
                      >
                        {settingsEditing === field.id ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {settingsEditing !== field.id && (
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 4 }}>
                        {settings[field.id] || <span style={{ color: '#ccc' }}>{field.placeholder}</span>}
                      </div>
                    )}
                    {settingsEditing === field.id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          defaultValue={settings[field.id] || ''}
                          placeholder={field.placeholder}
                          id={`setting-${field.id}`}
                          style={{ ...s.input, flex: 1, marginBottom: 0 }}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`setting-${field.id}`).value
                            if (val) saveSetting(field.id, val)
                          }}
                          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={s.section}>
                <h3 style={s.sectionTitle}>Notifications</h3>
                {SETTING_FIELDS.filter(f => f.id === 'whatsapp').map(field => (
                  <div key={field.id} style={s.memberCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: settingsEditing === field.id ? 10 : 0 }}>
                      <div>
                        <span style={{ marginRight: 8 }}>{field.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{field.label}</span>
                      </div>
                      <button
                        onClick={() => setSettingsEditing(settingsEditing === field.id ? null : field.id)}
                        style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#FFD600', cursor: 'pointer' }}
                      >
                        {settingsEditing === field.id ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {settingsEditing !== field.id && (
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 4 }}>
                        {settings[field.id] ? '+' + settings[field.id] : <span style={{ color: '#ccc' }}>{field.placeholder}</span>}
                      </div>
                    )}
                    {settingsEditing === field.id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="tel"
                          defaultValue={settings[field.id] || ''}
                          placeholder={field.placeholder}
                          id={`setting-${field.id}`}
                          style={{ ...s.input, flex: 1, marginBottom: 0 }}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`setting-${field.id}`).value
                            if (val) saveSetting(field.id, val)
                          }}
                          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={s.section}>
                <h3 style={s.sectionTitle}>💲 Country Pricing</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Prices shown to users based on their country. QR codes uploaded per country/plan.</p>
                {(() => {
                  const [prices, setPrices] = useState([])
                  useEffect(() => { supabase.from('country_pricing').select('*').order('id').then(({ data }) => { if (data) setPrices(data) }) }, [])
                  return prices.map(p => (
                    <div key={p.id} style={{ ...s.memberCard, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{p.country_name}</span>
                        <span style={{ fontSize: 12, color: '#888' }}>{p.currency}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                        <div>Basic: <strong>{p.currency_symbol} {p.basic_monthly.toLocaleString()}/mo</strong></div>
                        <div>Pro: <strong>{p.currency_symbol} {p.pro_monthly.toLocaleString()}/mo</strong></div>
                        <div>Basic/yr: {p.currency_symbol} {p.basic_yearly.toLocaleString()}</div>
                        <div>Pro/yr: {p.currency_symbol} {p.pro_yearly.toLocaleString()}</div>
                      </div>
                      <div style={{ fontSize: 10, color: p.basic_qr_monthly ? '#22c55e' : '#F59E0B', marginTop: 4 }}>
                        QR: {p.basic_qr_monthly ? '✅ Uploaded' : '⚠️ No QR codes — shows WhatsApp contact'}
                      </div>
                    </div>
                  ))
                })()}

                <h3 style={{ ...s.sectionTitle, marginTop: 20 }}>🛵 Delivery Estimate Rates</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Shown to customers as estimates only. You don't charge delivery — customers arrange their own Gojek/Grab.</p>
                {[
                  { id: 'delivery_base_fee', label: 'Base Fee', icon: '💰', placeholder: '5000' },
                  { id: 'delivery_per_km', label: 'Per KM Rate', icon: '📏', placeholder: '2500' },
                  { id: 'delivery_min_charge', label: 'Minimum Charge', icon: '⬇️', placeholder: '7000' },
                  { id: 'delivery_max_km', label: 'Max Distance (km)', icon: '📍', placeholder: '15' },
                  { id: 'delivery_free_above', label: 'Free Delivery Above', icon: '🆓', placeholder: '100000' },
                  { id: 'delivery_round_to', label: 'Round To', icon: '🔄', placeholder: '1000' },
                ].map(field => (
                  <div key={field.id} style={{ ...s.memberCard, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: settingsEditing === field.id ? 10 : 0 }}>
                      <div>
                        <span style={{ marginRight: 8 }}>{field.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{field.label}</span>
                      </div>
                      <button
                        onClick={() => setSettingsEditing(settingsEditing === field.id ? null : field.id)}
                        style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#FFD600', cursor: 'pointer' }}
                      >
                        {settingsEditing === field.id ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {settingsEditing !== field.id && (
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 4 }}>
                        {settings[field.id] ? `Rp ${Number(settings[field.id]).toLocaleString('id-ID')}` : <span style={{ color: '#ccc' }}>Rp {field.placeholder}</span>}
                      </div>
                    )}
                    {settingsEditing === field.id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          defaultValue={settings[field.id] || ''}
                          placeholder={field.placeholder}
                          id={`setting-${field.id}`}
                          style={{ ...s.input, flex: 1, marginBottom: 0 }}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`setting-${field.id}`).value
                            if (val) saveSetting(field.id, val)
                          }}
                          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Preview calculator */}
                <div style={{ ...s.memberCard, marginTop: 12, background: '#f0f8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Preview Estimates</div>
                  {[1, 3, 5, 10].map(km => {
                    const base = Number(settings.delivery_base_fee || 5000)
                    const perKm = Number(settings.delivery_per_km || 2500)
                    const min = Number(settings.delivery_min_charge || 7000)
                    const roundTo = Number(settings.delivery_round_to || 1000)
                    const raw = base + (km * perKm)
                    const price = Math.max(min, Math.ceil(raw / roundTo) * roundTo)
                    return (
                      <div key={km} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                        <span style={{ color: '#666' }}>{km} km</span>
                        <span style={{ fontWeight: 800 }}>Rp {price.toLocaleString('id-ID')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={s.section}>
                <h3 style={s.sectionTitle}>Quick Actions</h3>
                <button onClick={load} style={{ ...s.btnYellow, marginBottom: 10 }}>🔄 Refresh Data</button>
                <button onClick={onClose} style={s.btnGhost}>← Back to Website</button>
              </div>
            </>
          )
        })()}

      </div>
      </div>
    </div>
  )
}

/* ─── Styles ─── */
const s = {
  page: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1a1a1a',
    display: 'flex',
  },
  sidebar: {
    width: 220,
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '20px 16px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  sidebarItemActive: {
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderLeft: '3px solid #FFD600',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#fff',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid #e0e0e0',
  },
  menuBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 10,
    width: 40,
    height: 40,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1a1a1a',
    flex: 1,
  },
  logoutBtn: {
    background: '#8B0000',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  content: {
    padding: '24px',
    maxWidth: 900,
    margin: '0 auto',
    overflowY: 'auto',
    flex: 1,
    width: '100%',
  },

  // Drawer
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    background: '#1a1a1a',
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    animation: 'slideRight 0.2s ease',
  },
  drawerHeader: {
    padding: '24px 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
  },
  drawerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  drawerItemActive: {
    background: 'rgba(255,214,0,0.1)',
    color: '#FFD600',
    fontWeight: 800,
  },
  drawerFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },

  // Stats
  statsRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    background: '#fff',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statNum: {
    fontSize: 24,
    fontWeight: 900,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#888',
    marginTop: 2,
  },

  // Section
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 12,
  },

  // Cards
  memberCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  miniCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  appTypeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  // Badges & dots
  badge: {
    fontSize: 13,
    fontWeight: 800,
    background: '#f0f0f0',
    padding: '4px 10px',
    borderRadius: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  // Inputs
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    background: '#fff',
  },

  // Filter buttons
  filterBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    background: '#e0e0e0',
    color: '#666',
  },
  filterBtnActive: {
    background: '#1a1a1a',
    color: '#FFD600',
  },

  // Buttons
  btnYellow: {
    display: 'block',
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: '#FFD600',
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
    minHeight: 48,
  },
  btnGhost: {
    display: 'block',
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: '#888',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  btnGreen: {
    flex: 1,
    padding: '10px',
    borderRadius: 10,
    border: 'none',
    background: '#22c55e',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 44,
  },
  btnRed: {
    flex: 1,
    padding: '10px',
    borderRadius: 10,
    border: 'none',
    background: '#EF4444',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 44,
  },
  btnWhatsApp: {
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#25D366',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
}
