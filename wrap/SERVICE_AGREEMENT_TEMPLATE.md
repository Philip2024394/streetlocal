# StreetLocal Native App Wrap — Service Agreement

**⚠️ LAWYER REVIEW REQUIRED BEFORE FIRST USE.** This template is drafted by a non-lawyer engineer for a SaaS context. A qualified attorney must review and customise for your jurisdiction (Indonesia / US / wherever you trade) before signing with any vendor.

---

**This Agreement** is made on [DATE] between:

- **StreetLocal** ("we", "our", "us") — operating from Yogyakarta, Indonesia, contact streetlocallive@gmail.com.
- **[VENDOR LEGAL NAME]** ("Vendor", "you", "your") — operating from [VENDOR ADDRESS].

## 1. Service description

We will build a branded native mobile application ("the App") wrapping our StreetLocal donut-shop PWA platform for the Vendor, and submit it to:
- Apple App Store, under the Vendor's Apple Developer account
- Google Play Store, under the Vendor's Google Play Developer account

## 2. Fees

- **One-time setup fee:** [$499 Standard / $999 Premium / $2,499 Enterprise], paid in full before work begins. **Non-refundable** once the build process starts.
- **Monthly maintenance fee:** [$29 / $49 / $99], billed monthly, with a **6-month minimum commitment** from the date the App goes live.
- **After 6 months:** maintenance can be cancelled with 30 days' written notice (email is sufficient).
- **Vendor pays directly to third parties** (not to us):
  - Apple Developer Program — $99/year
  - Google Play Developer fee — $25 one-time
  - Any payment gateway fees on customer orders

## 3. What you own

