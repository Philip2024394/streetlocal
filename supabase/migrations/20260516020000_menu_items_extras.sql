-- Menu-item feature parity with food-basic. The basic app stores ~20 extra
-- fields per item (perks, variants, modifiers, allergens, dietary, stock,
-- portion, etc.). To keep schema light, the lower-frequency fields live
-- inside a single `extras` JSONB column, while the high-traffic filterable
-- ones (promo pricing, badges, stock) stay top-level for indexing.
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS original_price numeric(12,0),
  ADD COLUMN IF NOT EXISTS promo_price    numeric(12,0),
  ADD COLUMN IF NOT EXISTS spice          smallint  DEFAULT 0  CHECK (spice BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS halal          boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popular        boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock          integer,                          -- null = unlimited; 0 = sold out
  ADD COLUMN IF NOT EXISTS extras         jsonb     NOT NULL DEFAULT '{}'::jsonb;
-- extras keys: photos, allergens, dietary, portion, portion_size, variants,
-- modifiers, perks, perk_text, perk_limit. Renderers should treat any
-- missing key as empty (UI builds the form fields dynamically from extras).

CREATE INDEX IF NOT EXISTS menu_items_popular_idx ON menu_items(restaurant_id) WHERE popular = true;
CREATE INDEX IF NOT EXISTS menu_items_stock_idx   ON menu_items(restaurant_id) WHERE stock IS NOT NULL AND stock <= 5;
