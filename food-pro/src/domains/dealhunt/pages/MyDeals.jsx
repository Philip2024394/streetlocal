import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import s from './MyDeals.module.css';

/* -------------------------------------------------- */
/*  Demo data                                          */
/* -------------------------------------------------- */
const DEMO_CLAIMS = [
  { id: 'c1', deal: { title: 'Nasi Goreng Spesial', seller_name: 'Warung Bu Sari', deal_price: 19000, images: ['https://picsum.photos/seed/deal1/100/100'] }, voucher_code: 'DH7K2M', status: 'active', claimed_at: Date.now() - 3600000, expires_at: Date.now() + 6 * 86400000 },
  { id: 'c2', deal: { title: 'Leather Wallet', seller_name: 'Kulit Asli', deal_price: 149000, images: ['https://picsum.photos/seed/deal2/100/100'] }, voucher_code: 'WL9X3P', status: 'active', claimed_at: Date.now() - 7200000, expires_at: Date.now() + 5 * 86400000 },
  { id: 'c3', deal: { title: 'Full Body Massage', seller_name: 'Zen Spa', deal_price: 120000, images: ['https://picsum.photos/seed/deal3/100/100'] }, voucher_code: 'SP4R8N', status: 'redeemed', claimed_at: Date.now() - 86400000, redeemed_at: Date.now() - 3600000 },
  { id: 'c4', deal: { title: 'Bakso Jumbo', seller_name: 'Bakso Pak Budi', deal_price: 15000, images: ['https://picsum.photos/seed/deal5/100/100'] }, voucher_code: 'BK2L7Q', status: 'expired', claimed_at: Date.now() - 8 * 86400000, expires_at: Date.now() - 86400000 },
  { id: 'c5', deal: { title: 'Honda Vario Rental', seller_name: 'Jogja Rental', deal_price: 65000, images: ['https://picsum.photos/seed/deal4/100/100'] }, voucher_code: 'RN5T1V', status: 'active', claimed_at: Date.now() - 1800000, expires_at: Date.now() + 7 * 86400000 },
];

/* -------------------------------------------------- */
/*  Helpers                                            */
/* -------------------------------------------------- */
const formatRupiah = (n) => 'Rp' + n.toLocaleString('id-ID');

const formatDate = (ts) => {
  const d = new Date(ts);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatCountdown = (expiresAt) => {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const remH = h % 24;
    return { text: `Remaining ${d}d ${remH}h ${m}m`, urgent: false };
  }
  return { text: `Remaining ${h}h ${m}m ${sec}s`, urgent: true };
};

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'expired', label: 'Expired' },
];

