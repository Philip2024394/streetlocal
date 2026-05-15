-- Per-banner logo scale multiplier (0.5 – 2.0, default 1.0). The shop
-- name in the banner header also scales with this value so visual
-- weight stays consistent.
alter table public.marketing_banners
  add column if not exists logo_scale real not null default 1.0;
