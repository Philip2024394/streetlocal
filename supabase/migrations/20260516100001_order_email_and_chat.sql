-- Customer-side fields for Phase K:
--   1. customer_email      — for Shopify-style transactional receipts.
--   2. chat_messages       — JSONB array for in-app customer ↔ vendor thread.
--   3. receipt_sent_at     — idempotency stamp for the receipt edge function.
--
-- Already applied via `supabase db query` on 2026-05-14. This file exists so
-- future fresh-installs replay it.

ALTER TABLE vendor_orders
  ADD COLUMN IF NOT EXISTS customer_email   text,
  ADD COLUMN IF NOT EXISTS chat_messages    jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS receipt_sent_at  timestamptz;

DO $$ BEGIN
  IF to_regclass('public.food_orders') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE food_orders
              ADD COLUMN IF NOT EXISTS customer_email   text,
              ADD COLUMN IF NOT EXISTS chat_messages    jsonb NOT NULL DEFAULT ''[]''::jsonb,
              ADD COLUMN IF NOT EXISTS receipt_sent_at  timestamptz';
  END IF;
END $$;
