-- ── Restaurants ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id              bigserial     PRIMARY KEY,
  owner_id        uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text          NOT NULL,
  cuisine_type    text,
  address         text,
  lat             double precision,
  lng             double precision,
  phone           text,                        -- WhatsApp number
  cover_url       text,                        -- hero/cover photo
  hero_dish_url   text,                        -- signature dish photo
  hero_dish_name  text,
  description     text,
  opening_hours   text,
  admin_notes     text,                        -- e.g. "08:00–22:00"
  is_open         boolean       NOT NULL DEFAULT false,
  status          text          NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  rating          numeric(3,1),
  review_count    int           NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurants_status_idx ON restaurants(status, is_open);
CREATE INDEX IF NOT EXISTS restaurants_location_idx ON restaurants(lat, lng);

-- ── Menu items ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id              bigserial     PRIMARY KEY,
  restaurant_id   bigint        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            text          NOT NULL,
  description     text,
  price           numeric(12,0) NOT NULL,
  photo_url       text,
  prep_time_min   int,                         -- preparation time in minutes
  category        text,                        -- e.g. 'Main', 'Drinks', 'Snacks'
  is_available    boolean       NOT NULL DEFAULT true,
  sort_order      int           NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menu_items_restaurant_idx ON menu_items(restaurant_id, sort_order);

-- ── Restaurant reviews ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurant_reviews (
  id              bigserial     PRIMARY KEY,
  restaurant_id   bigint        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_ref     text,
  stars           smallint      NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment         text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, user_id, booking_ref)
);

CREATE INDEX IF NOT EXISTS restaurant_reviews_restaurant_idx ON restaurant_reviews(restaurant_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE restaurants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_reviews ENABLE ROW LEVEL SECURITY;

-- Restaurants: owner manages their own; approved ones are public
DROP POLICY IF EXISTS "restaurant_public_read"  ON restaurants;
DROP POLICY IF EXISTS "restaurant_owner_all"    ON restaurants;
CREATE POLICY "restaurant_public_read" ON restaurants FOR SELECT USING (status = 'approved');
CREATE POLICY "restaurant_owner_all"   ON restaurants FOR ALL   USING (auth.uid() = owner_id);

-- Menu items: public read for approved restaurants; owner manages
DROP POLICY IF EXISTS "menu_public_read"  ON menu_items;
DROP POLICY IF EXISTS "menu_owner_all"    ON menu_items;
CREATE POLICY "menu_public_read" ON menu_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.status = 'approved'));
CREATE POLICY "menu_owner_all" ON menu_items FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

-- Reviews: anyone can read; authenticated users insert their own
DROP POLICY IF EXISTS "reviews_public_read" ON restaurant_reviews;
DROP POLICY IF EXISTS "reviews_insert_own"  ON restaurant_reviews;
CREATE POLICY "reviews_public_read" ON restaurant_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"  ON restaurant_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