The Vendor owns and retains all rights to:
- Vendor's business name, trade marks, logos, marketing assets, recipes, product descriptions
- The Apple Developer and Google Play Developer accounts (both must be in Vendor's legal name)
- The store listings, screenshots, ratings, reviews, and customer-facing descriptions
- All customer data generated through the App (orders, contacts, chat history)
- The Vendor's payment gateway accounts and resulting funds

## 4. What we own (IP retention)

StreetLocal owns and retains all rights to:
- The underlying source code of the StreetLocal platform, including the PWA, backend, and native wrap pipeline
- The architectural design, database schema, and proprietary algorithms (pricing geofencing, payment routing, etc.)
- Any improvements, derivatives, or modifications we make during the engagement

The App delivered to the Vendor's store accounts is a **compiled binary licensed for distribution under the Vendor's name only.** The Vendor:
- May NOT decompile, reverse-engineer, or attempt to extract source code from the binary
- May NOT transfer the binary or its source to another platform or developer
- May NOT publish derivative apps from our codebase
- May NOT use our source code to train AI models or recreate the platform

## 5. License grant

We grant the Vendor a **non-exclusive, non-transferable, revocable license** to:
- Distribute the App under Vendor's store accounts
- Use StreetLocal trademarks ("Powered by StreetLocal" credit visible in the App's About section)
- Receive ongoing maintenance updates while the subscription is active

This license terminates immediately upon:
- Non-payment of monthly maintenance for 30 days
- Vendor's breach of any IP clause in this Agreement
- Mutual written agreement
- Vendor's bankruptcy or business dissolution

## 6. Maintenance and updates

While the maintenance subscription is active, we will:
- Apply bug fixes via over-the-air JavaScript updates (no store re-review needed) within 7 days of discovery
- Push security patches within 48 hours of discovery
- Re-submit the App to stores for native-shell changes within 14 days of the change
- Respond to store review rejections on the Vendor's behalf within 2 business days

When the maintenance subscription ends (after the 6-month minimum):
- The live App continues to function on devices that have installed it
- The App will stop receiving new updates, including bug fixes and security patches
- After 12 months without maintenance, the App may stop working due to OS updates beyond our control
- The Vendor may resume maintenance at any time at the then-current rate

## 7. Cancellation and termination

**Vendor cancellation:**
- Before 6 months: not permitted — minimum commitment applies. Vendor remains liable for the remaining months' fees.
- After 6 months: 30 days' written notice via email. Final billing prorated. No refund of any portion of the setup fee.

**StreetLocal termination:**
- For Vendor's material breach (non-payment, IP violation, illegal use): immediate, no refund.
- For our convenience: 90 days' written notice. We will refund any prepaid maintenance fees covering periods after termination.

## 8. Liability and warranties

**Vendor warrants:**
- All content (recipes, photos, marketing copy, product descriptions) is owned by Vendor or properly licensed
- Vendor will comply with all food safety, business licensing, and consumer protection laws in their jurisdiction
- Vendor will not use the App for any illegal purpose
- Vendor takes full liability for food quality, allergen disclosure, and any harm caused by their products

**StreetLocal warrants:**
- We will use commercially reasonable efforts to keep the platform operational (target 99.5% uptime, measured monthly)
- We will not access Vendor's customer data except for support purposes when explicitly requested by Vendor
- We will not share Vendor's customer data with any third party
- We will respond to support requests within 2 business days

**Limitation of liability:**
- Our total liability under this Agreement is capped at **12 months of fees paid by the Vendor**.
- Neither party is liable for indirect, consequential, or punitive damages.
- This cap does not apply to: gross negligence, wilful misconduct, IP infringement, or breach of confidentiality.

## 9. Apple and Google guideline compliance

Vendor acknowledges:
- Apple and Google can reject or remove apps at their sole discretion
- We will use commercially reasonable efforts to ensure compliance with Apple's App Store Review Guidelines and Google's Play Store policies
- If an app is rejected, we will respond and resubmit at no additional charge for the first three rejections
- If an app is permanently rejected after good-faith resubmission attempts, our liability is limited to refund of the setup fee only

## 10. Data and privacy

- StreetLocal acts as a **data processor** for Vendor's customer data
- Vendor is the **data controller** and is responsible for GDPR / CCPA / other privacy compliance in their region
- We process data on the Supabase platform (US/EU/Asia regions, vendor's choice)
- We will sign a Data Processing Agreement (DPA) upon Vendor's written request
- We will notify Vendor within 72 hours of any data breach affecting their data

## 11. Force majeure

Neither party is liable for delays caused by events beyond reasonable control: Apple/Google policy changes, OS updates breaking compatibility, natural disasters, government action, internet outages, etc.

## 12. Governing law and dispute resolution

- This Agreement is governed by the laws of [JURISDICTION — e.g. Indonesia / Singapore / your preferred].
- Disputes will be resolved by good-faith negotiation. If unresolved within 30 days, by binding arbitration under [arbitration body — e.g. SIAC Singapore].
- Neither party will publicly disparage the other.

## 13. Confidentiality

Both parties agree:
- Not to disclose the other's confidential information (pricing, contracts, code, customer lists, business plans) for 3 years after termination
- To use confidential information only for performing this Agreement
- To return or destroy confidential information upon request after termination

## 14. Entire agreement

This document, plus the `VENDOR_ONBOARDING.md` form and `PRIVACY_POLICY_TEMPLATE.md` filled in by Vendor, constitutes the entire agreement. No verbal commitments override these documents. Amendments must be in writing and signed by both parties.

---

## Signatures

**For StreetLocal:**

Name: ________________________________
Title: ________________________________
Signature: ____________________________
Date: ________________________________

**For [VENDOR LEGAL NAME]:**

Name: ________________________________
Title: ________________________________
Signature: ____________________________
Date: ________________________________

---

**Reminder:** This template MUST be reviewed by a qualified attorney before use. Specifically check: IP retention enforceability, limitation-of-liability caps under your jurisdiction, data processing language under GDPR/CCPA if applicable, food-safety liability split, and arbitration clause enforceability.
