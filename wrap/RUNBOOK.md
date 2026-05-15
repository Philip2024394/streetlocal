# Per-Vendor Delivery Runbook

Every step from "vendor signs the agreement" to "app live in stores". Aim: complete in 14 days for Standard tier, 21 days for Premium.

## Day 0 — Intake

- [ ] Vendor signs the Service Agreement (use `SERVICE_AGREEMENT_TEMPLATE.md` filled in).
- [ ] Vendor pays the setup fee in full ($499 Standard / $999 Premium / $2,499 Enterprise). Use Stripe Payment Link or equivalent. **Non-refundable** once work starts.
- [ ] Vendor completes `VENDOR_ONBOARDING.md` form. Collect:
  - Bakery name (legal name + display name)
  - App name (max 30 chars for Apple, 50 for Google)
  - Tagline (max 30 chars)
  - Primary brand colour (hex)
  - Logo PNG (2048×2048, transparent background ideal)
  - Splash background (optional — uses logo if absent)
  - 3–5 marketing screenshots OR your existing PWA URL we can capture from
  - Apple Developer Team ID (after they sign up)
  - Google Play Developer account email
  - Privacy policy text (use `PRIVACY_POLICY_TEMPLATE.md`)
  - Support email + phone
  - Description (short + long for store listings)
- [ ] Vendor signs up for Apple Developer ($99/year) and Google Play ($25 one-time) in their business name.
- [ ] Vendor grants us delegate access:
  - Apple App Store Connect → Users and Access → invite our email as "Developer" role
  - Google Play Console → Users and permissions → invite our email as "Administrator"

## Day 1–3 — Build setup

Open PowerShell in `C:\Users\Victus\streetlocal`:

```powershell
.\wrap\scripts\wrap-vendor.ps1 `
  -VendorSlug donut-king `
  -VendorId 00000000-0000-0000-0000-000000000001 `
  -AppName "Donut King" `
  -BundleId "com.donutking.app" `
  -PrimaryColor "#EC4899" `
  -LogoPath "C:\path\to\vendor-logo.png" `
  -SupportEmail "support@donutking.com"
```

This produces `wrap/builds/donut-king/` with:
- Capacitor project ready to sync
- Vendor's icon copied into Android + iOS asset folders
- `capacitor.config.json` patched with vendor app ID, name, scheme
- `dist/` containing the PWA built with `VITE_FORCED_VENDOR_ID=<id>` so the app boots into their storefront

Verify the web build works:

```powershell
cd wrap\builds\donut-king
npx vite preview
```

Open `http://localhost:4173` — should show the vendor's branded storefront, not the generic StreetLocal landing.

## Day 4–5 — Android build

```powershell
cd wrap\builds\donut-king
npx cap add android        # first time only
npx cap sync android
cd android
.\gradlew bundleRelease    # produces app-release.aab in android/app/build/outputs/bundle/release/
```

If Gradle complains about signing:
1. Generate a keystore: `keytool -genkey -v -keystore vendor-release.keystore -alias vendor -keyalg RSA -keysize 2048 -validity 10000`
2. Add to `android/key.properties`: keystore path, alias, password
3. Re-run `gradlew bundleRelease`

Upload the `.aab` to **vendor's Google Play Console** (via delegate access). Fill in store listing using vendor's text from intake.

## Day 6–8 — iOS build (via GitHub Actions)

iOS builds require macOS. We use GitHub Actions:

1. Commit `wrap/builds/donut-king/` to a branch like `wrap/donut-king`
2. Push — the `.github/workflows/ios-build.yml` workflow runs automatically
3. Workflow runs on `macos-latest` (free 2000 min/month):
   - Installs Xcode + CocoaPods
   - Runs `npx cap add ios` + `npx cap sync ios`
   - Archives the Xcode project with the vendor's signing cert (from secrets)
   - Exports `.ipa` as a workflow artifact
4. Download the `.ipa` from the GitHub Actions run page
5. Upload to **vendor's App Store Connect** (via Transporter desktop app on Mac, or `xcrun altool` on CI)

Alternative if no Mac access at all: use **Codemagic** ($95/mo) or **Bitrise** ($25/mo for 200 build minutes) — both offer a hosted Mac that does the same Xcode archive + upload via web UI.

## Day 9–12 — Store review

**Google Play:** 1–7 days for first review. Standard issues:
- Missing privacy policy URL → fix in store listing
- Missing data safety form → fill in declaring "we collect order data, location for delivery"
- Crash on launch → check that VITE_FORCED_VENDOR_ID was injected correctly

**Apple App Store:** 1–3 days. Common rejections + fixes:
- **Guideline 4.2 (Minimum Functionality)** — Apple thinks app is "just a webview". Mitigation: ensure push notifications + biometric + camera plugins are integrated and visible in app screenshots. Show screenshots of the menu, cart, order, and chat features.
- **Guideline 5.1.1 (Privacy)** — privacy nutrition labels missing. Fix: log into App Store Connect → app → App Privacy → declare data types (Contact Info, Location, Identifiers).
- **Guideline 1.5 (Developer Information)** — vendor's support URL / contact missing. Fix: ensure the vendor's support email is in app's About page.

Most rejections are fixable in 1 hour. Respond via App Store Connect's review reply box.

## Day 13–14 — Go live

When approved:
- Apple: tap "Submit for Review" → "Manually Release" → flip to "Release Now" once you confirm with vendor.
- Google: tap "Send to production" → live in ~6 hours.

Notify vendor. Send them:
- Their App Store + Play Store URLs
- Screenshots for their marketing
- The first month of maintenance billing email

## Ongoing maintenance (monthly)

- Each month, run `wrap-vendor.ps1` again if `food-basic/` has had bug fixes
- Update each wrapped app via OTA (no store re-submission) OR re-submit if Capacitor plugins changed
- Monitor vendor's store ratings + respond to reviews on their behalf if requested
- Renew certificates (Apple distribution cert) every 12 months

## When a vendor cancels

- Stop their maintenance subscription
- Their live app keeps working (no kill switch — kills trust)
- Don't push any new updates to their wrap
- After 30 days: archive their `wrap/builds/{slug}/` to cold storage
- Source code license terminates (covered in Service Agreement)

## Time budget per vendor

| Phase | Standard | Premium | Enterprise |
|---|---|---|---|
| Intake + agreement | 1h | 2h | 4h |
| Build + asset prep | 2h | 4h | 8h |
| Android submission | 1h | 1h | 1h |
| iOS submission | 2h | 3h | 5h |
| Review responses | 1h | 2h | 4h |
| Ongoing /month | 15min | 30min | 1h |
| **First-build total** | **~7h** | **~12h** | **~22h** |

After the first 5 vendors, expect time to drop ~30% as you optimise.
