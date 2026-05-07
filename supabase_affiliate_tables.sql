-- ═══════════════════════════════════════════════════════════
-- StreetLocal Affiliate Programme — Supabase Tables
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Affiliate Agents Table
CREATE TABLE IF NOT EXISTS affiliate_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  agent_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'pending_verification', 'active', 'suspended', 'cancelled')),
  total_clicks INTEGER DEFAULT 0,

  -- Payment
  payment_proof TEXT,
  paid_at TIMESTAMPTZ,

  -- Bank verification
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  ktp_url TEXT,
  verification_status TEXT DEFAULT 'none'
    CHECK (verification_status IN ('none', 'submitted', 'verified', 'rejected')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Affiliate Referrals Table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES affiliate_agents(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  app_type TEXT,
  app_tier TEXT,
  registration_id UUID,
  commission_amount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Affiliate Seat Limits (per country)
CREATE TABLE IF NOT EXISTS affiliate_seat_limits (
  id TEXT PRIMARY KEY,  -- country code e.g. 'ID'
  country_name TEXT NOT NULL,
  max_seats INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Indonesia seat limit
INSERT INTO affiliate_seat_limits (id, country_name, max_seats)
VALUES ('ID', 'Indonesia', 1000)
ON CONFLICT (id) DO NOTHING;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_agents_country ON affiliate_agents(country);
CREATE INDEX IF NOT EXISTS idx_affiliate_agents_status ON affiliate_agents(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_agents_agent_code ON affiliate_agents(agent_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_agent_id ON affiliate_referrals(agent_id);

-- 5. RLS Policies (enable Row Level Security)
ALTER TABLE affiliate_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_seat_limits ENABLE ROW LEVEL SECURITY;

-- Allow public read for seat limits (to show remaining seats)
CREATE POLICY "Public read seat limits"
  ON affiliate_seat_limits FOR SELECT
  USING (true);

-- Allow public insert for agent signup
CREATE POLICY "Public insert agents"
  ON affiliate_agents FOR INSERT
  WITH CHECK (true);

-- Allow public read/update for agents (they need to see their own data)
CREATE POLICY "Public read agents"
  ON affiliate_agents FOR SELECT
  USING (true);

CREATE POLICY "Public update agents"
  ON affiliate_agents FOR UPDATE
  USING (true);

-- Allow public read/insert for referrals
CREATE POLICY "Public read referrals"
  ON affiliate_referrals FOR SELECT
  USING (true);

CREATE POLICY "Public insert referrals"
  ON affiliate_referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update referrals"
  ON affiliate_referrals FOR UPDATE
  USING (true);

-- 6. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliate_agents_updated_at
  BEFORE UPDATE ON affiliate_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
