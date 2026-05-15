-- vendor_image_library — per-vendor image catalogue.
--
-- Every image uploaded through uploadMenuImage() (logos, hero artwork,
-- bouncing donut, menu item photos, marketing banners, etc.) is also
-- recorded here so the vendor can pick a past upload from a single
-- picker instead of re-uploading the same file in every slot.
--
-- 'kind' lets the picker filter by intended use (Bouncing donut tab
-- only shows kind='bouncing' images, etc.) but selection is never
-- locked — a vendor can pick any kind for any slot.
--
-- Soft delete via deleted_at so vendors can restore within 30 days.
-- An admin cleanup job (or pg_cron later) can hard-delete rows where
-- deleted_at < now() - interval '30 days'.

create table if not exists public.vendor_image_library (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_accounts(id) on delete cascade,
  url text not null,
  kind text not null default 'other' check (kind in (
    'logo','hero','bouncing','bottom_left','flavour_orb','bg',
    'menu_item','donut_card','loyalty','banner','box','packet','other'
  )),
  label text,
  bytes integer,
  width integer,
  height integer,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- A vendor never has two library rows pointing at the same URL.
-- (uploads use timestamped paths so collisions only happen if
-- recordVendorImage runs twice for one upload — the unique index
-- makes that a no-op via on-conflict-do-nothing.)
create unique index if not exists vendor_image_library_vendor_url_uidx
  on public.vendor_image_library (vendor_id, url);

-- Picker queries always slice by (vendor_id, kind, deleted_at, created_at desc).
create index if not exists vendor_image_library_vendor_kind_idx
  on public.vendor_image_library (vendor_id, kind, deleted_at, created_at desc);

-- RLS — vendor reads / writes only their own rows.
alter table public.vendor_image_library enable row level security;

drop policy if exists "vendor_image_library vendor select" on public.vendor_image_library;
create policy "vendor_image_library vendor select"
  on public.vendor_image_library for select
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

drop policy if exists "vendor_image_library vendor insert" on public.vendor_image_library;
create policy "vendor_image_library vendor insert"
  on public.vendor_image_library for insert
  to authenticated
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

drop policy if exists "vendor_image_library vendor update" on public.vendor_image_library;
create policy "vendor_image_library vendor update"
  on public.vendor_image_library for update
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

drop policy if exists "vendor_image_library vendor delete" on public.vendor_image_library;
create policy "vendor_image_library vendor delete"
  on public.vendor_image_library for delete
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));
