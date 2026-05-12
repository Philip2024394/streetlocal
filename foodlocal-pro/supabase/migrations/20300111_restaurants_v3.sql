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
