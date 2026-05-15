-- feature_sweep — 19-feature build batch. Adds columns + new tables
-- for: mix-and-match box, tip handling, production planner, KDS
-- auth, customer accounts, catering, recurring orders, gift cards,
-- cash reconciliation, kiosk mode, allergens, SMS, email campaigns,
-- gateway monitoring, recipe cost, affiliate payouts, pre-order
-- windows, tax-exempt customers, CSV export.
--
-- Excluded by user direction: ingredient stock / supplier tracking.
--
-- Each feature group is its own section so a partial rollback can
-- target one feature without touching the others.

-- ─── vendor_accounts feature flags + settings ─────────────────────
alter table public.vendor_accounts
  -- Mix-and-match dozen
  add column if not exists mixbox_enabled    boolean not null default false,
  add column if not exists mixbox_size       int     not null default 12 check (mixbox_size > 0),
  add column if not exists mixbox_price      numeric(10,2) not null default 0,
  add column if not exists mixbox_label      text    not null default 'Build your own dozen',
  -- Tipping
  add column if not exists tip_enabled       boolean not null default false,
  add column if not exists tip_presets       int[]   not null default '{10,15,20}'::int[],
  add column if not exists tip_split_enabled boolean not null default false,
  -- KDS auth token (UUID kept in URL fragment of /kds — secret-ish; vendor can rotate)
  add column if not exists kds_token         uuid    not null default gen_random_uuid(),
  -- Catering
  add column if not exists catering_enabled        boolean not null default false,
  add column if not exists catering_lead_hours     int     not null default 24,
  add column if not exists catering_min_size       int     not null default 24,
  add column if not exists catering_contact_email  text,
  -- Kiosk
  add column if not exists kiosk_enabled     boolean not null default false,
  -- SMS (Twilio)
  add column if not exists sms_enabled       boolean not null default false,
  add column if not exists sms_account_sid   text,
  add column if not exists sms_auth_token    text,
  add column if not exists sms_from_number   text,
  -- Recurring orders
  add column if not exists recurring_enabled boolean not null default false,
  -- Gift cards
  add column if not exists gift_cards_enabled boolean not null default false,
  add column if not exists gift_card_denominations int[] not null default '{50,100,200,500}'::int[],
  -- Pre-order windows
  add column if not exists preorder_enabled  boolean not null default false;

-- ─── menu_items extras ───────────────────────────────────────────
-- allergens: array of strings like ['gluten_free','vegan','halal']
-- cost_per_unit: ingredient + labour cost used for margin analysis
alter table public.vendor_menu_items
  add column if not exists allergens     text[] not null default '{}'::text[],
  add column if not exists cost_per_unit numeric(10,2);

-- ─── vendor_orders extras ────────────────────────────────────────
alter table public.vendor_orders
  add column if not exists tip_amount      numeric(10,2) not null default 0,
  add column if not exists tip_percent     int,
  add column if not exists mixbox_items    jsonb,                 -- [{donut_id,qty}] when the order included a mix-box
  add column if not exists is_catering     boolean not null default false,
  add column if not exists recurring_id    uuid,                  -- FK to recurring_orders when this order was auto-created
  add column if not exists gift_card_code  text,                  -- code redeemed on this order
  add column if not exists gift_card_used  numeric(10,2) not null default 0,
  add column if not exists kiosk_order     boolean not null default false,
  add column if not exists preorder_window_id uuid;

-- ─── production_logs (planner + wastage tracking) ────────────────
create table if not exists public.production_logs (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendor_accounts(id) on delete cascade,
  log_date     date not null,
  item_id      uuid not null,  -- references vendor_menu_items
  item_name    text not null,  -- denormalised so deleted items still show in reports
  baked        int  not null default 0 check (baked >= 0),
  wasted       int  not null default 0 check (wasted >= 0),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (vendor_id, log_date, item_id)
);
create index if not exists production_logs_vendor_date_idx
  on public.production_logs (vendor_id, log_date desc);
alter table public.production_logs enable row level security;
drop policy if exists "production_logs vendor all" on public.production_logs;
create policy "production_logs vendor all" on public.production_logs for all
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

-- ─── customer_accounts (phone-keyed, optional sign-in) ───────────
create table if not exists public.customer_accounts (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendor_accounts(id) on delete cascade,
  phone           text not null,
  name            text,
  email           text,
  tax_exempt      boolean not null default false,
  total_orders    int    not null default 0,
  total_spent     numeric(12,2) not null default 0,
  last_order_at   timestamptz,
  created_at      timestamptz not null default now(),
  unique (vendor_id, phone)
);
create index if not exists customer_accounts_vendor_idx on public.customer_accounts (vendor_id, last_order_at desc nulls last);
alter table public.customer_accounts enable row level security;
drop policy if exists "customer_accounts vendor all" on public.customer_accounts;
create policy "customer_accounts vendor all" on public.customer_accounts for all
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

