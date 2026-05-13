-- Phase D: multi-location chains, staff & roles, notifications, POS slots.

-- ── Multi-location ──────────────────────────────────────────────────────────
-- A brand/chain group can hold many restaurant locations. Owners can see
-- aggregated metrics across all branches and switch context to any one of
-- them. Single-location restaurants leave group_id NULL.
CREATE TABLE IF NOT EXISTS restaurant_groups (
  id         bigserial   PRIMARY KEY,
  owner_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text        NOT NULL,                        -- "Warung Pak Joko" (brand)
  logo_url   text,
  brand_color text,                                       -- hex, optional
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS group_id      bigint REFERENCES restaurant_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_label  text;          -- "Kemang", "Sudirman", etc.

CREATE INDEX IF NOT EXISTS restaurants_group_idx ON restaurants(group_id);

ALTER TABLE restaurant_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_owner_all" ON restaurant_groups;
CREATE POLICY "groups_owner_all" ON restaurant_groups FOR ALL USING (owner_id = auth.uid());

-- ── Staff & roles ───────────────────────────────────────────────────────────
-- Per-restaurant ACL. The owner is implicit (restaurants.owner_id); staff
-- rows extend access to additional users with scoped permissions.
CREATE TABLE IF NOT EXISTS restaurant_staff (
  id              bigserial    PRIMARY KEY,
  restaurant_id   bigint       NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         uuid         REFERENCES profiles(id) ON DELETE CASCADE,
  invite_email    text,                                  -- for pending invites before user signs up
  invite_phone    text,
  invite_token    text,                                  -- one-time token for the invite link
  display_name    text,
  role            text         NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('manager','chef','cashier','viewer')),
  status          text         NOT NULL DEFAULT 'invited'
                  CHECK (status IN ('invited','active','disabled')),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  activated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS restaurant_staff_restaurant_idx ON restaurant_staff(restaurant_id, status);
CREATE INDEX IF NOT EXISTS restaurant_staff_user_idx       ON restaurant_staff(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_owner_all" ON restaurant_staff;
CREATE POLICY "staff_owner_all" ON restaurant_staff FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
DROP POLICY IF EXISTS "staff_self_read" ON restaurant_staff;
CREATE POLICY "staff_self_read" ON restaurant_staff FOR SELECT USING (user_id = auth.uid());

-- ── Notification prefs ──────────────────────────────────────────────────────
-- Per-restaurant channel preferences. Shape:
--   {
--     "new_order":      { "sound": true,  "push": true,  "whatsapp": false, "email": false },
--     "payment_paid":   { "sound": false, "push": true,  "whatsapp": true,  "email": false },
--     "review_posted":  { "sound": false, "push": false, "whatsapp": false, "email": true },
--     "refund_requested":{...},
--     "low_stock":      {...},
--     "quiet_from":     "22:00",
--     "quiet_to":       "07:00",
--     "wa_target":      "6281234567890"
--   }
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── POS integration slots ───────────────────────────────────────────────────
-- Placeholders for Toast / Square / Loyverse adapters. Storage only — the
-- actual sync workers ship in a later phase.
CREATE TABLE IF NOT EXISTS pos_integrations (
  id            bigserial    PRIMARY KEY,
  restaurant_id bigint       NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  provider      text         NOT NULL
                CHECK (provider IN ('toast','square','loyverse','clover','lightspeed','custom')),
  api_key       text,                                    -- encrypted at rest by Supabase if pgsodium is enabled
  api_secret    text,
  webhook_secret text,
  external_account_id text,
  is_active     boolean      NOT NULL DEFAULT false,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, provider)
);
CREATE INDEX IF NOT EXISTS pos_integrations_restaurant_idx ON pos_integrations(restaurant_id);

ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_owner_all" ON pos_integrations;
CREATE POLICY "pos_owner_all" ON pos_integrations FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
