-- Subscription columns for foodlocal-pro restaurants.
-- FoodLocal Pro is a flat monthly subscription: Rp 100.000 (WhatsApp orders)
-- or Rp 150.000 (in-app chat orders). On Midtrans settlement, the
-- foodpro-subscription-webhook flips url_active to true so the restaurant
-- goes live for customers, and stamps expires_at = now + 30 days.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS subscription_order_id    text,
  ADD COLUMN IF NOT EXISTS subscription_provider    text,           -- 'midtrans' for v1
  ADD COLUMN IF NOT EXISTS subscription_product     text DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS subscription_tier        text,           -- 'whatsapp' | 'chat'
  ADD COLUMN IF NOT EXISTS subscription_renew_at    timestamptz,
  ADD COLUMN IF NOT EXISTS plan_started_at          timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at             timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at               timestamptz,
  ADD COLUMN IF NOT EXISTS url_active               boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS restaurants_subscription_order_idx
  ON restaurants(subscription_order_id);
CREATE INDEX IF NOT EXISTS restaurants_url_active_idx
  ON restaurants(url_active) WHERE url_active = true;

-- Payment ledger for foodlocal-pro subscription charges. Independent of
-- food-basic's payment_records so the two apps stay separable.
CREATE TABLE IF NOT EXISTS foodpro_payment_records (
  id                          bigserial      PRIMARY KEY,
  restaurant_id               bigint         REFERENCES restaurants(id) ON DELETE SET NULL,
  amount                      numeric(12,0)  NOT NULL,
  period_start                timestamptz    NOT NULL DEFAULT now(),
  period_end                  timestamptz    NOT NULL,
  status                      text           NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','paid','failed','refunded')),
  payment_method              text,
  midtrans_order_id           text           UNIQUE,
  midtrans_transaction_id     text,
  midtrans_transaction_status text,
  verified_at                 timestamptz,
  verified_by                 text,
  notes                       text,
  created_at                  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS foodpro_payments_restaurant_idx
  ON foodpro_payment_records(restaurant_id, created_at DESC);

ALTER TABLE foodpro_payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "foodpro_payments_owner_read" ON foodpro_payment_records;
CREATE POLICY "foodpro_payments_owner_read" ON foodpro_payment_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
