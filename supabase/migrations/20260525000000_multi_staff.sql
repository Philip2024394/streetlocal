-- ═══════════════════════════════════════════════════════════
-- Multi-staff accounts — let a vendor invite up to 10 staff per
-- shop, each with a role (manager / cashier / kitchen). Roles drive
-- what they see in the drawer + which actions they can take.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.vendor_staff (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  name text not null,
  phone text not null,
  pin text not null, -- 4–6 digit PIN, app-level only (not auth)
  role text not null check (role in ('manager', 'cashier', 'kitchen')),
  active boolean not null default true,
  created_at timestamptz default now(),
  last_login_at timestamptz,
  unique (vendor_id, phone)
);

create index if not exists vendor_staff_vendor_idx
  on public.vendor_staff (vendor_id, active);

alter table public.vendor_staff enable row level security;

drop policy if exists "anon read staff"   on public.vendor_staff;
drop policy if exists "anon insert staff" on public.vendor_staff;
drop policy if exists "anon update staff" on public.vendor_staff;
drop policy if exists "anon delete staff" on public.vendor_staff;

create policy "anon read staff"   on public.vendor_staff for select using (true);
create policy "anon insert staff" on public.vendor_staff for insert with check (true);
create policy "anon update staff" on public.vendor_staff for update using (true);
create policy "anon delete staff" on public.vendor_staff for delete using (true);
