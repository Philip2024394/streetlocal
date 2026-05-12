-- Escrow / authorisation-hold support for the Stripe gateway.
-- Hold pattern: customer pays → Stripe authorises but does NOT capture
-- (capture_method=manual) → funds are reserved on the customer's card
-- but not transferred → vendor (or auto-rule) explicitly releases
-- (captures) or cancels (voids) → funds either settle or release.
--
-- Stripe card-network reality: authorisation holds expire after ~7 days
-- on Visa/MasterCard. We cap escrow_hold_days at 7 in the UI; longer
-- holds would require Stripe Connect with held transfers which is a
-- much bigger build (Connect onboarding, application_fee_amount, etc.).

alter table public.vendor_payment_connections
  add column if not exists escrow_enabled boolean not null default false,
  add column if not exists escrow_hold_days integer not null default 7;

alter table public.orders
  add column if not exists escrow_status text check (escrow_status in ('held', 'released', 'cancelled')),
  add column if not exists escrow_release_at timestamptz,    -- when the hold is scheduled to auto-release
  add column if not exists escrow_captured_at timestamptz,   -- when funds were actually captured
  add column if not exists escrow_cancelled_at timestamptz;  -- when the auth was voided

create index if not exists orders_escrow_release_at_idx
  on public.orders (escrow_release_at)
  where escrow_status = 'held';
