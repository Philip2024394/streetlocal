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
