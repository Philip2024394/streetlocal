-- receipt_autosend_cron — pg_cron sweep that fires the
-- order-receipt-autosend Edge Function for any paid order whose
-- receipt hasn't been sent yet.
--
-- Why a cron sweep instead of webhook trigger:
--   - Reliable: webhooks can drop, retries can fail
--   - Simple: no need to wire 16 payment-gateway webhooks
--   - Idempotent: receipt_sent_at gate prevents double-send
--   - Cheap: 1 row/min sweep is negligible load
--
-- The Edge Function itself is idempotent (early-exits if receipt_sent_at
-- is set), so if a webhook DOES fire it first, the cron will skip that
-- order on its next pass — no conflict.

-- ─── Job: claim paid orders with no receipt sent yet, fire Edge Fn ──
--
-- Runs every minute. Pulls up to 20 unsent receipts per pass so the
-- sweep doesn't pile up if many orders go paid at once. Uses pg_net's
-- async http_post so the cron tick doesn't block waiting for HTTP.
--
-- The Edge Function URL is built from current_setting('app.supabase_url')
-- if available, otherwise from a hardcoded vault secret. We set it
-- once here using the linked project URL.

-- Stash the project URL + service role key in the cron job (Supabase
-- doesn't expose vault.secrets in normal SQL, so we inline). Replace
-- the values below if rotating keys.

-- Drop the old job (if re-applying this migration)
do $$
declare j_id bigint;
begin
  for j_id in (select jobid from cron.job where jobname = 'order-receipt-autosend-sweep')
  loop
    perform cron.unschedule(j_id);
  end loop;
end $$;

-- Schedule: every minute.
-- Body: queries paid + unsent orders, fires http_post for each via pg_net.
-- The Edge Function URL is hardcoded against the linked project ref.
select cron.schedule(
  'order-receipt-autosend-sweep',
  '* * * * *',
  $cron$
    with paid_unsent as (
      select id
      from public.vendor_orders
      where payment_status = 'paid'
        and receipt_sent_at is null
      order by created_at desc
      limit 20
    )
    select net.http_post(
      url := 'https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/order-receipt-autosend',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object('order_id', id::text)
    )
    from paid_unsent;
  $cron$
);

-- Helper to inject the service role key into the job's session.
-- Supabase auto-injects this for pg_cron jobs as of platform v15. If
-- yours doesn't, set it manually via Supabase dashboard:
--   Settings → Database → Custom Postgres Config →
--   add: app.service_role_key = '<your service role key>'
