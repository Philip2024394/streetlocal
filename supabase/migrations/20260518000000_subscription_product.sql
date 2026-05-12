-- Vendor's subscribed product (basic vs pro).
-- Combined with plan_tier this fully describes what the vendor is paying for:
--   product='basic' + plan_tier='whatsapp' → FoodLocal basic WhatsApp, Rp 35.000
--   product='basic' + plan_tier='chat'     → FoodLocal basic Chat,     Rp 50.000
--   product='basic' + plan_tier='both'     → FoodLocal basic picker,   Rp 50.000
--   product='pro'   + plan_tier='whatsapp' → FoodLocal Pro WhatsApp,   Rp 100.000
--   product='pro'   + plan_tier='chat'     → FoodLocal Pro Chat,       Rp 150.000
--
-- Existing vendors default to 'basic' so anyone signed up before today
-- keeps their current pricing. New vendors choose at activation.

alter table public.vendor_accounts
  add column if not exists subscription_product text not null default 'basic'
    check (subscription_product in ('basic', 'pro'));

create index if not exists vendor_accounts_subscription_product_idx
  on public.vendor_accounts (subscription_product);
