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
