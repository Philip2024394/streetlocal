-- ================================================================
-- Food Module Complete — vendor extras, original_price, food_orders
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS checks
-- ================================================================

-- ── 1. Add original_price to menu_items for dual pricing ─────────────────────
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS original_price numeric(12,0);

-- ── 2. Add vendor_type to restaurants ────────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS vendor_type text DEFAULT 'restaurant'
    CHECK (vendor_type IN ('restaurant', 'street_vendor'));

-- ── 3. Vendor extras (sauces, drinks, sides) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_extras (
  id              bigserial     PRIMARY KEY,
  restaurant_id   bigint        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category        text          NOT NULL CHECK (category IN ('sauces', 'drinks', 'sides')),
  item_id         text          NOT NULL,   -- from library e.g. 'sambal_terasi'
  name            text          NOT NULL,
  price           numeric(12,0) NOT NULL,
  large_price     numeric(12,0),            -- optional large size price
  has_size        boolean       NOT NULL DEFAULT false,
  sort_order      int           NOT NULL DEFAULT 0,
  is_available    boolean       NOT NULL DEFAULT true,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, category, item_id)
);

CREATE INDEX IF NOT EXISTS vendor_extras_restaurant_idx
  ON vendor_extras(restaurant_id, category, is_available);

-- ── 4. Bundle discount per restaurant ────────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS extras_bundle_discount int NOT NULL DEFAULT 0;

-- ── 5. Food orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_orders (
  id                      bigserial     PRIMARY KEY,
  sender_id               uuid          NOT NULL REFERENCES profiles(id),
  restaurant_id           bigint        NOT NULL REFERENCES restaurants(id),
  restaurant_name         text          NOT NULL,
  restaurant_lat          double precision,
  restaurant_lng          double precision,
  driver_id               uuid          REFERENCES profiles(id),
  driver_name             text,
  driver_lat              double precision,
  driver_lng              double precision,

  -- Order content (JSON array of items with extras)
  items                   jsonb         NOT NULL DEFAULT '[]',
  subtotal                numeric(12,0) NOT NULL DEFAULT 0,
  delivery_fee            numeric(12,0) NOT NULL DEFAULT 0,
  extras_total            numeric(12,0) NOT NULL DEFAULT 0,
  total                   numeric(12,0) NOT NULL DEFAULT 0,

  -- Customer details
  customer_name           text,
  customer_phone          text,
  customer_lat            double precision,
  customer_lng            double precision,
  customer_address        text,
  special_instructions    text,

  -- Payment
  payment_method          text          DEFAULT 'bank_transfer',
  payment_screenshot_url  text,
  payment_confirmed_at    timestamptz,

  -- Status pipeline
  status                  text          NOT NULL DEFAULT 'awaiting_payment'
                          CHECK (status IN (
                            'awaiting_payment', 'payment_submitted', 'confirmed',
                            'driver_heading', 'picked_up', 'delivered', 'cancelled'
                          )),
  cancel_reason           text,

  -- Pickup verification
  pickup_code             text,

  -- Timestamps
  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_orders_sender_idx     ON food_orders(sender_id, status);
CREATE INDEX IF NOT EXISTS food_orders_restaurant_idx ON food_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS food_orders_driver_idx     ON food_orders(driver_id, status);
CREATE INDEX IF NOT EXISTS food_orders_status_idx     ON food_orders(status, created_at);

-- ── 6. RLS policies ──────────────────────────────────────────────────────────

-- Vendor extras: public read for approved restaurants; owner manages
ALTER TABLE vendor_extras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extras_public_read" ON vendor_extras;
CREATE POLICY "extras_public_read" ON vendor_extras FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = restaurant_id AND r.status = 'approved'
  ));

DROP POLICY IF EXISTS "extras_owner_all" ON vendor_extras;
CREATE POLICY "extras_owner_all" ON vendor_extras FOR ALL
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  ));

-- Food orders: customer sees own; restaurant sees theirs; driver sees assigned
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_customer_read" ON food_orders;
CREATE POLICY "orders_customer_read" ON food_orders FOR SELECT
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "orders_customer_insert" ON food_orders;
CREATE POLICY "orders_customer_insert" ON food_orders FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "orders_customer_update" ON food_orders;
CREATE POLICY "orders_customer_update" ON food_orders FOR UPDATE
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "orders_restaurant_read" ON food_orders;
CREATE POLICY "orders_restaurant_read" ON food_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "orders_restaurant_update" ON food_orders;
CREATE POLICY "orders_restaurant_update" ON food_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "orders_driver_read" ON food_orders;
CREATE POLICY "orders_driver_read" ON food_orders FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "orders_driver_update" ON food_orders;
CREATE POLICY "orders_driver_update" ON food_orders FOR UPDATE
  USING (auth.uid() = driver_id);

-- Admin full access
DROP POLICY IF EXISTS "orders_admin_all" ON food_orders;
CREATE POLICY "orders_admin_all" ON food_orders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "extras_admin_all" ON vendor_extras;
CREATE POLICY "extras_admin_all" ON vendor_extras FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));
