-- ── Restaurants v2 — extended fields ────────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS category            text,
  ADD COLUMN IF NOT EXISTS price_from          int,
  ADD COLUMN IF NOT EXISTS price_to            int,
  ADD COLUMN IF NOT EXISTS min_order           int,
  ADD COLUMN IF NOT EXISTS catering_available  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seating_capacity    int,
  ADD COLUMN IF NOT EXISTS event_features      text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_this_week  boolean NOT NULL DEFAULT false;

-- Index for category-filtered browse
CREATE INDEX IF NOT EXISTS restaurants_category_idx ON restaurants(category, status, is_open);

-- Admin can set featured_this_week
DROP POLICY IF EXISTS "restaurant_admin_all" ON restaurants;
CREATE POLICY "restaurant_admin_all" ON restaurants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS dine_in_discount int;
