-- ═══════════════════════════════════════════════════════════
-- Loyalty card background image.
--
-- Vendor uploads a branded image which replaces the default accent
-- gradient on the loyalty card shown to customers. Lives on the
-- vendor record (not localStorage only) so a customer landing on
-- the shop from a fresh device sees the correct branded card.
-- ═══════════════════════════════════════════════════════════

alter table public.vendor_accounts
  add column if not exists loyalty_card_image text;
