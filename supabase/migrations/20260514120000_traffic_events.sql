-- Traffic event capture for the StreetLocal monorepo.
--
-- Every visit to one of the 5 React apps (landing, food-basic, foodlocal-pro,
-- products-local, services-local) writes a row here on first mount. The 2bee
-- admin reads from this table to render the "Traffic & Funnel" tab — utm
-- breakdown, referrer hostnames, and per-app counts.
--
-- This table is the SOURCE OF TRUTH for "where did our users come from".
-- Nothing else in the system tracks utm or referrer.

create table if not exists public.traffic_events (
  id uuid primary key default gen_random_uuid(),
  app_id text not null check (app_id in (
    'landing', 'food-basic', 'foodlocal-pro', 'products-local', 'services-local'
  )),
  session_id text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_path text,
  user_agent text,
  country_code text,
  vendor_id uuid,
  event_type text not null check (event_type in ('first_visit', 'page_view')),
  created_at timestamptz not null default now()
);

create index if not exists traffic_events_app_created_idx
  on public.traffic_events (app_id, created_at desc);

create index if not exists traffic_events_utm_source_created_idx
  on public.traffic_events (utm_source, created_at desc);

create index if not exists traffic_events_session_idx
  on public.traffic_events (session_id);

-- RLS: allow anonymous inserts (apps write with the anon key, no auth context
-- on landing pages); reads are admin-only via the Management API / service role.
alter table public.traffic_events enable row level security;

drop policy if exists traffic_events_anon_insert on public.traffic_events;
create policy traffic_events_anon_insert
  on public.traffic_events
  for insert
  to anon, authenticated
  with check (true);

-- No public select policy — admin reads go through Supabase Management API
-- in the 2bee Flask backend, which holds the access token.
