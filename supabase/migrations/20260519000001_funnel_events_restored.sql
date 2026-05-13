-- Funnel drop-off tracking.
-- Each row is a single step transition for a single browser session. The
-- combination (session_id, step) is unique so a step is only recorded once
-- per session — preventing inflated counts from React effect retriggers or
-- pollers re-firing the same event.
--
-- app_id values: 'landing' | 'food-basic' | 'foodlocal-pro' | 'products-local' | 'services-local'
-- step values:   'landing_viewed' | 'signup_started' | 'signup_completed'
--                | 'payment_started' | 'payment_completed'
-- session_id    is the same value the traffic agent stores under the
--               'sl_session_id' localStorage key — we share it so funnel
--               events can be joined back to traffic-source data.
-- vendor_id     is null for anonymous landing views; populated once the
--               vendor row exists (signup_completed onward).
-- metadata      free-form jsonb so apps can stash plan_tier, product, etc.

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  app_id text not null check (app_id in ('landing','food-basic','foodlocal-pro','products-local','services-local')),
  session_id text not null,
  vendor_id uuid null,
  step text not null check (step in ('landing_viewed','signup_started','signup_completed','payment_started','payment_completed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One row per (session, step). Inserts use on conflict do nothing so the
-- emit helper in the client can fire-and-forget without checking first.
create unique index if not exists funnel_events_session_step_uidx
  on public.funnel_events (session_id, step);

-- Aggregations always slice by app + step, ordered by time.
create index if not exists funnel_events_app_step_created_idx
  on public.funnel_events (app_id, step, created_at desc);

-- Lookup-by-vendor for joining to vendor_accounts in admin queries.
create index if not exists funnel_events_vendor_created_idx
  on public.funnel_events (vendor_id, created_at desc)
  where vendor_id is not null;

-- RLS: allow inserts from the anon key (fire-and-forget from the browser)
-- but no public read. Admin endpoint uses service_role via the management
-- API which bypasses RLS anyway.
alter table public.funnel_events enable row level security;

drop policy if exists "funnel_events anon insert" on public.funnel_events;
create policy "funnel_events anon insert"
  on public.funnel_events
  for insert
  to anon, authenticated
  with check (true);
