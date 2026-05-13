-- Phase B foundation: create food_orders if missing + add gateway columns
-- so the customer-facing checkout can route through the vendor's connected
-- payment gateway (Stripe, Midtrans, Xendit, etc.) and auto-confirm on
-- settlement. Without these columns the existing menu page silently falls
-- back to manual bank-transfer + screenshot.
CREATE TABLE IF NOT EXISTS food_orders (
  id                      bigserial      PRIMARY KEY,
  sender_id               uuid           REFERENCES profiles(id),
  restaurant_id           bigint         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  restaurant_name         text,
  restaurant_lat          double precision,
  restaurant_lng          double precision,
  driver_id               uuid           REFERENCES profiles(id),
  driver_name             text,
  driver_lat              double precision,
  driver_lng              double precision,
  items                   jsonb          NOT NULL DEFAULT '[]'::jsonb,
  subtotal                numeric(12,0)  NOT NULL DEFAULT 0,
  delivery_fee            numeric(12,0)  NOT NULL DEFAULT 0,
  extras_total            numeric(12,0)  NOT NULL DEFAULT 0,
  total                   numeric(12,0)  NOT NULL DEFAULT 0,
  customer_name           text,
  customer_phone          text,
  customer_lat            double precision,
  customer_lng            double precision,
  customer_address        text,
  special_instructions    text,
  payment_method          text           DEFAULT 'bank_transfer',
  payment_screenshot_url  text,
  payment_confirmed_at    timestamptz,
  status                  text           NOT NULL DEFAULT 'awaiting_payment'
                          CHECK (status IN (
                            'awaiting_payment','payment_submitted','confirmed',
                            'driver_heading','picked_up','delivered','cancelled'
                          )),
  cancel_reason           text,
  pickup_code             text,
  created_at              timestamptz    NOT NULL DEFAULT now(),
  updated_at              timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_orders_restaurant_idx ON food_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS food_orders_status_idx     ON food_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS food_orders_driver_idx     ON food_orders(driver_id, status);

-- Gateway / refund columns. Webhook updates these once a connected
-- gateway (vendor's own Stripe/Midtrans/Xendit) settles the charge.
ALTER TABLE food_orders
  ADD COLUMN IF NOT EXISTS gateway_used      text,            -- 'midtrans' | 'stripe' | ...
  ADD COLUMN IF NOT EXISTS payment_intent_id text,            -- gateway's order/intent id
  ADD COLUMN IF NOT EXISTS gateway_order_id  text UNIQUE,     -- our prefix: FOO-<restaurantId>-<ts>
  ADD COLUMN IF NOT EXISTS auto_confirmed_at timestamptz,     -- webhook time, drives "confirmed" status
  ADD COLUMN IF NOT EXISTS refund_id         text,
  ADD COLUMN IF NOT EXISTS refund_status     text             -- 'requested' | 'completed' | 'failed' | null
                          CHECK (refund_status IN ('requested','completed','failed')),
  ADD COLUMN IF NOT EXISTS refund_amount     numeric(12,0),
  ADD COLUMN IF NOT EXISTS refunded_at       timestamptz;

CREATE INDEX IF NOT EXISTS food_orders_gateway_order_idx ON food_orders(gateway_order_id);

-- RLS — owners see their orders; sender sees own; service role bypasses.
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_orders_owner_read" ON food_orders;
CREATE POLICY "food_orders_owner_read" ON food_orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
    OR sender_id = auth.uid()
    OR driver_id = auth.uid()
  );
DROP POLICY IF EXISTS "food_orders_sender_insert" ON food_orders;
CREATE POLICY "food_orders_sender_insert" ON food_orders FOR INSERT
  WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);

DROP POLICY IF EXISTS "food_orders_owner_update" ON food_orders;
CREATE POLICY "food_orders_owner_update" ON food_orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
    OR driver_id = auth.uid()
  );
