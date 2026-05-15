-- ═══════════════════════════════════════════════════════════
-- Promo codes — vendor-scoped discount codes customers enter
-- at checkout. Supports % off / flat off, minimum order, first-
-- order-only, max redemptions, expiry date.
--
-- Counts are incremented from the client when an order is
-- placed; redemptions_used > max_redemptions guards re-use.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  code text not null,                                -- user-facing, normalised uppercase
  kind text not null check (kind in ('percent', 'flat')),
  value numeric not null check (value > 0),          -- percent: 1–100, flat: shop-currency units
  min_order numeric not null default 0,              -- subtotal threshold before code applies
  first_order_only boolean not null default false,   -- one-per-customer (matched by phone in order_payload)
  max_redemptions integer,                           -- null = unlimited
  redemptions_used integer not null default 0,
  expires_at timestamptz,                            -- null = no expiry
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (vendor_id, code)
);

create index if not exists promo_codes_vendor_idx
  on public.promo_codes (vendor_id, active);

alter table public.promo_codes enable row level security;

drop policy if exists "anon read promo"   on public.promo_codes;
drop policy if exists "anon insert promo" on public.promo_codes;
drop policy if exists "anon update promo" on public.promo_codes;
drop policy if exists "anon delete promo" on public.promo_codes;

create policy "anon read promo"   on public.promo_codes for select using (true);
create policy "anon insert promo" on public.promo_codes for insert with check (true);
create policy "anon update promo" on public.promo_codes for update using (true);
create policy "anon delete promo" on public.promo_codes for delete using (true);
