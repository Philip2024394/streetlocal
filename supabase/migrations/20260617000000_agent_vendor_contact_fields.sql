-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Agent + Vendor contact / location fields
-- Date: 2026-05-17
--
-- Captures professional contact + location records for both sides of the
-- platform: the affiliate agents who refer business, and the vendors (donut
-- shop owners) who pay the monthly subscription.
--
-- Already-applied state: these ALTER statements were run live against the
-- Supabase project (ref: fjvafjkzvygkhiwjuvla) via the CLI on the same day
-- the affiliate dashboard rebuild + vendor settings 'Contact & location'
-- card shipped. IF NOT EXISTS guards make this idempotent — safe to re-run
-- on fresh environments or staging clones.
--
-- Why these columns:
--   - The affiliate dashboard's Profile & KYC section needs email + photo
--     + city + NPWP (Indonesian tax ID).
--   - The vendor signup flow (VendorLoginPage + ActivatePage) and Shop Config
--     'Contact & location' card need owner-level contact details that are
--     SEPARATE from the shop-level fields (shop_name vs owner_name,
--     order_email vs owner_email) so support can reach the human running
--     the business, not just the order channel.
--   - city + province let us slice cohort analytics by region — useful for
--     understanding where the donut programme is gaining traction in
--     Indonesia, and for any future regional marketing.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── affiliate_agents ──────────────────────────────────────────────────────
-- Existing columns kept: name, country, whatsapp, agent_code, status,
-- total_clicks, bank_name, bank_account, bank_holder, ktp_url,
-- verification_status, payment_proof, paid_at, created_at, updated_at.
-- New: email, photo_url, city, npwp.
ALTER TABLE affiliate_agents
  ADD COLUMN IF NOT EXISTS email     TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS city      TEXT,
  ADD COLUMN IF NOT EXISTS npwp      TEXT;

COMMENT ON COLUMN affiliate_agents.email     IS 'Primary contact email for the agent (separate from WhatsApp).';
COMMENT ON COLUMN affiliate_agents.photo_url IS 'Profile photo URL — uploaded via dashboard, stored in assets bucket.';
COMMENT ON COLUMN affiliate_agents.city      IS 'Free-text city/town the agent operates from. Any country, any city.';
COMMENT ON COLUMN affiliate_agents.npwp      IS 'Indonesian tax ID — optional, shown in dashboard only when country = ID.';

-- ── vendor_accounts ──────────────────────────────────────────────────────
-- Existing columns kept: shop_name, shop_phone, shop_address, phone,
-- country_locked, country_detected_ip, plan_level, status, order_email,
-- invoice_autosend_email, receipt_autosend_email, etc.
-- New: owner_name, owner_email, owner_whatsapp, city, province.
ALTER TABLE vendor_accounts
  ADD COLUMN IF NOT EXISTS owner_name     TEXT,
  ADD COLUMN IF NOT EXISTS owner_email    TEXT,
  ADD COLUMN IF NOT EXISTS owner_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS province       TEXT;

COMMENT ON COLUMN vendor_accounts.owner_name     IS 'The actual person running the shop (separate from shop_name which is the business name).';
COMMENT ON COLUMN vendor_accounts.owner_email    IS 'Primary owner contact email (separate from order_email / invoice_autosend_email which are channel-specific).';
COMMENT ON COLUMN vendor_accounts.owner_whatsapp IS 'Owner''s personal WhatsApp — WhatsApp-first contact channel in Indonesia.';
COMMENT ON COLUMN vendor_accounts.city           IS 'Specific city/town the shop operates in (e.g. Yogyakarta, Jakarta, Bandung).';
COMMENT ON COLUMN vendor_accounts.province       IS 'Province / state — Indonesia: DI Yogyakarta, Jawa Barat, Bali, etc. International: state.';

-- ── Indexes for analytics queries ─────────────────────────────────────────
-- City + province get queried for cohort reports ('shops in Yogyakarta',
-- 'agents in Jakarta'). Index both for fast group-by.
CREATE INDEX IF NOT EXISTS idx_affiliate_agents_city   ON affiliate_agents(city);
CREATE INDEX IF NOT EXISTS idx_vendor_accounts_city    ON vendor_accounts(city);
CREATE INDEX IF NOT EXISTS idx_vendor_accounts_province ON vendor_accounts(province);
