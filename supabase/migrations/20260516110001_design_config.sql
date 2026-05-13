-- Phase L cross-device sync for Design Studio tokens.
ALTER TABLE vendor_accounts
  ADD COLUMN IF NOT EXISTS design_config jsonb NOT NULL DEFAULT '{}'::jsonb;
