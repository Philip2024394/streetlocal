-- Activation portal schema: tables and columns that ActivatePage.jsx
-- has been writing to since launch but which were never migrated to the
-- live database. Without this, the activation flow has been entirely
-- non-functional in production.
--
-- This migration adds:
--   1. activation_codes  — pre-generated sales codes (SL-XXXX-XXXX)
--      each one carries a plan_tier + price + status
--   2. payment_records   — audit log of who-paid-what-when
--   3. vendor_accounts.activated_at / activated_by — when + by whom

-- ── activation_codes ──
create table if not exists public.activation_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,                             -- e.g. SL-A1B2-C3D4
  plan_tier text not null default 'chat'
    check (plan_tier in ('whatsapp', 'chat', 'both')),
  price integer not null,                                -- rupiah, no decimals (35000 or 50000 typically)
  status text not null default 'unused'
    check (status in ('unused', 'used', 'expired', 'revoked')),
  used_by_vendor uuid references public.vendor_accounts(id) on delete set null,
  used_at timestamptz,
  period_days integer not null default 30,               -- how many days of access this code grants
  created_at timestamptz not null default now(),
  created_by text,                                       -- sales person / admin who generated the code
  notes text
);
create index if not exists activation_codes_status_idx on public.activation_codes (status);
create index if not exists activation_codes_used_by_idx on public.activation_codes (used_by_vendor);

-- ── payment_records ──
create table if not exists public.payment_records (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendor_accounts(id) on delete cascade,
  amount integer not null,                               -- rupiah
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'paid'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text default 'bank_transfer'
    check (payment_method in ('bank_transfer', 'cash', 'card', 'qris', 'other')),
  activation_code text,                                  -- echo of the SL-XXXX code used (or null if direct)
  collected_by text,                                     -- sales person who took the payment
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists payment_records_vendor_idx on public.payment_records (vendor_id, period_end desc);

-- ── vendor_accounts: activation metadata ──
alter table public.vendor_accounts
  add column if not exists activated_at timestamptz,
  add column if not exists activated_by text,
  add column if not exists city text;

-- ── RLS (permissive to match the rest of the system; ActivatePage uses anon key) ──
-- Sales activation is intended to be done from the sales portal (/activate)
-- which currently uses the anon key. Tightening this would require an
-- authenticated sales role and a dedicated portal session — out of scope here.

alter table public.activation_codes enable row level security;
alter table public.payment_records enable row level security;

drop policy if exists "anon read activation_codes" on public.activation_codes;
create policy "anon read activation_codes" on public.activation_codes for select using (true);

drop policy if exists "anon update activation_codes" on public.activation_codes;
create policy "anon update activation_codes" on public.activation_codes for update using (true) with check (true);

drop policy if exists "anon insert activation_codes" on public.activation_codes;
create policy "anon insert activation_codes" on public.activation_codes for insert with check (true);

drop policy if exists "anon read payment_records" on public.payment_records;
create policy "anon read payment_records" on public.payment_records for select using (true);

drop policy if exists "anon insert payment_records" on public.payment_records;
create policy "anon insert payment_records" on public.payment_records for insert with check (true);
