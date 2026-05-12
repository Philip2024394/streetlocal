export default function CommissionLockBanner({
  commissionBalance, commissionProofSent, commissionProofUploading,
  commissionProofRef, handleCommissionProofUpload,
}) {
  return (
    <div style={{
      padding:'14px 16px', background:'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08))',
      borderTop:'1px solid rgba(239,68,68,0.25)', display:'flex', flexDirection:'column', gap:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:20 }}>💰</span>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'#f59e0b' }}>Commission Due</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
            Pay to unlock chat and continue selling
          </div>
        </div>
      </div>

      {commissionBalance && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:100, padding:'8px 12px', borderRadius:8, background:'rgba(0,0,0,0.3)', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#ef4444', fontFamily:'monospace' }}>
              Rp {commissionBalance.totalOwed.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Amount Due</div>
          </div>
          <div style={{ flex:1, minWidth:100, padding:'8px 12px', borderRadius:8, background:'rgba(0,0,0,0.3)', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#f59e0b', fontFamily:'monospace' }}>
              {commissionBalance.pendingCount + commissionBalance.overdueCount}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Unpaid Orders</div>
          </div>
        </div>
      )}

      <div style={{
        padding:'10px 12px', borderRadius:8, background:'rgba(0,229,255,0.06)',
        border:'1px solid rgba(0,229,255,0.15)',
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#00E5FF', marginBottom:6 }}>Transfer commission to:</div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:3 }}>
          <span style={{ color:'rgba(255,255,255,0.4)' }}>Bank</span>
          <span style={{ fontWeight:700 }}>BCA</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:3, cursor:'pointer' }}
          onClick={() => navigator.clipboard?.writeText('8720839201')}>
          <span style={{ color:'rgba(255,255,255,0.4)' }}>Account</span>
          <span style={{ fontWeight:700, fontFamily:'monospace' }}>8720839201 <span style={{ fontSize:9, color:'rgba(0,229,255,0.5)' }}>copy</span></span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.7)' }}>
          <span style={{ color:'rgba(255,255,255,0.4)' }}>Name</span>
          <span style={{ fontWeight:700 }}>Indoo Admin</span>
        </div>
      </div>

      {!commissionProofSent ? (
        <>
          <input ref={commissionProofRef} type="file" accept="image/*" capture="environment"
            style={{ display:'none' }} onChange={handleCommissionProofUpload} />
          <button
            onClick={() => commissionProofRef.current?.click()}
            disabled={commissionProofUploading}
            style={{
              padding:'12px 0', borderRadius:10, width:'100%',
              background: commissionProofUploading ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.15)',
              border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e',
              fontSize:14, fontWeight:800, cursor: commissionProofUploading ? 'default' : 'pointer',
              fontFamily:'inherit',
            }}
          >
            {commissionProofUploading ? 'Uploading...' : 'Upload Payment Screenshot & Send to Admin'}
          </button>
        </>
      ) : (
        <div style={{
          padding:'12px 16px', borderRadius:10, textAlign:'center',
          background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)',
        }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#22c55e' }}>Payment proof sent to admin</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>
            Your chat will unlock once admin verifies your payment. Buyer messages continue loading below.
          </div>
        </div>
      )}
    </div>
  )
}
