-- Phase A of the FoodLocal Pro "ultimate dashboard" build:
--   hours + holidays, per-km delivery, modifier groups.
-- Wallet/top-up tables are intentionally left in place (data) but the UI
-- is being removed in the same release.

-- ── Hours & holidays ────────────────────────────────────────────────────────
-- Weekly schedule + date overrides as a single jsonb so we don't have to
-- ship a child table just for opening hours. Shape:
--   {
--     "mon": [{"open":"08:00","close":"22:00"}],
--     "tue": [{"open":"08:00","close":"14:00"},{"open":"17:00","close":"22:00"}],
--     ...
--     "holidays": [{"date":"2026-06-01","closed":true,"label":"Pancasila Day"}],
--     "busy_until": "2026-05-13T20:30:00Z"      -- nullable; auto-resume
--   }
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS hours jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Per-km delivery settings ────────────────────────────────────────────────
-- Vendor controls the price the customer sees in DeliveryBanner. Defaults
-- mirror GoSend so a vendor that never opens the page still gets a sane
-- estimate (matches food-basic). Shape:
--   {
--     "base_fare":    8000,   -- IDR for the first base_km kilometres
--     "base_km":      2,
--     "per_km":       3000,   -- IDR per km after base
--     "max_km":       15,     -- beyond this we show "too far"
--     "free_above":   100000, -- subtotal IDR for free delivery
--     "weekend_surcharge": 0  -- IDR added on Sat/Sun (optional)
--   }
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS delivery_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Modifier groups ─────────────────────────────────────────────────────────
-- Reusable groups (e.g. "Choose a size", "Add toppings") that can be
-- attached to many menu items. Matches Toast/Square. Replaces the
-- per-item-only variants/modifiers stored in extras for vendors who want
-- to manage them globally. Per-item extras remain for one-offs.
CREATE TABLE IF NOT EXISTS modifier_groups (
  id             bigserial    PRIMARY KEY,
  restaurant_id  bigint       NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           text         NOT NULL,                              -- "Choose a Size"
  min_select     int          NOT NULL DEFAULT 0,                    -- required if min > 0
  max_select     int          NOT NULL DEFAULT 1,                    -- 1 = radio; >1 = checkbox
  required       boolean      NOT NULL DEFAULT false,
  sort_order     int          NOT NULL DEFAULT 0,
  created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modifier_options (
  id              bigserial    PRIMARY KEY,
  group_id        bigint       NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name            text         NOT NULL,                             -- "Large"
  price_delta     numeric(12,0) NOT NULL DEFAULT 0,                   -- positive or negative
  is_default      boolean      NOT NULL DEFAULT false,
  is_available    boolean      NOT NULL DEFAULT true,                 -- 86-toggle on individual options
  sort_order      int          NOT NULL DEFAULT 0,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
  menu_item_id  bigint REFERENCES menu_items(id)      ON DELETE CASCADE,
  group_id      bigint REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order    int    NOT NULL DEFAULT 0,
  PRIMARY KEY (menu_item_id, group_id)
);

CREATE INDEX IF NOT EXISTS modifier_groups_restaurant_idx
  ON modifier_groups(restaurant_id, sort_order);
CREATE INDEX IF NOT EXISTS modifier_options_group_idx
  ON modifier_options(group_id, sort_order);

ALTER TABLE modifier_groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options         ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Public can read (so customer menu can render the groups); owners CRUD.
DROP POLICY IF EXISTS "modgroups_public_read"  ON modifier_groups;
DROP POLICY IF EXISTS "modgroups_owner_all"    ON modifier_groups;
CREATE POLICY "modgroups_public_read" ON modifier_groups FOR SELECT USING (true);
CREATE POLICY "modgroups_owner_all"   ON modifier_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

DROP POLICY IF EXISTS "modoptions_public_read"  ON modifier_options;
DROP POLICY IF EXISTS "modoptions_owner_all"    ON modifier_options;
CREATE POLICY "modoptions_public_read" ON modifier_options FOR SELECT USING (true);
CREATE POLICY "modoptions_owner_all"   ON modifier_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM modifier_groups g
    JOIN restaurants r ON r.id = g.restaurant_id
    WHERE g.id = group_id AND r.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "mimg_public_read"  ON menu_item_modifier_groups;
DROP POLICY IF EXISTS "mimg_owner_all"    ON menu_item_modifier_groups;
CREATE POLICY "mimg_public_read" ON menu_item_modifier_groups FOR SELECT USING (true);
CREATE POLICY "mimg_owner_all"   ON menu_item_modifier_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menu_items m
    JOIN restaurants r ON r.id = m.restaurant_id
    WHERE m.id = menu_item_id AND r.owner_id = auth.uid()
  ));
