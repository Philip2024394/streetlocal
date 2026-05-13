/**
 * AdminInboxFab — floating button (📨) that vendors see in each of the
 * 4 React apps. Shows a red unread badge whenever the admin sent them
 * a message they haven't seen. Tapping opens AdminMessageThread.
 *
 * Mount once, near the bottom of the vendor app tree, only when
 * isVendor && vendorId is a real uuid.
 *
 * Props:
 *   - supabase       Supabase client
 *   - vendorId       uuid of vendor_accounts.id
 *   - vendorName     header label inside the thread
 *   - accent         brand color (defaults to StreetLocal gold)
 *   - bottom         px offset from bottom (defaults 150 to clear other FABs)
 */
import React, { useEffect, useRef, useState } from 'react'
import AdminMessageThread from './AdminMessageThread.jsx'

export default function AdminInboxFab({
  supabase, vendorId, vendorName, accent = '#FFD700', bottom = 150,
}) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const channelRef = useRef(null)
  const realId = supabase && vendorId && !String(vendorId).startsWith('local')

  const refreshUnread = async () => {
    if (!realId) return
    try {
      const { count } = await supabase
        .from('admin_vendor_messages')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('sender', 'admin')
        .eq('read_by_vendor', false)
      setUnread(typeof count === 'number' ? count : 0)
    } catch (e) { /* ignore */ }
  }

  useEffect(() => { refreshUnread() }, [vendorId])

  useEffect(() => {
    if (!realId) return
    const ch = supabase.channel(`admin-vendor-inbox:${vendorId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'admin_vendor_messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, () => refreshUnread())
      .subscribe()
    channelRef.current = ch
    return () => { try { supabase.removeChannel(ch) } catch {} }
  }, [vendorId])

  if (!realId) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="StreetLocal admin inbox"
          style={{
            position: 'fixed', right: 16, bottom, zIndex: 9991,
            width: 52, height: 52, borderRadius: 26, border: 'none',
            background: '#1a1a1a', color: '#fff', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px rgba(0,0,0,0.5), 0 0 0 2px ${accent}33`,
          }}
        >
          📨
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10,
              background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #1a1a1a',
            }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}
      {open && (
        <AdminMessageThread
          supabase={supabase}
          vendorId={vendorId}
          role="vendor"
          vendorName={vendorName || 'StreetLocal Admin'}
          accent={accent}
          onClose={() => { setOpen(false); refreshUnread() }}
        />
      )}
    </>
  )
}
