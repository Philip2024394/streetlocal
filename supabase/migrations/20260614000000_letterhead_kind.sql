-- letterhead_kind — add 'letterhead' to the vendor_image_library kind
-- enum so curated invoice paper backgrounds can be stored and picked
-- alongside logos / menu items / banners / etc.

alter table public.vendor_image_library
  drop constraint if exists vendor_image_library_kind_check;

alter table public.vendor_image_library
  add constraint vendor_image_library_kind_check check (kind in (
    'logo','hero','bouncing','bottom_left','flavour_orb','bg',
    'menu_item','donut_card','loyalty','banner','box','packet',
    'letterhead','other'
  ));
