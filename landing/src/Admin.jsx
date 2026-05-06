import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ADMIN_PIN = '5050'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'alerts', label: 'Alerts', icon: '🚨' },
  { id: 'users', label: 'Users', icon: '🧑' },
  { id: 'members', label: 'Subscribers', icon: '👥' },
  { id: 'payments', label: 'Payments', icon: '💰' },
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
  const [alerts, setAlerts] = useState([])
  const [alertForm, setAlertForm] = useState({ app_type: '', severity: 'warning', title: '', description: '' })
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [settings, setSettings] = useState({})
  const [users, setUsers] = useState([])
  const [settingsEditing, setSettingsEditing] = useState(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    const [regsRes, alertsRes, settingsRes, usersRes] = await Promise.all([
      supabase.from('app_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('app_alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_settings').select('*'),
      supabase.from('user_accounts').select('*').order('created_at', { ascending: false }),
    ])
    if (regsRes.data) setRegs(regsRes.data)
    if (alertsRes.data) setAlerts(alertsRes.data)
    if (usersRes.data) setUsers(usersRes.data)
    if (settingsRes.data) {
      const obj = {}
      settingsRes.data.forEach(s => { obj[s.id] = s.value })
      setSettings(obj)
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
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => setDrawer(true)} style={s.menuBtn}>
          <span style={{ fontSize: 20 }}>☰</span>
        </button>
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
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{type === 'basic' ? 'Food Basic' : type === 'pro' ? 'Food Pro' : type}</span>
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
                  <option value="food-basic">Food Basic (Street Vendor)</option>
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
                  {type === 'basic' ? 'Food Basic' : type === 'pro' ? 'Food Pro' : type}
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
        {page === 'payments' && (
          <>
            {/* Revenue summary */}
            <div style={s.statsRow}>
              <div style={{ ...s.statCard, borderLeft: '4px solid #22c55e' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{fmtRp(totalRevenue)}</div>
                <div style={s.statLabel}>Total Active Revenue</div>
              </div>
            </div>
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <div style={s.statNum}>{monthly.length}</div>
                <div style={s.statLabel}>Monthly Plans</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statNum}>{yearly.length}</div>
                <div style={s.statLabel}>Yearly Plans</div>
              </div>
            </div>

            {/* Payment list */}
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
                    {reg.expires_at && <span>Expires: {new Date(reg.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
              {regs.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No payments yet</p>}
            </div>
          </>
        )}

        {/* ── ANALYTICS ── */}
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
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{type === 'basic' ? 'Food Basic' : type === 'pro' ? 'Food Pro' : type}</div>
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
  )
}

/* ─── Styles ─── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1a1a1a',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#1a1a1a',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
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
    color: '#fff',
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
    padding: '16px',
    maxWidth: 600,
    margin: '0 auto',
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
