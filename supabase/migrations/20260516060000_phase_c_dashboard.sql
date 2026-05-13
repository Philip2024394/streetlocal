-- Phase C: coupons + reviews moderation.
-- Analytics + settings pages don't need new tables (they read from existing
-- food_orders / restaurants), so this migration only adds storage for the
-- two persistence-backed features.

-- ── Coupons ─────────────────────────────────────────────────────────────────
-- Code-based promo with percent OR fixed discount, optional min subtotal,
-- max uses, expiry. Separate from item-level "deals" (those are per-dish
-- price drops). Coupons apply to the whole order.
CREATE TABLE IF NOT EXISTS coupons (
  id              bigserial      PRIMARY KEY,
  restaurant_id   bigint         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code            text           NOT NULL,
  description     text,
  discount_type   text           NOT NULL DEFAULT 'percent'
                  CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  numeric(12,0)  NOT NULL,                  -- 10 (= 10%) or 5000 (= Rp 5.000)
  min_subtotal    numeric(12,0)  NOT NULL DEFAULT 0,
  max_uses        int,                                       -- null = unlimited
  used_count      int            NOT NULL DEFAULT 0,
  valid_from      timestamptz    NOT NULL DEFAULT now(),
  valid_to        timestamptz,                               -- null = no expiry
  is_active       boolean        NOT NULL DEFAULT true,
  applies_to      text           NOT NULL DEFAULT 'all'      -- 'all' for now; future: 'category' / 'item'
                  CHECK (applies_to IN ('all', 'category', 'item')),
  created_at      timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, code)
);
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(restaurant_id, code) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id              bigserial      PRIMARY KEY,
  coupon_id       bigint         NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  food_order_id   bigint         REFERENCES food_orders(id) ON DELETE SET NULL,
  subtotal_before numeric(12,0)  NOT NULL,
  discount_amount numeric(12,0)  NOT NULL,
  customer_phone  text,
  created_at      timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx ON coupon_redemptions(coupon_id, created_at DESC);

ALTER TABLE coupons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_public_read"  ON coupons;
DROP POLICY IF EXISTS "coupons_owner_all"    ON coupons;
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "coupons_owner_all"   ON coupons FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

DROP POLICY IF EXISTS "redemptions_owner_read" ON coupon_redemptions;
CREATE POLICY "redemptions_owner_read" ON coupon_redemptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coupons c
    JOIN restaurants r ON r.id = c.restaurant_id
    WHERE c.id = coupon_id AND r.owner_id = auth.uid()
  ));

-- ── Reviews moderation ──────────────────────────────────────────────────────
-- Add vendor reply + hide-spam flag to existing restaurant_reviews.
ALTER TABLE restaurant_reviews
  ADD COLUMN IF NOT EXISTS vendor_reply       text,
  ADD COLUMN IF NOT EXISTS vendor_replied_at  timestamptz,
  ADD COLUMN IF NOT EXISTS is_hidden          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS food_order_id      bigint REFERENCES food_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS restaurant_reviews_restaurant_stars_idx
  ON restaurant_reviews(restaurant_id, stars DESC, created_at DESC)
  WHERE is_hidden = false;
