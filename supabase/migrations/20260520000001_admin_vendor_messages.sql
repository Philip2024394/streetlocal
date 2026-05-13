-- Admin <-> Vendor messages table for two-way chat.

create extension if not exists "uuid-ossp";

-- vendor_id is intentionally NOT a hard FK so foodlocal-pro's `restaurants`
-- rows can also be addressed by the admin inbox (vendor_accounts is the
-- canonical vendor table for the 3 other apps).
create table if not exists public.admin_vendor_messages (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null,
  sender          text not null check (sender in ('admin','vendor')),
  body            text not null,
  read_by_vendor  boolean not null default false,
  read_by_admin   boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_admin_vendor_messages_vendor_created
  on public.admin_vendor_messages (vendor_id, created_at desc);

create index if not exists idx_admin_vendor_messages_unread_admin
  on public.admin_vendor_messages (vendor_id) where sender = 'vendor' and read_by_admin = false;

create index if not exists idx_admin_vendor_messages_unread_vendor
  on public.admin_vendor_messages (vendor_id) where sender = 'admin' and read_by_vendor = false;

alter table public.admin_vendor_messages enable row level security;

drop policy if exists admin_vendor_messages_select on public.admin_vendor_messages;
create policy admin_vendor_messages_select on public.admin_vendor_messages
  for select using (true);

drop policy if exists admin_vendor_messages_insert on public.admin_vendor_messages;
create policy admin_vendor_messages_insert on public.admin_vendor_messages
  for insert with check (true);

drop policy if exists admin_vendor_messages_update on public.admin_vendor_messages;
create policy admin_vendor_messages_update on public.admin_vendor_messages
  for update using (true) with check (true);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.admin_vendor_messages';
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
