-- ═══════════════════════════════════════════════════════════════════════════
-- Restaurant Daily Deals — weekly themed specials
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS restaurant_daily_deals (
  id              bigserial PRIMARY KEY,
  restaurant_id   bigint NOT NULL,
  day_index       smallint NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  items           jsonb NOT NULL DEFAULT '[]'::jsonb,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_index)
);

-- items JSONB format:
-- [{ "itemId": 1, "itemName": "Nasi Goreng", "originalPrice": 30000, "discountPct": 25 }]

CREATE INDEX IF NOT EXISTS idx_daily_deals_restaurant ON restaurant_daily_deals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_daily_deals_day ON restaurant_daily_deals(day_index) WHERE active = true;

ALTER TABLE restaurant_daily_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active deals" ON restaurant_daily_deals FOR SELECT USING (active = true);
CREATE POLICY "Restaurant owners manage own" ON restaurant_daily_deals FOR ALL USING (
  restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
);
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
-- Delivery zones per restaurant
CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  zone_name text NOT NULL,        -- 'Zone 1', 'Zone 2', 'Zone 3'
  radius_km numeric NOT NULL,     -- 2, 5, 10
  delivery_fee numeric DEFAULT 0, -- 0 = free, 5000, 10000
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant ON delivery_zones(restaurant_id);

-- Restaurant subscriptions (flat monthly fee model)
CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'basic',       -- 'basic' (50K) / 'pro' (100K) / 'premium' (200K)
  status text NOT NULL DEFAULT 'trial',     -- 'trial' / 'active' / 'expired' / 'cancelled'
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  amount numeric DEFAULT 50000,             -- monthly fee in IDR
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON restaurant_subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON restaurant_subscriptions(status);

-- Add delivery zone fields to food_orders
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS delivery_zone text;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS order_ref text;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- RLS policies for delivery_zones
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurants manage own zones" ON delivery_zones
  FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "Public can read active zones" ON delivery_zones
  FOR SELECT USING (is_active = true);

-- RLS policies for restaurant_subscriptions
ALTER TABLE restaurant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurants view own subscription" ON restaurant_subscriptions
  FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
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
-- ── Restaurants v3 — payment, social, bank details ───────────────────────────
-- Adds bank transfer details (shown on payment card after order)
-- Adds social media links (shown in Follow Us panel)
-- hero_dish_url / hero_dish_name already in v1 schema; added defensively

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS bank_name            text,
  ADD COLUMN IF NOT EXISTS bank_account_number  text,
  ADD COLUMN IF NOT EXISTS bank_account_holder  text,
  ADD COLUMN IF NOT EXISTS instagram            text,
  ADD COLUMN IF NOT EXISTS tiktok               text,
  ADD COLUMN IF NOT EXISTS facebook             text;

-- Defensive: ensure v2 columns exist in case migrations run out of order
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS category             text,
  ADD COLUMN IF NOT EXISTS price_from           int,
  ADD COLUMN IF NOT EXISTS price_to             int,
  ADD COLUMN IF NOT EXISTS min_order            int,
  ADD COLUMN IF NOT EXISTS catering_available   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seating_capacity     int,
  ADD COLUMN IF NOT EXISTS event_features       text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_this_week   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dine_in_discount     int;

-- Owners can read/update their own bank + social details
-- (covered by existing restaurant_owner_all policy — no new policy needed)

-- Index: category browse (defensive recreation)
CREATE INDEX IF NOT EXISTS restaurants_category_idx ON restaurants(category, status, is_open);
-- ─────────────────────────────────────────────────────────────────────────────
-- 20300122  Restaurant Commission (10%)
-- Extends seller_commissions to carry a type (marketplace|restaurant) and the
-- actual rate used, and updates the RPC to accept both.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add type + rate columns ────────────────────────────────────────────────
alter table seller_commissions
  add column if not exists commission_type text not null default 'marketplace'
    check (commission_type in ('marketplace', 'restaurant')),
  add column if not exists rate            numeric(5,4) not null default 0.05;

create index if not exists idx_seller_commissions_type
  on seller_commissions(commission_type);

-- ── 2. Also track restaurant commissions on restaurant_orders ─────────────────
alter table restaurant_orders
  add column if not exists commission_amount  numeric(12,2),
  add column if not exists commission_status  text default 'none'
    check (commission_status in ('none','pending','paid','overdue','waived'));

