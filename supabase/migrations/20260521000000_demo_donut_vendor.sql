-- ═══════════════════════════════════════════════════════════
-- Demo Donut Vendor — seed for "Try Before You Sign Up" flow
-- ═══════════════════════════════════════════════════════════
-- Creates a fixed-UUID demo vendor row plus a small donut menu so
-- anyone landing on the donut app without a real ?vendor= param gets
-- a fully functional preview: chat, gateway probes, sales dashboard
-- all hit a real row instead of 400ing on a fake `local-demo-*` id.
--
-- Idempotent: re-runs are safe. Uses ON CONFLICT DO UPDATE so changes
-- to the demo content here flow through on next migration push.

-- Fixed demo UUID — referenced by App.jsx as DEMO_VENDOR_UUID.
-- Picked to be visually identifiable (ends in d0c0 ≈ "donut").
-- Update App.jsx if you ever change this.

insert into public.vendor_accounts (
  id,
  phone,
  password_hash,
  shop_name,
  shop_phone,
  slug,
  status,
  shop_food_type,
  shop_open,
  shop_address,
  shop_hours,
  module,
  plan_tier,
  url_active,
  delivery_enabled,
  delivery_currency,
  delivery_base_fee,
  delivery_per_km,
  delivery_min_charge,
  delivery_max_km
) values (
  '00000000-0000-0000-0000-00000000d0c0',
  '+0000000000', -- demo placeholder; never used to log in
  'DEMO_NO_LOGIN', -- can't be used to authenticate
  'Sweet Demo Donuts',
  '+62 812 0000 0000',
  'demo-donuts',
  'active',
  'Donut Shop',
  true,
  'Demo Street 1, Yogyakarta, Indonesia',
  '07:00 – 21:00',
  'food',
  'both',
  true,
  true,
  'Rp',
  5000,
  2000,
  7000,
  15
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  shop_food_type = excluded.shop_food_type,
  status = excluded.status,
  shop_open = excluded.shop_open,
  module = excluded.module,
  plan_tier = excluded.plan_tier,
  url_active = excluded.url_active;

-- Demo menu: 8 popular donut flavours. Photo URLs use the same
-- ImageKit/Supabase storage already in use elsewhere — replace with
-- real curated photos when you have them.
-- Deterministic UUIDs so re-runs upsert in place instead of duplicating.

insert into public.vendor_menu_items (id, vendor_id, name, price, description, category, photo_url, available, sort_order) values
  ('d00d0001-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Classic Glazed',     22000, 'Light & airy donut with a thin sugar glaze. The one that started it all.', 'Glazed',     'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-glazed.png',     true, 1),
  ('d00d0002-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Chocolate Sprinkle', 28000, 'Rich dark-chocolate coating finished with rainbow sprinkles.',              'Chocolate',  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-choco.png',      true, 2),
  ('d00d0003-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Strawberry Pink',    28000, 'Strawberry icing with a soft pink shimmer and dried berry crumb.',          'Fruit',      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-strawberry.png', true, 3),
  ('d00d0004-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Matcha Cloud',       32000, 'Stone-ground matcha glaze on a cloud-soft brioche donut.',                   'Specialty',  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-matcha.png',     true, 4),
  ('d00d0005-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Cookies & Cream',    32000, 'Vanilla cream-cheese glaze rolled in crushed chocolate biscuit.',           'Cream',      'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-cookies.png',    true, 5),
  ('d00d0006-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Caramel Pretzel',    30000, 'Salted-caramel drizzle with mini pretzel crunch on top.',                   'Specialty',  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-caramel.png',    true, 6),
  ('d00d0007-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Boston Cream',       32000, 'Filled with vanilla custard, topped with thick chocolate ganache.',         'Filled',     'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-boston.png',     true, 7),
  ('d00d0008-0000-0000-0000-00000000d0c0', '00000000-0000-0000-0000-00000000d0c0', 'Cinnamon Sugar',     22000, 'Warm-spiced cinnamon sugar dusted donut. Best with coffee.',                'Classic',    'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/donut-cinnamon.png',   true, 8)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  description = excluded.description,
  category = excluded.category,
  photo_url = excluded.photo_url,
  available = excluded.available,
  sort_order = excluded.sort_order;

-- Allow anon read on the demo vendor row so the customer-facing app
-- (which uses the anon key) can render its menu without auth. The
-- existing RLS policies on vendor_accounts already permit anon select
-- for active+url_active vendors in production, but we re-state here
-- to make the demo's accessibility explicit and survive future RLS
-- tightening.
-- (If your prod RLS already covers this case, this DO block is a no-op.)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='vendor_accounts' and policyname='Public read active vendor') then
    -- policy already exists, nothing to do
    null;
  else
    execute $p$
      create policy "Public read active vendor"
        on public.vendor_accounts for select
        using (status = 'active' and coalesce(url_active, true))
    $p$;
  end if;
end $$;
