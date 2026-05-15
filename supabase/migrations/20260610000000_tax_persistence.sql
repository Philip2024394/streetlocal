-- tax_persistence — move vendor tax settings from localStorage to the
-- server, plus populate dedicated columns on vendor_orders for query
-- efficiency (so we can run "total tax collected this month" without
-- parsing the JSONB order_payload on every row).
--
-- Before this migration: tax was localStorage-only on the vendor's
-- device, which meant the customer's storefront on a different device
-- saw no tax until checkout, and multi-device staff diverged.
--
-- After this migration:
--   - vendor_accounts.shop_tax_rate / _label / _inclusive — the
--     authoritative settings, written by the vendor's settings page,
--     read by the customer's storefront on every load.
--   - vendor_orders.tax_amount / tax_rate — flat columns populated
--     on every order insert so reporting queries are O(1) per order.
--   - JSONB order_payload.tax stays for backwards-compat with existing
--     orders + receipt rendering.

alter table public.vendor_accounts
  add column if not exists shop_tax_rate     numeric(5,2) not null default 0 check (shop_tax_rate >= 0 and shop_tax_rate <= 100),
  add column if not exists shop_tax_label    text         not null default 'Tax',
  add column if not exists shop_tax_inclusive boolean     not null default false;

alter table public.vendor_orders
  add column if not exists tax_amount     numeric(12,2) not null default 0,
  add column if not exists tax_rate       numeric(5,2)  not null default 0;

-- Index so "tax collected this month per vendor" is fast.
create index if not exists vendor_orders_tax_idx
  on public.vendor_orders (vendor_id, created_at desc)
  where tax_amount > 0;
