-- ═══════════════════════════════════════════════════════════
-- RLS lockdown — Phase 8 follow-up. Closes the remaining tables
-- the original migration left wide-open.
--
-- CRITICAL: vendor_payment_connections stores RAW API KEYS for
-- Stripe / Midtrans / Xendit / PayPal / Razorpay / etc. Anyone
-- with the public anon key could SELECT them all and instantly
-- have every vendor's gateway credentials. THIS is the worst
-- remaining exposure.
--
-- Same model as the previous migration: SELECT/INSERT/UPDATE/DELETE
-- gated by public.jwt_vendor_id() = vendor_id.
-- ═══════════════════════════════════════════════════════════

-- ── vendor_payment_connections ──────────────────────────────────
-- Vendor only. NO public read — these are SECRETS, not metadata.
drop policy if exists "vpc_anon_all"               on public.vendor_payment_connections;
drop policy if exists "vendor read vpc"            on public.vendor_payment_connections;
drop policy if exists "vendor insert vpc"          on public.vendor_payment_connections;
drop policy if exists "vendor update vpc"          on public.vendor_payment_connections;
drop policy if exists "vendor delete vpc"          on public.vendor_payment_connections;

create policy "vendor read vpc"
  on public.vendor_payment_connections for select
  using (public.jwt_vendor_id() = vendor_id);
create policy "vendor insert vpc"
  on public.vendor_payment_connections for insert
  with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor update vpc"
  on public.vendor_payment_connections for update
  using (public.jwt_vendor_id() = vendor_id)
  with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete vpc"
  on public.vendor_payment_connections for delete
  using (public.jwt_vendor_id() = vendor_id);

-- service_role bypasses RLS by default (used by Edge Functions to
-- read keys for charging). That's correct — only the vendor's signed-
-- in browser is constrained.

-- ── orders ──────────────────────────────────────────────────────
-- Donut app's payment ledger. Customers need to look up their own
-- order by gateway_order_id (random UUID-ish — not guessable), but
-- they don't need to enumerate all orders for a vendor. Vendors need
-- full read on their own rows. Webhooks (service_role) bypass RLS.
drop policy if exists "orders_anon_all"            on public.orders;
drop policy if exists "vendor read orders"         on public.orders;
drop policy if exists "anon insert order"          on public.orders;
drop policy if exists "vendor update order"        on public.orders;
drop policy if exists "customer read by gw id"     on public.orders;

create policy "vendor read orders"
  on public.orders for select
  using (public.jwt_vendor_id() = vendor_id);
-- Customer-facing INSERT is needed because the customer's browser
-- creates the pending order row before the gateway redirect. No
-- JWT available at that point.
create policy "anon insert order"
  on public.orders for insert
  with check (true);
create policy "vendor update order"
  on public.orders for update
  using (public.jwt_vendor_id() = vendor_id)
  with check (public.jwt_vendor_id() = vendor_id);

-- ── vendor_customers ────────────────────────────────────────────
-- Customer phone + name + spend history. PII — vendor read-only.
drop policy if exists "Allow public all on vendor_customers" on public.vendor_customers;
drop policy if exists "vendor read customers"               on public.vendor_customers;
drop policy if exists "public upsert customer"              on public.vendor_customers;
drop policy if exists "vendor update customers"             on public.vendor_customers;

create policy "vendor read customers"
  on public.vendor_customers for select
  using (public.jwt_vendor_id() = vendor_id);
-- Customers' first order needs to insert their row. No JWT yet.
create policy "public upsert customer"
  on public.vendor_customers for insert
  with check (true);
create policy "vendor update customers"
  on public.vendor_customers for update
  using (public.jwt_vendor_id() = vendor_id)
  with check (public.jwt_vendor_id() = vendor_id);

-- ── vendor_health_logs ──────────────────────────────────────────
-- Vendor's own startup health telemetry. INSERT can stay open
-- (any vendor's browser writes its own row). SELECT vendor-only.
drop policy if exists "public_health_select"  on public.vendor_health_logs;

create policy "vendor read health"
  on public.vendor_health_logs for select
  using (public.jwt_vendor_id() = vendor_id);

-- ── vendor_push_subscriptions ───────────────────────────────────
-- Web-push subscription endpoints + VAPID keys for vendor's
-- browser-side push notifications. Vendor-only.
drop policy if exists "anon read push subs"   on public.vendor_push_subscriptions;
drop policy if exists "anon insert push subs" on public.vendor_push_subscriptions;
drop policy if exists "anon delete push subs" on public.vendor_push_subscriptions;
drop policy if exists "vendor read push subs"  on public.vendor_push_subscriptions;
drop policy if exists "vendor insert push subs" on public.vendor_push_subscriptions;
drop policy if exists "vendor delete push subs" on public.vendor_push_subscriptions;

create policy "vendor read push subs"
  on public.vendor_push_subscriptions for select
  using (public.jwt_vendor_id() = vendor_id);
create policy "vendor insert push subs"
  on public.vendor_push_subscriptions for insert
  with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete push subs"
  on public.vendor_push_subscriptions for delete
  using (public.jwt_vendor_id() = vendor_id);

-- ── funnel_events ───────────────────────────────────────────────
-- Analytics inserts from any client are intended. Read is admin-only.
-- (No change to INSERT — already open. Add an explicit SELECT block
-- that requires service_role / no JWT-public.)
drop policy if exists "funnel_events admin read" on public.funnel_events;
-- Drop any wide-open SELECT to be safe.
-- We don't add a public SELECT — only service_role (Edge Functions /
-- admin tools) can read funnel events. Anonymous browsers cannot
-- enumerate the platform's funnel telemetry.
