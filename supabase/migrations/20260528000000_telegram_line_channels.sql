-- Telegram + LINE channel handles on vendor_accounts.
-- Both use deeplink share patterns identical to wa.me — vendor
-- sets the handle once, customers get a "Message via X" button
-- alongside WhatsApp on Visit Us / chat error fallback / share row.

alter table public.vendor_accounts
  add column if not exists shop_telegram text;
alter table public.vendor_accounts
  add column if not exists shop_line_id text;
