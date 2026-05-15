# Vendor Onboarding — Native App Wrap

Send this as a form (Google Form, Typeform, or shared doc) to the vendor when they sign up. Required to start the build.

---

## A. Legal & business

- [ ] **Legal business name:** _______________________ (must match Apple/Google dev account name)
- [ ] **Trade / display name:** _______________________ (what customers see)
- [ ] **Country of registration:** _______________________
- [ ] **Tax / VAT number** (if applicable): _______________________
- [ ] **Signed Service Agreement** — attach signed PDF

## B. App identity

- [ ] **App name** (max 30 chars Apple, 50 chars Google): _______________________
- [ ] **Subtitle / tagline** (max 30 chars): _______________________
- [ ] **App description — short** (max 80 chars): _______________________
- [ ] **App description — long** (max 4000 chars, marketing copy): _______________________
- [ ] **Bundle ID / Package name** (e.g. `com.donutking.app`): _______________________
- [ ] **App category**: Food & Drink (default) / Business / Lifestyle

## C. Brand assets

- [ ] **Logo** — 2048×2048 PNG, transparent background, no rounded corners (Apple auto-rounds)
- [ ] **Primary brand color** (hex): `#__________`
- [ ] **Secondary / accent color** (hex, optional): `#__________`
- [ ] **Splash background** — solid color or image (1242×2436 for iOS, 1080×1920 for Android)
- [ ] **In-app font preference**: system default / specific Google Font name

## D. Marketing screenshots (per platform)

We need 5 screenshots each. Two options:

**Option 1 — vendor provides:**
- 5× iPhone screenshots (1290×2796 for 6.7" display)
- 5× Android screenshots (1080×1920)
- Each can include marketing overlay text

**Option 2 — we capture from their PWA** (default if not provided):
- Provide their PWA URL — we capture menu, cart, checkout, order, chat
- Add marketing text overlays
- Approved before submission

## E. Developer accounts (vendor handles)

- [ ] **Apple Developer Team ID** (after they sign up at $99/year): _______________________
- [ ] **Apple Developer email** (for invite to App Store Connect): _______________________
- [ ] **Google Play Developer email** (after $25 signup): _______________________
- [ ] **Delegate access granted to StreetLocal** — confirmation that they added our email as Admin in both consoles

## F. Store listing details

- [ ] **Support URL** (where customers go for help): _______________________
- [ ] **Marketing URL** (vendor's main website if any): _______________________
- [ ] **Support email**: _______________________
- [ ] **Support phone** (optional, recommended): _______________________
- [ ] **Privacy policy URL** — vendor hosts on their website using `PRIVACY_POLICY_TEMPLATE.md` filled in
- [ ] **Promotional text** (max 170 chars, can update without re-review): _______________________

## G. Vendor-specific config

- [ ] **Vendor ID in StreetLocal** (UUID from `vendor_accounts.id`): _______________________
- [ ] **Vendor slug** (URL-safe, e.g. `donut-king`): _______________________
- [ ] **Default city** (for menu/delivery rendering): _______________________
- [ ] **Default country code** (ISO 2-letter, drives currency): _______________________

## H. Data declarations (Apple + Google require)

Confirm by ticking which data the app collects (we pre-fill based on our backend):

- [x] Contact info (email, phone) — for orders + chat
- [x] Location — for delivery address + nearest shop
- [x] Identifiers — for vendor + customer linking
- [x] Purchases — order history
- [x] Usage data — for sales analytics
- [ ] **Sensitive info** (financial info beyond purchases, health, race, etc.) — **must be none**
- [ ] **Tracking across apps** — **must be none** (we don't share with third parties)

## I. Optional add-ons (Premium / Enterprise only)

Tick if requesting:

- [ ] Custom animated splash screen
- [ ] Push notification campaign setup
- [ ] App Store Optimization (ASO) — keyword tuning per city
- [ ] Apple Pay / Google Pay deep integration
- [ ] NFC loyalty tap integration
- [ ] Beacon-triggered offers
- [ ] Accounting software bridge (specify which: Xero / QuickBooks / Wave / other)
- [ ] Multi-app management (chain with 5+ locations — list locations)

## J. Timeline expectations

- [ ] Vendor acknowledges: **Standard wrap takes ~14 days** from intake to live in both stores
- [ ] Vendor acknowledges: **Apple review can reject** — fixes add 1–3 days
- [ ] Vendor acknowledges: **First month maintenance starts** when app goes live in stores
- [ ] Vendor acknowledges: **6-month minimum** on maintenance subscription

## K. Sign-off

Vendor signature: _______________________ Date: _______________________

StreetLocal sign-off: _______________________ Date: _______________________

Project ID: _______________________ (assigned by us — used to track the build)
