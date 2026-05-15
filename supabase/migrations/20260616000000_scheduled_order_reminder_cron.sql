-- scheduled_order_reminder_cron — every 15 minutes, find scheduled
-- orders that are 3.5–4.5 hours from their pickup time and haven't
-- been reminded yet. Insert a system chat message + (when Twilio
-- creds are wired) optionally fire an SMS.
--
-- A new column `reminder_sent_at` on vendor_orders gives us
-- idempotency — once we ping, we never ping the same order twice.

alter table public.vendor_orders
  add column if not exists reminder_sent_at timestamptz;

-- Drop existing job before re-scheduling (re-run safety).
do $$
declare j_id bigint;
begin
  for j_id in (select jobid from cron.job where jobname = 'scheduled-order-reminder-sweep')
  loop
    perform cron.unschedule(j_id);
  end loop;
end $$;

-- Every 15 minutes, scan for orders scheduled ~4h out, append a
-- system chat message reminding the vendor + customer.
select cron.schedule(
  'scheduled-order-reminder-sweep',
  '*/15 * * * *',
  $cron$
    with due as (
      select id, vendor_id, customer_phone, customer_name, scheduled_for, chat_messages
      from public.vendor_orders
      where scheduled_for is not null
        and reminder_sent_at is null
        and scheduled_for > now()
        and scheduled_for <= now() + interval '4 hours 30 minutes'
        and scheduled_for >= now() + interval '3 hours 30 minutes'
      limit 50
    )
    update public.vendor_orders vo
       set reminder_sent_at = now(),
           chat_messages = coalesce(vo.chat_messages, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
             'id', 'reminder-' || extract(epoch from now())::bigint,
             'sender', 'system',
             'type', 'reminder',
             'body', '⏰ Heads up — this order is scheduled in ~4 hours (' || to_char(vo.scheduled_for at time zone 'UTC', 'YYYY-MM-DD HH24:MI UTC') || '). Time to prep.',
             'created_at', now()
           ))
      from due
     where vo.id = due.id;
  $cron$
);
