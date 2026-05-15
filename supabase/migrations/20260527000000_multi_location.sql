-- ═══════════════════════════════════════════════════════════
-- Multi-location / chains — let one vendor account own multiple
-- shop locations. Each location has its own address, hours,
-- accent colour (optional), menu (optional override), and order
-- inbox. Customers see one location at a time via ?loc= or the
-- location picker.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.vendor_locations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  name text not null,
  -- Optional slug for the URL: streetlocal.live/donut-shop/jakarta
  slug text,
  -- Whether this location is the customer-facing default when no
  -- ?loc= param is given.
  is_primary boolean not null default false,
  -- Per-location overrides — null = inherit from vendor_accounts.
  address text,
  phone text,
  hours text,
  lat real,
  lng real,
  -- Each location can override delivery rates.
  delivery_enabled boolean,
  delivery_base_fee integer,
  delivery_per_km integer,
  delivery_min_charge integer,
  delivery_max_km integer,
  -- Soft delete + activate toggle.
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (vendor_id, slug)
);

create index if not exists vendor_locations_vendor_idx
  on public.vendor_locations (vendor_id, active);

create or replace function public.fn_vendor_locations_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists trg_vendor_locations_touch on public.vendor_locations;
create trigger trg_vendor_locations_touch
  before update on public.vendor_locations
  for each row execute function public.fn_vendor_locations_touch();

-- Add location_id to the resources a location can scope:
--  - menu items (a location can have its own menu or inherit)
--  - chat conversations (orders belong to the location they came from)
--  - staff (a staff member belongs to one location)
alter table public.vendor_menu_items
  add column if not exists location_id uuid references public.vendor_locations(id) on delete set null;
alter table public.chat_conversations
  add column if not exists location_id uuid references public.vendor_locations(id) on delete set null;
alter table public.vendor_staff
  add column if not exists location_id uuid references public.vendor_locations(id) on delete set null;

-- RLS — same permissive pattern as the other vendor tables.
alter table public.vendor_locations enable row level security;
drop policy if exists "anon read locations"   on public.vendor_locations;
drop policy if exists "anon insert locations" on public.vendor_locations;
drop policy if exists "anon update locations" on public.vendor_locations;
drop policy if exists "anon delete locations" on public.vendor_locations;
create policy "anon read locations"   on public.vendor_locations for select using (true);
create policy "anon insert locations" on public.vendor_locations for insert with check (true);
create policy "anon update locations" on public.vendor_locations for update using (true);
create policy "anon delete locations" on public.vendor_locations for delete using (true);
