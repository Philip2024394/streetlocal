-- Channel flip — every vendor (restaurant, product seller, service provider)
-- declares which inbound channels they accept orders on:
--   { "whatsapp": { "enabled": true,  "phone":   "6281234567890" },
--     "chat":     { "enabled": true },
--     "email":    { "enabled": false, "address": "" } }
--
-- The customer-facing app reads this and renders ONE checkout button
-- when a single channel is enabled, or a picker when multiple are.
--
-- Defaults handled in client code:
--   - food apps default to { whatsapp: enabled, chat: enabled }
--   - products/services default to { whatsapp: enabled, chat: enabled, email: enabled }
-- A null/empty `channels` value means "use defaults" — never "no channels".

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS channels jsonb;

ALTER TABLE vendor_accounts
  ADD COLUMN IF NOT EXISTS channels jsonb;

-- For products/services vendors created BEFORE this migration we set a
-- sensible default so their existing menu page doesn't suddenly show
-- "no order channels available." Restaurants without channels remain
-- null and the client substitutes the food default.
UPDATE vendor_accounts
SET channels = jsonb_build_object(
  'whatsapp', jsonb_build_object('enabled', true,  'phone', COALESCE(shop_phone, phone, '')),
  'chat',     jsonb_build_object('enabled', true),
  'email',    jsonb_build_object('enabled', false, 'address', '')
)
WHERE channels IS NULL
  AND module IN ('products', 'services');
