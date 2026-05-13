/**
 * Shared DashboardShell — wraps the products-local + services-local
 * vendor ops surface. Side menu + page mount. Each host app passes:
 *   - supabase     Supabase client (or null in demo mode)
 *   - vendorId     uuid of the vendor (vendor_accounts.id)
 *   - statusColumns array shape: [{ id, label, color }, ...]
 *   - accent       brand colour for buttons
 *   - onClose      callback when vendor closes the dashboard
 *
 * What's inside:
 *   - Live Order Board (kanban)
 *   - Refunds Console
 *   - Payouts page
 */
import React, { useState } from 'react'
import OrderBoard from './OrderBoard.jsx'
import RefundsConsole from './RefundsConsole.jsx'
import PayoutsPage from './PayoutsPage.jsx'
import OrderChatThread from '../chat/OrderChatThread.jsx'

const NAV = [
  { id: 'orderboard', label: 'Live Orders',     icon: '🟢' },
  { id: 'refunds',    label: 'Refunds',         icon: '↩️' },
  { id: 'payouts',    label: 'Payouts',         icon: '💰' },
]

export default function DashboardShell({ supabase, vendorId, statusColumns, accent = '#DC2626', onClose, title = 'Vendor Dashboard' }) {
  const [page, setPage] = useState('orderboard')
  const [navOpen, setNavOpen] = useState(false)
  const [chatOrder, setChatOrder] = useState(null)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: '#0a0a0a', color: '#fff', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 900 }}>{title}</div>
        <button onClick={() => setNavOpen((o) => !o)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{NAV.find((n) => n.id === page)?.icon} {NAV.find((n) => n.id === page)?.label}</button>
      </div>

      {/* Nav drawer */}
      {navOpen && (
        <div onClick={() => setNavOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 240, background: '#111', padding: '14px 12px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>Navigate</div>
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setPage(n.id); setNavOpen(false) }} style={{
                width: '100%', padding: '12px 14px', marginBottom: 4, borderRadius: 10, border: 'none',
                background: page === n.id ? `${accent}33` : 'transparent',
                color: page === n.id ? accent : '#fff',
                fontSize: 14, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {page === 'orderboard' && (
          <OrderBoard supabase={supabase} vendorId={vendorId} columns={statusColumns} onBack={onClose} accent={accent} onOpenChat={(o) => setChatOrder(o)} />
        )}
        {page === 'refunds' && (
          <RefundsConsole supabase={supabase} vendorId={vendorId} onBack={onClose} accent={accent} />
        )}
        {page === 'payouts' && (
          <PayoutsPage supabase={supabase} vendorId={vendorId} onBack={onClose} accent={accent} />
        )}
      </div>

      {chatOrder && (
        <OrderChatThread
          supabase={supabase}
          orderId={chatOrder.id}
          orderTable="vendor_orders"
          role="vendor"
          customerName={chatOrder.customer_name}
          onClose={() => setChatOrder(null)}
          accent={accent}
        />
      )}
    </div>
  )
}
