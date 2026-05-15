/* ─────────────────────────────────────────────────────────────
   StreetLocal curated image stock — donut vertical.
   Seeds the "Stock" tab of the vendor's image picker so a new
   donut shop can launch with professional artwork before
   uploading their own photos. All assets are hosted on the
   shared ImageKit CDN — same origin / cache pool as vendor
   uploads, free for everyone, no per-vendor cost.

   Structure: kind → array of { id, url, label }.
   The picker reads STREETLOCAL_STOCK[kind] for whichever slot
   the vendor is editing (Bouncing donut tab → 'bouncing', etc.).

   Adding new stock: drop the file in ImageKit, append a row.
   id stays stable across releases so analytics can track which
   stock images are most-picked.

   STATUS as of 2026-05-15: box / packet / logo stock awaiting
   curated artwork from Philip — the picker shows an empty
   state with a "more coming soon" message until they land.
   ───────────────────────────────────────────────────────────── */

const IK = 'https://ik.imagekit.io/nepgaxllc'

// ── Canonical donut photo set ─────────────────────────────────
// One list, shared across every kind that takes a donut close-up
// (bouncing, flavour_orb, menu_item, bottom_left, hero). Adding a
// new donut here makes it appear in all five tabs at once — no
// duplication, no drift.
const DONUT_PHOTOS = [
  { id: 'donut-sprinkle-01',  url: `${IK}/ChatGPT%20Image%20May%2014,%202026,%2004_26_20%20AM.png?updatedAt=1778707604129`, label: 'Sprinkle ring' },
  { id: 'donut-stack-02',     url: `${IK}/ChatGPT%20Image%20May%2014,%202026,%2004_30_51%20AM.png?updatedAt=1778707873204`, label: 'Stacked donuts' },
  { id: 'donut-pink-03',      url: `${IK}/Untitledasdaaaavdddddd-removebg-preview.png?updatedAt=1778755981652`,             label: 'Strawberry frosted' },
  { id: 'donut-boston-04',    url: `${IK}/ChatGPT%20Image%20May%2014,%202026,%2008_45_54%20PM.png?updatedAt=1778766378697`, label: 'Boston cream' },
  { id: 'donut-choc-05',      url: `${IK}/ChatGPT%20Image%20May%2014,%202026,%2009_19_03%20PM.png?updatedAt=1778768356541`, label: 'Chocolate frosted' },
  { id: 'donut-pink-ring-06', url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2002_57_14%20AM.png?updatedAt=1778788652311`, label: 'Strawberry ring' },
  { id: 'donut-07',           url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2003_00_31%20AM.png?updatedAt=1778788848727`, label: 'Donut 7' },
  { id: 'donut-08',           url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2003_08_54%20AM.png?updatedAt=1778789350948`, label: 'Donut 8' },
  { id: 'donut-09',           url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2003_15_51%20AM.png?updatedAt=1778789768369`, label: 'Donut 9' },
  { id: 'donut-10',           url: `${IK}/ChatGPT%20Image%20May%2016,%202026,%2012_13_01%20AM.png`,                          label: 'Donut 10' },
  { id: 'donut-11',           url: `${IK}/kkl-removebg-preview.png`,  label: 'Donut 11' },
  { id: 'donut-12',           url: `${IK}/23-removebg-preview.png`,   label: 'Donut 12' },
  { id: 'donut-13',           url: `${IK}/fg-removebg-preview.png`,   label: 'Donut 13' },
  { id: 'donut-14',           url: `${IK}/ewr-removebg-preview.png`,  label: 'Donut 14' },
  { id: 'donut-15',           url: `${IK}/oiu-removebg-preview.png`,  label: 'Donut 15' },
]

export const STREETLOCAL_STOCK = {
  // Every donut close-up kind shares the same DONUT_PHOTOS pool so
  // the vendor sees the full curated set regardless of which slot
  // they're editing. The picker filters by current selection / search
  // independently — pool size doesn't bloat per slot.
  bouncing:    DONUT_PHOTOS,
  flavour_orb: DONUT_PHOTOS,
  menu_item:   DONUT_PHOTOS,
  bottom_left: DONUT_PHOTOS,

  // Large hero illustration — centre stage on Classic / Glass themes.
  // Shares the donut pool plus a dedicated high-res hero asset.
  hero: [
    { id: 'donut-hero-01', url: `${IK}/Untitleddasddasdfssdfsdfsdsdasdss-removebg-preview.png`, label: 'Iced ring hero' },
    ...DONUT_PHOTOS,
  ],

  // Full-screen splash background — the painted shop / counter scenes.
  bg: [
    { id: 'bg-pink-01',     url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2001_57_58%20PM.png`, label: 'Pink shop counter' },
    { id: 'bg-choco-02',    url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2002_07_42%20PM.png`, label: 'Chocolate counter' },
    { id: 'bg-cream-03',    url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2002_00_09%20PM.png`, label: 'Cream counter' },
    { id: 'bg-pink-st-04',  url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2002_15_02%20PM.png`, label: 'Pink storefront' },
    { id: 'bg-choco-st-05', url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2002_11_16%20PM.png`, label: 'Chocolate storefront' },
    { id: 'bg-cream-st-06', url: `${IK}/ChatGPT%20Image%20May%2015,%202026,%2002_16_59%20PM.png`, label: 'Cream storefront' },
  ],

  // Donut boxes — drop-in product shots for banners + menu cards.
  box: [
    { id: 'box-01', url: `${IK}/ChatGPT%20Image%20May%2016,%202026,%2012_16_40%20AM.png`, label: 'Donut box 1' },
    { id: 'box-02', url: `${IK}/ChatGPT%20Image%20May%2016,%202026,%2012_05_20%20AM.png`, label: 'Donut box 2' },
    { id: 'box-03', url: `${IK}/ChatGPT%20Image%20May%2016,%202026,%2012_07_39%20AM.png`, label: 'Donut box 3' },
    { id: 'box-04', url: `${IK}/Untitleddasddasdfssdfsdfsdsdasdss-removebg-preview.png?updatedAt=1778709327562`, label: 'Donut box 4' },
  ],

  // Curated invoice / letterhead paper backgrounds. A4 portrait.
  // Vendor picks one in Settings → Invoices → Letterhead, or uploads
  // their own.
  letterhead: [
    { id: 'letterhead-01', url: `${IK}/ChatGPT%20Image%20May%2016,%202026,%2002_59_26%20AM.png`, label: 'Pink ribbon' },
    { id: 'letterhead-02', url: `${IK}/ChatGPT%20Image%20May%2016,%202026,%2002_56_12%20AM.png`, label: 'Pink crest' },
  ],

  // Awaiting curated artwork — picker shows an empty state with a
  // "Upload your own for now" prompt until these arrays fill.
  packet: [],
  logo:   [],

  // Generic fallback bucket — used when the picker is opened without
  // a specific kind. Left empty so the picker pulls from all kinds.
  other:  [],
}

// Friendly label shown in the picker header for each kind.
export const KIND_LABEL = {
  logo:        'Logo',
  hero:        'Hero artwork',
  bouncing:    'Bouncing donut',
  bottom_left: 'Bottom-left donut',
  flavour_orb: 'Flavour orb',
  bg:          'Background',
  menu_item:   'Menu item photo',
  donut_card:  'Menu card background',
  loyalty:     'Loyalty card',
  banner:      'Marketing banner',
  box:         'Donut box',
  packet:      'Donut packet',
  letterhead:  'Invoice letterhead',
  other:       'Image',
}
