-- ═══════════════════════════════════════════════════════════
-- Marketing extras — countdown timer + random selection + custom
-- broadcast interval (replaces the fixed 14-day toggle).
-- ═══════════════════════════════════════════════════════════

-- Per-banner countdown: when set, the banner shows "Ends in Xh Ym"
-- on the rendered PNG + in the chat message body. Banners past this
-- timestamp are skipped by the random picker.
alter table public.marketing_banners
  add column if not exists countdown_ends_at timestamptz;

-- Vendor-level settings: customise the re-engagement window AND opt
-- into random-landscape selection so customers don't see the same
-- banner every time.
alter table public.vendor_accounts
  add column if not exists marketing_interval_days integer not null default 14;
alter table public.vendor_accounts
  add column if not exists marketing_random_landscape boolean not null default false;