-- ── 3. Replace record_commission RPC — now accepts type + rate ────────────────
create or replace function record_commission(
  p_seller_id       uuid,
  p_order_id        text,
  p_order_total     numeric(12,2),
  p_commission_type text    default 'marketplace',
  p_rate            numeric default 0.05
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_amount  numeric(12,2);
  v_comm_id uuid;
begin
  v_amount := round(p_order_total * p_rate, 2);

  insert into seller_commissions(seller_id, order_id, amount, commission_type, rate)
  values (p_seller_id, p_order_id, v_amount, p_commission_type, p_rate)
  returning id into v_comm_id;

  -- Mirror onto the matching order table
  if p_commission_type = 'marketplace' then
    update orders
    set commission_amount = v_amount,
        commission_status = 'pending'
    where id = p_order_id;
  elsif p_commission_type = 'restaurant' then
    update restaurant_orders
    set commission_amount = v_amount,
        commission_status = 'pending'
    where id = p_order_id;
  end if;

  return v_comm_id;
end;
$$;

-- ── 4. Updated balance RPC — optionally filter by type ───────────────────────
create or replace function get_seller_commission_balance(
  p_seller_id       uuid,
  p_commission_type text default null   -- null = all types
)
returns table(
  total_owed     numeric,
  total_paid     numeric,
  pending_count  bigint,
  overdue_count  bigint
)
language sql
security definer
as $$
  select
    coalesce(sum(case when status in ('pending','overdue') then amount else 0 end), 0),
    coalesce(sum(case when status = 'paid'                 then amount else 0 end), 0),
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'overdue')
  from seller_commissions
  where seller_id = p_seller_id
    and (p_commission_type is null or commission_type = p_commission_type);
$$;
-- ─────────────────────────────────────────────────────────────────────────────
-- 20300123  Restaurant payment methods — COD + Bank Transfer (3% discount)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add payment columns to restaurant_orders ───────────────────────────────
alter table restaurant_orders
  add column if not exists payment_method     text not null default 'cod'
    check (payment_method in ('cod', 'bank_transfer')),
  add column if not exists gross_total        numeric(12,2),   -- original before discount
  add column if not exists discount_amount    numeric(12,2) default 0,
  add column if not exists payment_proof_url  text,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists auto_confirm_at    timestamptz,     -- 15-min auto-confirm deadline
  add column if not exists qr_scanned_at      timestamptz,     -- driver barcode scan timestamp
  add column if not exists qr_scanned_by      uuid references auth.users(id);

-- ── 2. Index for payment status queries ──────────────────────────────────────
create index if not exists idx_restorders_payment_method
  on restaurant_orders(payment_method);

create index if not exists idx_restorders_auto_confirm
  on restaurant_orders(auto_confirm_at)
  where auto_confirm_at is not null and payment_confirmed_at is null;

-- ── 3. Auto-confirm bank-transfer orders after 15 min (cron) ─────────────────
create or replace function auto_confirm_bank_transfer_orders()
returns void
language sql
security definer
as $$
  update restaurant_orders
  set payment_confirmed_at = now(),
      commission_status     = 'pending'
  where payment_method      = 'bank_transfer'
    and payment_proof_url   is not null
    and payment_confirmed_at is null
    and auto_confirm_at     < now();
$$;

select cron.schedule(
  'auto-confirm-bank-transfer',
  '* * * * *',            -- every minute
  $$ select auto_confirm_bank_transfer_orders(); $$
) on conflict do nothing;

-- ── 4. RPC: record_commission_on_qr_scan ─────────────────────────────────────
-- Called when driver scans the restaurant QR (COD payment confirmed)
create or replace function record_commission_on_qr_scan(
  p_order_id  text,
  p_driver_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_seller_id  uuid;
  v_gross      numeric(12,2);
  v_comm_id    uuid;
begin
  select seller_id, coalesce(gross_total, total)
  into   v_seller_id, v_gross
  from   restaurant_orders
  where  id = p_order_id
    and  payment_method = 'cod'
    and  qr_scanned_at  is null;

  if not found then return null; end if;

  -- Mark order as QR-scanned
  update restaurant_orders
  set qr_scanned_at   = now(),
      qr_scanned_by   = p_driver_id
  where id = p_order_id;

  -- Record 10% commission
  insert into seller_commissions(seller_id, order_id, amount, commission_type, rate)
  values (v_seller_id, p_order_id, round(v_gross * 0.10, 2), 'restaurant', 0.10)
  returning id into v_comm_id;

  update restaurant_orders
  set commission_amount = round(v_gross * 0.10, 2),
      commission_status = 'pending'
  where id = p_order_id;

  return v_comm_id;
end;
$$;
