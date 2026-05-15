# One-Time Setup — Philip's external actions

Do these once. After they're done, the wrap pipeline is ready for every future vendor.

## 1. Sign up for our own Apple Developer account

We need this to **test builds** before submitting under each vendor's account.

- Go to https://developer.apple.com/programs/
- Cost: **$99/year**, billed to your card. Tax-deductible.
- Register as an individual or as "StreetLocal" if you have a business entity.
- Wait 24–48 hours for Apple to verify ID.
- Once approved, log into App Store Connect at https://appstoreconnect.apple.com — this is where we test apps before each vendor's account submits theirs.

## 2. Sign up for our own Google Play Developer account

Same reasoning — for testing.

- Go to https://play.google.com/console/signup
- Cost: **$25 one-time**.
- Verification: usually instant or within 24h.
- Once approved, log into Play Console at https://play.google.com/console.

## 3. Set up GitHub repo + Actions secrets (for iOS cloud builds)

Local Macs cost $1000+. GitHub Actions gives us cloud Mac builds **free** up to 2000 minutes/month, then $0.08/minute.

- Push this repo to a private GitHub repo if it isn't already.
- In repo Settings → Secrets and variables → Actions, add:
  - `IOS_DIST_CERT_BASE64` — your iOS distribution certificate, base64-encoded
  - `IOS_DIST_CERT_PASSWORD` — password for the certificate
  - `IOS_PROVISIONING_PROFILE_BASE64` — base64-encoded provisioning profile
  - `APP_STORE_CONNECT_API_KEY` — your App Store Connect API key
- Detailed setup steps are inline-commented in `.github/workflows/ios-build.yml`.

## 4. Lawyer review of legal templates

Two documents need a lawyer's eye before any vendor signs:

- `SERVICE_AGREEMENT_TEMPLATE.md` — IP / cancellation / liability split
- `PRIVACY_POLICY_TEMPLATE.md` — generic template each vendor fills in for their own app's privacy policy

Expected cost: $500–2,000 one-time. Find a lawyer who's worked with SaaS / app-builder businesses before. Lawyer should specifically check:

1. IP retention clause (source code stays ours, binary is licensed not sold)
2. Cancellation terms (live app keeps working but stops receiving updates)
3. Liability split (vendor liable for food safety, we liable for platform uptime)
4. Apple/Google guideline 4.2 compliance language
5. Data ownership (vendor owns customer data; we own platform data)

## 5. Set up our own Capacitor environment

Run on this machine (Windows / PowerShell):

```powershell
cd C:\Users\Victus\streetlocal
.\wrap\scripts\install-capacitor.ps1
```

That script installs:
- `@capacitor/cli` globally
- Java 17+ (for Android builds — installs via winget if missing)
- Android Studio reminder (you'll need to install separately for first Android build)
- Tests the install with `cap --version`

## 6. Install Android Studio (one-time)

Required for signing Android builds locally.

- Download: https://developer.android.com/studio
- Open once, accept SDK licenses, install Android SDK 34 + build-tools 34.0.0
- Make sure `ANDROID_HOME` environment variable points to your SDK location (default: `C:\Users\Victus\AppData\Local\Android\Sdk`)

## 7. (Optional) Get a Service Agreement signing service

For sending the Service Agreement to vendors and getting it signed:

- **DocuSign** — $10/mo for personal, $25/mo for business plan
- **PandaDoc** — free tier (5 documents/month), $19/mo for unlimited
- **HelloSign** (now Dropbox Sign) — $20/mo

Or send PDF + accept email reply with "I agree". Cheapest, fully valid for small SaaS contracts.

## When all the above are done

You're ready to deliver to the first vendor. Follow `RUNBOOK.md` per vendor.

## Cost summary (one-time + recurring)

| Item | One-time | Recurring |
|---|---|---|
| Apple Developer (StreetLocal's own) | — | $99/year |
| Google Play Developer (StreetLocal's own) | $25 | — |
| Lawyer review | $500–2,000 | — |
| GitHub Actions (Mac runners) | — | Free up to 2000 min/mo |
| Android Studio | Free | — |
| DocuSign / equivalent | — | $10–25/mo (optional) |
| **Total cost to be ready to wrap** | **~$525–2,025** | **~$110/mo** |

That cost is recovered on the **first vendor** at the $499 setup fee. Every vendor after that is profit.
