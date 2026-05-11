# Services Local Email — Setup

The vendor side of this app receives customer orders by email, delivered via the
`send-vendor-email` Supabase Edge Function which uses [Resend](https://resend.com).

## 1. Get a Resend API key

1. Sign up at https://resend.com (free tier: 3,000 emails/month, 100/day).
2. Verify a sending domain you own (e.g. `streetlocal.live`) so emails don't
   land in spam. For quick testing you can use the `onboarding@resend.dev`
   address but it's only deliverable to the account owner's inbox.
3. Go to **API Keys → Create API Key** and copy the `re_…` key.

## 2. Set the secrets on Supabase

```bash
npx supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx \
  RESEND_FROM=orders@streetlocal.live
```

`RESEND_FROM` must be a verified address on the domain you registered with
Resend. The function will set the customer's email address as `Reply-To` so
the vendor can reply directly.

## 3. Apply the migration

This adds `vendor_accounts.order_email` (idempotent, safe to re-run):

```bash
npx supabase db push
```

Or apply the single file:

```
streetlocal/supabase/migrations/20260510130000_serviceslocalemail.sql
```

## 4. Deploy the edge function

```bash
npx supabase functions deploy send-vendor-email --no-verify-jwt
```

(`--no-verify-jwt` is fine here because the customer app uses the public
anon key to invoke the function; the function itself has no privileged
database access — it only forwards to Resend.)

## 5. Configure each vendor's order email

In the vendor side of the app, open **My Shop → Order Email** and enter the
email address where you want incoming orders delivered (e.g. your business
inbox). This persists to `vendor_accounts.order_email`.

If a vendor has not yet set their order email, the customer-side checkout
will block sending and surface a clear error message.

## 6. Test end-to-end

1. As vendor: open `/services/email/?vendor=<slug>`, log in, set your order
   email under My Shop → Order Email.
2. As customer (different browser/device): open the same URL without the
   `vendor` param (or with it for the public storefront), add items to the
   cart, fill in your name + phone + email + (address if delivery), and tap
   **Send Order**.
3. The configured vendor inbox should receive a clean HTML order receipt
   within seconds. Replying to that email goes straight back to the
   customer's email address.

## Notes

- Free Resend tier is 3,000 emails/month, then ~$0.001/email after that.
- The function never stores the email payload in Supabase — it just relays
  to Resend and returns the message id.
- If you'd rather use a different provider (Postmark, SendGrid, AWS SES),
  replace the single `fetch("https://api.resend.com/emails", …)` call near
  the bottom of `supabase/functions/send-vendor-email/index.ts`.