/* -------------------------------------------------- */
/*  Component                                          */
/* -------------------------------------------------- */
export default function MyDeals({ open, onClose, userId }) {
  const [tab, setTab] = useState('active');
  const [claims, setClaims] = useState(DEMO_CLAIMS);
  const [copiedId, setCopiedId] = useState(null);
  const [sheetClaim, setSheetClaim] = useState(null);
  const [confirmClaim, setConfirmClaim] = useState(null);
  const [, setTick] = useState(0);

  // Tick every second to update countdowns
  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [open]);

  const filtered = claims.filter((c) => c.status === tab);
  const activeCt = claims.filter((c) => c.status === 'active').length;

  /* Copy voucher code */
  const copyCode = useCallback((code, id) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  /* Mark as used */
  const markUsed = useCallback((claim) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claim.id ? { ...c, status: 'redeemed', redeemed_at: Date.now() } : c
      )
    );
    setConfirmClaim(null);
    setSheetClaim(null);
  }, []);

  if (!open) return null;

  return createPortal(
    <div className={s.overlay}>
      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <button className={s.backBtn} onClick={onClose} aria-label="Back">
            &#8592;
          </button>
          <span className={s.headerTitle}>My Deals</span>
        </div>

        {/* Tab bar */}
        <div className={s.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`${s.tab} ${tab === t.key ? s.tabActive : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === 'active' && activeCt > 0 && (
                <span className={s.tabBadge}>{activeCt}</span>
              )}
            </button>
          ))}
        </div>

        {/* Card list */}
        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className={s.cardList}>
            {filtered.map((claim) => (
              <DealCard
                key={claim.id}
                claim={claim}
                copiedId={copiedId}
                onCopy={copyCode}
                onUseDeal={() => setSheetClaim(claim)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Use-deal bottom sheet */}
      {sheetClaim && (
        <UseDealSheet
          claim={sheetClaim}
          copiedId={copiedId}
          onCopy={copyCode}
          onClose={() => setSheetClaim(null)}
          onMarkUsed={() => setConfirmClaim(sheetClaim)}
        />
      )}

      {/* Confirmation dialog */}
      {confirmClaim && (
        <ConfirmDialog
          claim={confirmClaim}
          onCancel={() => setConfirmClaim(null)}
          onConfirm={() => markUsed(confirmClaim)}
        />
      )}
    </div>,
    document.body
  );
}

/* -------------------------------------------------- */
/*  Deal Card                                          */
/* -------------------------------------------------- */
function DealCard({ claim, copiedId, onCopy, onUseDeal }) {
  const { deal, voucher_code, status, expires_at, redeemed_at } = claim;
  const isActive = status === 'active';
  const isRedeemed = status === 'redeemed';
  const isExpired = status === 'expired';

  const countdown = isActive && expires_at ? formatCountdown(expires_at) : null;

  const cardClass = [
    s.card,
    isActive ? s.cardActive : '',
    isRedeemed ? s.cardRedeemed : '',
    isExpired ? s.cardExpired : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      {/* Top row */}
      <div className={s.cardTop}>
        <img
          className={s.thumbnail}
          src={deal.images?.[0] || ''}
          alt={deal.title}
          loading="lazy"
        />
        <div className={s.cardInfo}>
          <p className={s.dealTitle}>{deal.title}</p>
          <p className={s.sellerName}>{deal.seller_name}</p>
          <span className={s.dealPrice}>{formatRupiah(deal.deal_price)}</span>
        </div>
      </div>

      {/* Voucher code box */}
      <div
        className={`${s.voucherBox} ${!isActive ? s.voucherBoxMuted : ''}`}
        onClick={() => onCopy(voucher_code, claim.id)}
      >
        <div className={s.voucherLabel}>Voucher Code</div>
        <div className={s.voucherCode}>{voucher_code}</div>
        {isActive && expires_at && (
          <div className={s.voucherExpiry}>Valid until {formatDate(expires_at)}</div>
        )}
        {copiedId === claim.id ? (
          <span className={s.copiedToast}>Copied!</span>
        ) : (
          isActive && <span className={s.copyHint}>Tap to copy</span>
        )}
      </div>

      {/* Status-specific content */}
      {isRedeemed && (
        <>
          <div className={`${s.badge} ${s.badgeRedeemed}`}>&#10003; Already Used</div>
          {redeemed_at && (
            <div className={s.redeemedDate}>Redeemed on {formatDate(redeemed_at)}</div>
          )}
        </>
      )}

      {isExpired && (
        <div className={`${s.badge} ${s.badgeExpired}`}>&#10005; Expired</div>
      )}

      {/* Countdown */}
      {isActive && countdown && (
        <div className={`${s.countdown} ${countdown.urgent ? s.countdownUrgent : ''}`}>
          {countdown.text}
        </div>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className={s.actions}>
          <button className={s.btnUse} onClick={onUseDeal}>
            Use Deal
          </button>
          <button className={s.btnChat}>Chat</button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/*  Empty State                                        */
/* -------------------------------------------------- */
function EmptyState({ tab }) {
  const msgs = {
    active: { icon: '\uD83C\uDFF7\uFE0F', text: 'No deals yet \u2014 start hunting!' },
    redeemed: { icon: '\u2705', text: 'No redeemed deals yet' },
    expired: { icon: '\u23F3', text: 'No expired deals' },
  };
  const m = msgs[tab] || msgs.active;
  return (
    <div className={s.emptyState}>
      <div className={s.emptyIcon}>{m.icon}</div>
      <div className={s.emptyText}>{m.text}</div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Use Deal Bottom Sheet                              */
/* -------------------------------------------------- */
function UseDealSheet({ claim, copiedId, onCopy, onClose, onMarkUsed }) {
  return (
    <div className={s.sheetBackdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.sheetHandle} />
        <div className={s.sheetTitle}>Use Deal</div>

        <div
          className={s.sheetVoucherBox}
          onClick={() => onCopy(claim.voucher_code, claim.id + '-sheet')}
        >
          <div className={s.sheetVoucherCode}>{claim.voucher_code}</div>
          <div className={s.sheetCopyHint}>
            {copiedId === claim.id + '-sheet' ? 'Copied!' : 'Tap to copy code'}
          </div>
        </div>

        <div className={s.sheetInstruction}>
          Show this code to the seller to redeem your deal.
        </div>

        <button className={s.btnMarkUsed} onClick={onMarkUsed}>
          Mark as Used
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Confirmation Dialog                                */
/* -------------------------------------------------- */
function ConfirmDialog({ claim, onCancel, onConfirm }) {
  return (
    <div className={s.confirmBackdrop}>
      <div className={s.confirmDialog}>
        <div className={s.confirmTitle}>Mark as used?</div>
        <div className={s.confirmText}>
          Deal &ldquo;{claim.deal.title}&rdquo; will be marked as used. This action cannot
          be undone.
        </div>
        <div className={s.confirmActions}>
          <button className={s.btnConfirmCancel} onClick={onCancel}>
            Cancel
          </button>
          <button className={s.btnConfirmYes} onClick={onConfirm}>
            Yes, Mark as Used
          </button>
        </div>
      </div>
    </div>
  );
}
