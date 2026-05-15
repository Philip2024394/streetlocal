-- ═══════════════════════════════════════════════════════════
-- Country lock — pricing geofence storage.
--
-- country_detected_ip:  IPv4/v6 captured at vendor signup
-- country_locked:       ISO 3166-1 alpha-2 detected from that IP
-- country_locked_at:    timestamp of the lock
-- pricing_vpn_flagged:  the IP was flagged as VPN/proxy/hosting at signup
--                       (Asia pricing denied for these accounts — they get
--                       USD pricing regardless of IP-claimed country)
--
-- Lock is one-way for v1. Genuine relocations go through manual support
-- override (an admin tool we'll add later).
-- ═══════════════════════════════════════════════════════════

alter table public.vendor_accounts
  add column if not exists country_detected_ip text,
  add column if not exists country_locked text,
  add column if not exists country_locked_at timestamptz,
  add column if not exists pricing_vpn_flagged boolean not null default false;

create index if not exists vendor_country_locked_idx
  on public.vendor_accounts (country_locked);
