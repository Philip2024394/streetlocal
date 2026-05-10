# Food Local Chat — Push Notification Setup

The vendor side uses Web Push so that orders ring through even when the PWA
is closed or the phone is asleep. Three things must be configured before
push works in production. None of these need to happen locally to test the
in-app chat — only to test the offline notification path.

## 1. Generate VAPID keys (one-time)

```bash
npx web-push generate-vapid-keys
```

This prints a `Public Key` and `Private Key`. Copy them.

## 2. Set them in three places

a. `streetlocal/.env.example` already documents the variables. Copy that
   file to `.env` (or whatever your local convention is) and fill in the
   real values for local dev:

   ```
   VITE_VAPID_PUBLIC_KEY=<public key>
   ```

   The customer app only needs the public key (vendor enables alerts on
   the same origin, so the same key is used for `pushManager.subscribe`).

b. The Supabase Edge Function needs both keys plus a contact subject. Set
   them as function secrets:

   ```bash
   npx supabase secrets set \
     VAPID_PUBLIC_KEY=<public> \
     VAPID_PRIVATE_KEY=<private> \
     VAPID_SUBJECT=mailto:alerts@streetlocal.live
   ```

c. Deploy the function:

   ```bash
   npx supabase functions deploy send-vendor-push --no-verify-jwt
   ```

## 3. Wire the database webhook

In the Supabase dashboard:

1. Database -> Webhooks -> "Create a new hook"
2. Name: `chat-message-push`
3. Table: `chat_messages`
4. Events: `Insert`
5. Type: `Supabase Edge Function`
6. Edge function: `send-vendor-push`
7. (Optional) HTTP Headers: none
8. (Optional) HTTP Params filter: `sender_role=eq.customer` — this skips
   vendor-side and system messages so the function only fires for incoming
   customer orders.
9. Save.

The function will load all `vendor_push_subscriptions` for the conversation's
vendor and send a Web Push to each. Dead endpoints (404/410) are pruned
automatically.

## 4. Apply the migration

```bash
npx supabase db push
```

This creates `chat_conversations`, `chat_messages`, and
`vendor_push_subscriptions`, sets up RLS, the trigger that bumps
`last_message_at` and unread counters, and adds `chat_messages` to the
realtime publication.

## 5. Test end-to-end

- Open the customer side: `http://localhost:5177/food/chat/?vendor=<slug>`
- Add items to the cart and tap "Send Order".
- Open the vendor side in a separate browser profile or device:
  `http://localhost:5177/food/chat/?vendor=<slug>` then open the side
  drawer and tap "Orders".
- Tap "Enable order alerts" once and grant the browser prompt.
- Place a second test order from the customer side. The vendor should hear
  the chime + feel a vibration when the inbox is open, and receive a push
  notification when the inbox is closed.

## Notes

- The customer side does not subscribe to push — only the vendor inbox
  subscribes. The sw.js file is shared.
- `requireInteraction: true` keeps the notification on screen until the
  vendor taps it.
- VAPID keys must be a P-256 key pair. Keep the private key out of git.
