-- Vendor plan tier: tracks which order channel(s) the vendor signed up for.
-- This drives the customer-facing checkout: whatsapp vendors get only the
-- WhatsApp hand-off, chat vendors get only the in-app chat flow, both
-- vendors get the picker modal that was introduced in Phase A.
--
-- Pricing tiers (per landing/src/Affiliate.jsx):
--   'whatsapp' = Rp 35.000/mo — vendor processes orders manually in WhatsApp
--   'chat'     = Rp 50.000/mo — vendor uses in-app chat + payment gateway
--   'both'     = enables the customer-side picker (no specific price yet)
--
-- Existing vendors default to 'both' so behaviour is unchanged until the
-- vendor (or admin) explicitly picks a tier.

alter table public.vendor_accounts
  add column if not exists plan_tier text not null default 'both'
    check (plan_tier in ('whatsapp', 'chat', 'both')),
  add column if not exists plan_started_at timestamptz not null default now();

-- Index so admin / reporting queries by tier are fast.
create index if not exists vendor_accounts_plan_tier_idx
  on public.vendor_accounts (plan_tier);
