-- ═══════════════════════════════════════════════════════════
-- Marketing banners — vendor promo builder, auto-post triggers
-- ═══════════════════════════════════════════════════════════

create table if not exists public.marketing_banners (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  format text not null check (format in ('landscape', 'square', 'story')),
  bg_image text not null,
  tint text default 'rgba(0,0,0,0.4)',
  text_color text default '#ffffff',
  headline text not null default 'Limited time offer',
  discount text not null default '20% OFF',
  subtitle text default '',
  show_logo boolean not null default true,
  show_shop_name boolean not null default true,
  -- The "baked" PNG with headline/discount/subtitle composed into the
  -- image. Generated client-side on Save → uploaded to the `images`
  -- bucket → public URL stored here. Used as the actual share artifact
  -- for Instagram / Facebook / WhatsApp.
  baked_image_url text,
  baked_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists marketing_banners_vendor_idx
  on public.marketing_banners (vendor_id, created_at desc);

create or replace function public.fn_marketing_banners_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_marketing_banners_touch on public.marketing_banners;
create trigger trg_marketing_banners_touch
  before update on public.marketing_banners
  for each row execute function public.fn_marketing_banners_touch();

-- Vendor-side auto-post settings live on vendor_accounts so the
-- "14-day re-engagement" Edge Function (future) can read both
-- toggle + active-banner with a single join.
alter table public.vendor_accounts
  add column if not exists marketing_autopost_dispatch boolean not null default false;
alter table public.vendor_accounts
  add column if not exists marketing_autopost_14days  boolean not null default false;
alter table public.vendor_accounts
  add column if not exists marketing_active_banner_id uuid;

-- RLS: match the permissive pattern used by chat_conversations etc.
-- Customer-facing app uses the anon key with no per-vendor auth;
-- vendor_id filter on every query is the access boundary.
alter table public.marketing_banners enable row level security;

drop policy if exists "anon read marketing banners"   on public.marketing_banners;
drop policy if exists "anon insert marketing banners" on public.marketing_banners;
drop policy if exists "anon update marketing banners" on public.marketing_banners;
drop policy if exists "anon delete marketing banners" on public.marketing_banners;

create policy "anon read marketing banners"   on public.marketing_banners for select using (true);
create policy "anon insert marketing banners" on public.marketing_banners for insert with check (true);
create policy "anon update marketing banners" on public.marketing_banners for update using (true);
create policy "anon delete marketing banners" on public.marketing_banners for delete using (true);
