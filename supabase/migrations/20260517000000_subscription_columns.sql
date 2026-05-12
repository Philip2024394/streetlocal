-- StreetLocal-side subscription tracking.
-- A vendor pays StreetLocal Rp 35.000 (whatsapp tier) or Rp 50.000 (chat
-- tier) via Midtrans Snap. The webhook fires when payment settles and
-- this metadata is what drives the auto-activation + renewal cycle.
--
-- StreetLocal's *own* Midtrans keys live in Edge Function secrets:
--   MIDTRANS_SUBSCRIPTION_SERVER_KEY
--   MIDTRANS_SUBSCRIPTION_CLIENT_KEY
--   MIDTRANS_SUBSCRIPTION_MODE  ('production' | 'sandbox')
-- These are NEVER in the database — they're set per-environment via
--   supabase secrets set MIDTRANS_SUBSCRIPTION_SERVER_KEY=...
-- They are distinct from each vendor's own Midtrans keys (which sit
-- in vendor_payment_connections and pay the vendor for customer orders).

alter table public.vendor_accounts
  add column if not exists subscription_order_id text,        -- last Midtrans order_id used (SLS-<vendor_slug>-<ts>)
  add column if not exists subscription_provider text default 'midtrans'
    check (subscription_provider in ('midtrans', 'manual', null)),
  add column if not exists subscription_renew_at timestamptz, -- when the next renewal is due
  add column if not exists url_active boolean not null default true;
-- url_active = false means: vendor can still log in and see their data
-- (we don't break their workflow) but the public storefront returns
-- "not available". Used when a renewal fails AND the vendor doesn't
-- respond to admin chase — preserves their work without taking orders.

create index if not exists vendor_accounts_url_active_idx
  on public.vendor_accounts (url_active)
  where url_active = false;

alter table public.payment_records
  add column if not exists midtrans_order_id text unique,
  add column if not exists midtrans_transaction_id text,
  add column if not exists midtrans_transaction_status text,  -- raw status from Midtrans: settlement | pending | expire | deny | cancel
  add column if not exists proof_url text,                    -- for the manual-upload fallback (build 4 of the broader flow)
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by text;

create index if not exists payment_records_midtrans_order_idx
  on public.payment_records (midtrans_order_id);