-- ─── recurring_orders (subscriptions) ────────────────────────────
create table if not exists public.recurring_orders (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendor_accounts(id) on delete cascade,
  customer_phone text not null,
  customer_name  text,
  items          jsonb not null,
  cadence        text not null check (cadence in ('weekly','biweekly','monthly')),
  next_run       date not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists recurring_orders_next_run_idx on public.recurring_orders (next_run, active);
alter table public.recurring_orders enable row level security;
drop policy if exists "recurring_orders vendor all" on public.recurring_orders;
create policy "recurring_orders vendor all" on public.recurring_orders for all
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

-- ─── gift_cards ──────────────────────────────────────────────────
create table if not exists public.gift_cards (
  code            text primary key,
  vendor_id       uuid not null references public.vendor_accounts(id) on delete cascade,
  initial_value   numeric(10,2) not null check (initial_value > 0),
  balance         numeric(10,2) not null check (balance >= 0),
  purchaser_phone text,
  purchaser_email text,
  recipient_email text,
  issued_at       timestamptz not null default now(),
  active          boolean not null default true
);
create index if not exists gift_cards_vendor_idx on public.gift_cards (vendor_id, issued_at desc);
alter table public.gift_cards enable row level security;
drop policy if exists "gift_cards vendor select" on public.gift_cards;
create policy "gift_cards vendor select" on public.gift_cards for select to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));
drop policy if exists "gift_cards vendor update" on public.gift_cards;
create policy "gift_cards vendor update" on public.gift_cards for update to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));
-- Public read-by-code RPC for redeem flow (avoid scanning the whole table)
create or replace function public.redeem_gift_card (p_code text, p_vendor_id uuid, p_amount numeric)
returns table (ok boolean, balance numeric, message text) language plpgsql security definer set search_path = public as $$
declare v_balance numeric; v_active boolean;
begin
  select balance, active into v_balance, v_active from public.gift_cards where code = p_code and vendor_id = p_vendor_id;
  if v_balance is null then return query select false, 0::numeric, 'Code not found'; return; end if;
  if not v_active then return query select false, v_balance, 'Code is inactive'; return; end if;
  if p_amount > v_balance then return query select false, v_balance, 'Insufficient balance'; return; end if;
  update public.gift_cards set balance = balance - p_amount where code = p_code and vendor_id = p_vendor_id returning balance into v_balance;
  return query select true, v_balance, 'OK';
end;
$$;
grant execute on function public.redeem_gift_card(text, uuid, numeric) to anon, authenticated;

-- ─── cash_reconciliations (end-of-day Z-report) ──────────────────
create table if not exists public.cash_reconciliations (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendor_accounts(id) on delete cascade,
  log_date        date not null,
  drawer_open     numeric(12,2) not null default 0,
  drawer_close    numeric(12,2) not null default 0,
  cash_counted    numeric(12,2) not null default 0,
  cash_expected   numeric(12,2) not null default 0,
  variance        numeric(12,2) generated always as (cash_counted - cash_expected) stored,
  total_orders    int           not null default 0,
  total_revenue   numeric(12,2) not null default 0,
  notes           text,
  closed_at       timestamptz   not null default now(),
  unique (vendor_id, log_date)
);
alter table public.cash_reconciliations enable row level security;
drop policy if exists "cash_recon vendor all" on public.cash_reconciliations;
create policy "cash_recon vendor all" on public.cash_reconciliations for all to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

-- ─── email_campaigns (Resend-backed marketing) ───────────────────
create table if not exists public.email_campaigns (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendor_accounts(id) on delete cascade,
  name            text not null,
  subject         text not null,
  body_html       text not null,
  segment_filter  jsonb not null default '{}'::jsonb, -- {last_order_days_lt: 30, total_spent_gt: 100}
  status          text not null default 'draft' check (status in ('draft','sending','sent','failed')),
  recipients_count int not null default 0,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.email_campaigns enable row level security;
drop policy if exists "email_campaigns vendor all" on public.email_campaigns;
create policy "email_campaigns vendor all" on public.email_campaigns for all to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

-- ─── preorder_windows ────────────────────────────────────────────
create table if not exists public.preorder_windows (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendor_accounts(id) on delete cascade,
  name            text not null,        -- "Mother's Day 2026"
  order_open_at   timestamptz not null,
  order_close_at  timestamptz not null,
  fulfill_at      timestamptz not null,
  banner_color    text default '#EC4899',
  banner_text     text,
  banner_image_url text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  check (order_open_at < order_close_at and order_close_at <= fulfill_at)
);
create index if not exists preorder_windows_vendor_active_idx on public.preorder_windows (vendor_id, active, order_open_at);
alter table public.preorder_windows enable row level security;
drop policy if exists "preorder_windows vendor all" on public.preorder_windows;
create policy "preorder_windows vendor all" on public.preorder_windows for all to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));
drop policy if exists "preorder_windows public select" on public.preorder_windows;
create policy "preorder_windows public select" on public.preorder_windows for select to anon
  using (active = true and order_open_at <= now() and order_close_at >= now());

-- ─── affiliate_payouts ───────────────────────────────────────────
-- Tracks payouts to affiliates who referred new vendors. Joins to
-- whatever table holds referrals (left flexible — vendor_accounts has
-- a referrer_code column added below).
alter table public.vendor_accounts
  add column if not exists affiliate_referrer_code text;

create table if not exists public.affiliate_payouts (
  id              uuid primary key default gen_random_uuid(),
  affiliate_code  text not null,
  amount          numeric(12,2) not null,
  currency        text not null default 'USD',
  period_start    date,
  period_end      date,
  status          text not null default 'pending' check (status in ('pending','paid','cancelled')),
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists affiliate_payouts_code_idx on public.affiliate_payouts (affiliate_code, status);
-- Read-only by anyone authenticated (admin tooling controls writes).

-- ─── gateway_health (live-ping monitoring) ───────────────────────
create table if not exists public.gateway_health (
  vendor_id       uuid not null references public.vendor_accounts(id) on delete cascade,
  gateway_id      text not null,
  last_checked_at timestamptz,
  healthy         boolean,
  last_error      text,
  primary key (vendor_id, gateway_id)
);
alter table public.gateway_health enable row level security;
drop policy if exists "gateway_health vendor all" on public.gateway_health;
create policy "gateway_health vendor all" on public.gateway_health for all to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));
