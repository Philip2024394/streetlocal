# Native App Wrap Pipeline

Wraps the donut PWA (`food-basic/`) into a branded native app for Apple App Store and Google Play, per-vendor. Pure PWA stays untouched — wraps are produced into `wrap/builds/{vendor-slug}/` and submitted from there.

## Files in this directory

| File | Purpose |
|---|---|
| `SETUP.md` | One-time setup Philip must do (developer accounts, lawyer, Mac access). |
| `RUNBOOK.md` | Per-vendor delivery workflow — every step from intake to App Store live. |
| `VENDOR_ONBOARDING.md` | Intake form — what to collect from each vendor before starting. |
| `SERVICE_AGREEMENT_TEMPLATE.md` | Legal template covering IP, cancellation, liability. **Lawyer review required.** |
| `PRIVACY_POLICY_TEMPLATE.md` | Privacy policy template — fill in vendor name, host on their site, link in store listings. |
| `template/` | Capacitor "shell" — config + plugin list. Cloned into `builds/{vendor}/` per build. |
| `scripts/wrap-vendor.ps1` | PowerShell script — takes vendor params, produces a branded build. |
| `scripts/install-capacitor.ps1` | One-time setup — installs Capacitor CLI globally. |
| `.github/workflows/ios-build.yml` | GitHub Actions workflow — builds iOS `.ipa` on cloud Mac (no local Mac needed). |
| `builds/` | Per-vendor build outputs (gitignored). |

## High-level flow

```
Vendor signs up  →  collect data (VENDOR_ONBOARDING.md)
                ↓
Philip runs:    scripts/wrap-vendor.ps1 -VendorSlug donut-king -VendorId <uuid> ...
                ↓
Script:         clones template/ → builds/donut-king/
                injects vendor branding into capacitor.config.json
                copies vendor icon + splash
                runs food-basic build with VITE_FORCED_VENDOR_ID
                copies dist → wrap/builds/donut-king/dist
                ↓
Philip runs:    cd builds/donut-king && npx cap sync
                ↓
Android build:  cd android && ./gradlew bundleRelease
                → app-release.aab → upload to vendor's Google Play Console
                ↓
iOS build:      push to GitHub → GitHub Actions iOS workflow runs
                → .ipa → download → upload to vendor's App Store Connect
                ↓
Review + ship:  Apple 1–3 days, Google 1–7 days
                ↓
App live in both stores under vendor's developer account.
```

## What "the pipeline" actually delivers

✅ **Reproducible builds** — running the same command twice produces the same output. No manual steps.
✅ **Per-vendor isolation** — each vendor's build lives in its own folder. No cross-contamination.
✅ **Source code protected** — only the compiled binary leaves our machine. Vendor never sees the React source.
✅ **PWA still works** — `food-basic/` is unchanged. Vendors using the web PWA keep using it.
✅ **One-place updates** — fix a bug in `food-basic/src/App.jsx`, re-run wrap script, OTA push to all wrapped apps (no re-submission needed).

## What this pipeline does NOT do (yet)

⚠️ **Server-side OTA delivery** — for true OTA updates, we'd need to host the web bundle on our CDN and have Capacitor's Live Update plugin point at it. For MVP, treat each build as a fresh submission. OTA can be added later via Capacitor Live Updates plugin or Capgo (open-source alt).
⚠️ **Automated screenshot generation** — for MVP, screenshots are produced manually per vendor (3–5 screenshots × 2 device sizes = ~10 screenshots).
⚠️ **iOS local builds** — requires macOS + Xcode. We use GitHub Actions to bypass this on Windows.

Start with `SETUP.md` if this is your first time. After that, every vendor follows `RUNBOOK.md`.
