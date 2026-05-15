-- receipt_autosend_flags — vendor toggles for auto-sending the
-- order receipt to the customer's chat + email after a successful
-- payment. Both default to false (opt-in).
--
-- Implementation: when an order moves to status='paid' and
-- receipt_sent_at is null, the order-receipt-autosend Edge Function:
--   - appends a system message to chat_messages with the receipt summary
--   - sends an email via Resend if customer_email is present
--   - stamps receipt_sent_at so retries are idempotent

alter table public.vendor_accounts
  add column if not exists receipt_autosend_chat  boolean not null default false,
  add column if not exists receipt_autosend_email boolean not null default false;
