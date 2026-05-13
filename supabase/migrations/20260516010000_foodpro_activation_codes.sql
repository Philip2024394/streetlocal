-- Sales-driven activation codes for FoodLocal Pro. Mirrors food-basic's
-- activation_codes table but targets the restaurants table (bigint id)
-- instead of vendor_accounts (uuid). A sales person collects payment from
-- the restaurant offline, then hands over a code which the restaurant
-- enters on the activation page to go live for 30 days.
CREATE TABLE IF NOT EXISTS foodpro_activation_codes (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text          UNIQUE NOT NULL,
  plan_tier           text          NOT NULL CHECK (plan_tier IN ('whatsapp', 'chat')),
  price               integer       NOT NULL,
  status              text          NOT NULL DEFAULT 'unused'
                      CHECK (status IN ('unused', 'used', 'revoked')),
  used_by_restaurant  bigint        REFERENCES restaurants(id) ON DELETE SET NULL,
  used_at             timestamptz,
  period_days         integer       NOT NULL DEFAULT 30,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  created_by          text,                                  -- sales person / admin who generated it
  notes               text
);

CREATE INDEX IF NOT EXISTS foodpro_activation_codes_code_idx
  ON foodpro_activation_codes(code) WHERE status = 'unused';
CREATE INDEX IF NOT EXISTS foodpro_activation_codes_status_idx
  ON foodpro_activation_codes(status, created_at DESC);

ALTER TABLE foodpro_activation_codes ENABLE ROW LEVEL SECURITY;
-- Codes are admin-only. Insert/select via service role from sales tools.
-- Restaurant-side validation goes through the activate edge function so
-- the anon key never reads the code list directly.

-- Track activation_code usage on the foodpro_payment_records ledger.
ALTER TABLE foodpro_payment_records
  ADD COLUMN IF NOT EXISTS activation_code text,
  ADD COLUMN IF NOT EXISTS collected_by    text;
