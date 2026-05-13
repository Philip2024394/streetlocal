-- Design Studio settings for foodlocal-pro restaurants. Mirrors the
-- food-basic vendor design studio: logo style, hero text/font/color,
-- landing layout, button style/color/text/effect, menu card layout,
-- banner carousel, promo banner, splash screen.
--
-- All settings live in a single jsonb so the schema doesn't need a column
-- per knob. Restaurants without a row get the default rendering.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS shop_logo text,
  ADD COLUMN IF NOT EXISTS theme     jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Expected theme keys (all optional; client falls back to sane defaults):
--   logo_style        'circle' | 'bare' | 'off'
--   logo_scale        50–300         (percent)
--   logo_inner        40–100         (percent, only for circle)
--   logo_offset_x     -40..40        (px nudge)
--   logo_offset_y     -40..40        (px nudge)
--   hero_font         'system' | 'nunito' | 'poppins' | 'playfair' | 'caveat' | 'bebas'
--   hero_color        hex string
--   hero_sub_color    hex string
--   landing_layout    'center' | 'footer' | 'left'
--   overlay_opacity   0–80           (percent)
--   btn_shape         'rounded' | 'pill' | 'square'
--   btn_color         hex string ('' = use accent)
--   btn_text          string (max 20)
--   btn_size          60–160         (percent)
--   btn_effect        'none' | 'glow' | 'shake' | 'signal' | 'heartbeat'
--   tagline           string (max 60, supports one newline)
--   menu_card_style   'horizontal' | 'grid' | 'fullwidth'
--   menu_banners      string[]       (up to 5 URLs)
--   promo_banner      string         (max 300)
--   promo_enabled     bool
--   promo_effect      'scroll' | 'wave' | 'glow' | 'pulse' | 'fade' | 'shake'
--   splash_enabled    bool
