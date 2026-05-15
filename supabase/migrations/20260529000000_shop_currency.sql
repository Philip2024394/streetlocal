-- Shop currency (ISO 4217). Drives every money display in the app:
-- menu prices, cart, checkout, receipt, dashboard. Vendor sets once;
-- new vendors default to the currency of their detected country
-- (Intl + ip2c.org). IDR fallback if detection fails.
alter table public.vendor_accounts
  add column if not exists shop_currency text not null default 'IDR';
