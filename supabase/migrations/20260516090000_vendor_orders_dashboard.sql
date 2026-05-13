-- vendor_orders gets the columns the products-local + services-local
-- dashboards need. Additive only — keep the existing app's writes working.
ALTER TABLE vendor_orders
  ADD COLUMN IF NOT EXISTS total              integer,
  ADD COLUMN IF NOT EXISTS delivery_fee       integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_address   text,
  ADD COLUMN IF NOT EXISTS scheduled_for      timestamptz,         -- for services-local appointments
  ADD COLUMN IF NOT EXISTS gateway_used       text,                -- which gateway charged this
  ADD COLUMN IF NOT EXISTS gateway_order_id   text,                -- gateway-side reference
  ADD COLUMN IF NOT EXISTS payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS payment_status     text                 -- 'pending' | 'paid' | 'failed' | 'refunded'
                          CHECK (payment_status IN ('pending','paid','failed','refunded','cancelled')),
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_confirmed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS refund_id          text,
  ADD COLUMN IF NOT EXISTS refund_status      text                 -- 'requested' | 'completed' | 'failed'
                          CHECK (refund_status IN ('requested','completed','failed')),
  ADD COLUMN IF NOT EXISTS refund_amount      integer,
  ADD COLUMN IF NOT EXISTS refunded_at        timestamptz,
  ADD COLUMN IF NOT EXISTS module             text                 -- 'products' | 'services' (which app)
                          CHECK (module IN ('products','services','food')),
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- Index for the dashboard's "my recent orders" query.
CREATE INDEX IF NOT EXISTS vendor_orders_vendor_status_idx
  ON vendor_orders(vendor_id, status, created_at DESC);

-- Index for refunds console filter.
CREATE INDEX IF NOT EXISTS vendor_orders_payment_status_idx
  ON vendor_orders(vendor_id, payment_status) WHERE payment_status IS NOT NULL;

-- Backfill module from delivery_type heuristic where possible (best-effort).
UPDATE vendor_orders SET module = 'products'
WHERE module IS NULL AND delivery_type IN ('delivery','pickup','shipping');
