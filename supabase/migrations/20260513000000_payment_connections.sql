-- ─── Payment Gateways — vendor connections + orders + payment status ───
-- Replaces the localStorage-only payment_gateways pattern with a real
-- server-side table so credentials are stored once per vendor and used by
-- Edge Functions to actually process payments end-to-end.

create extension if not exists "uuid-ossp";

-- ── vendor_payment_connections ──────────────────────────────────────────
-- One row per (vendor, gateway). Holds the encrypted credentials and mode
-- (test/live). Edge Functions read this to authenticate calls to the
-- gateway on behalf of the vendor.
create table if not exists public.vendor_payment_connections (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendor_accounts(id) on delete cascade,
  gateway_id text not null, -- 'midtrans' | 'stripe' | 'xendit' | ...
  mode text not null default 'test' check (mode in ('test','live')),
  server_key text,
  client_key text,
  webhook_secret text,
  additional_config jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  connected_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (vendor_id, gateway_id)
);

create index if not exists idx_vpc_vendor on public.vendor_payment_connections (vendor_id);
create index if not exists idx_vpc_gateway on public.vendor_payment_connections (gateway_id);

-- ── orders ─────────────────────────────────────────────────────────────
-- Customer orders. The gateway_order_id is the externally-visible ID we
-- send to the gateway and receive back in webhooks (the join key).
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendor_accounts(id) on delete cascade,
  conversation_id uuid, -- optional link to chat thread
  customer_phone text,
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'IDR',
  -- payment
  gateway_id text,
  gateway_order_id text unique, -- the id we sent to the gateway
  gateway_transaction_id text,  -- the id the gateway returned
  payment_method text,           -- 'gopay','qris','card','bank_transfer', etc.
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded','cancelled','expired')),
  -- timestamps
  created_at timestamptz default now(),
  paid_at timestamptz,
  refunded_at timestamptz,
  meta jsonb default '{}'::jsonb
);

create index if not exists idx_orders_vendor_status on public.orders (vendor_id, payment_status);
create index if not exists idx_orders_gateway_order on public.orders (gateway_order_id);
create index if not exists idx_orders_created on public.orders (created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.vendor_payment_connections enable row level security;
alter table public.orders enable row level security;

-- StreetLocal uses phone+password (not Supabase Auth). We open these to
-- the anon role for now; the Edge Functions run as service_role and
-- bypass RLS. Tighten when Supabase Auth migration happens.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vendor_payment_connections' and policyname='vpc_anon_all') then
    create policy "vpc_anon_all" on public.vendor_payment_connections for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_anon_all') then
    create policy "orders_anon_all" on public.orders for all using (true) with check (true);
  end if;
end $$;

-- ── Realtime ───────────────────────────────────────────────────────────
-- Vendors subscribe to their own orders to get "paid" badges live.
alter publication supabase_realtime add table public.orders;

-- ── updated_at trigger ─────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_vpc_updated_at on public.vendor_payment_connections;
create trigger trg_vpc_updated_at before update on public.vendor_payment_connections
  for each row execute procedure public.set_updated_at();
