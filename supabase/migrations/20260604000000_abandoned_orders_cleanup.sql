-- ═══════════════════════════════════════════════════════════
-- Abandoned-order cleanup — pg_cron job that runs every 10 mins.
--
-- THE PROBLEM
-- Hosted gateways (Stripe, Xendit, PayPal, Razorpay, Mollie, HitPay,
-- Adyen, Checkout.com, FomoPay, Authorize.net, 2Checkout, Cybersource,
-- Rapyd) redirect the customer offsite to complete payment. Before
-- the redirect, the donut app:
--   1. Decrements stock atomically (dec_menu_item_stock RPC)
--   2. Inserts the order into chat_messages with
--      order_payload.payment.status = 'redirecting'
--
-- If the customer closes the payment window WITHOUT paying, the
-- webhook never fires, the chat row stays 'redirecting' forever, and
-- the stock is permanently decremented. Vendor sees a phantom order.
-- Customer's local loyalty stamp also ticks up against a non-purchase
-- (we can't reach localStorage from the server, so that one stays).
--
-- THIS CLEANUP
--   • Finds chat_messages with status='redirecting' older than 60 min
--   • Sets status='abandoned' + appends abandoned_at timestamp
--   • Restores stock for each item via dec_menu_item_stock with
--     a NEGATIVE qty (effectively an inverse increment).
--   • Runs every 10 minutes via pg_cron.
-- ═══════════════════════════════════════════════════════════

-- Make sure the RPC accepts negative qty as an increment. We can't
-- pass negative to the existing dec_menu_item_stock (its guard
-- `stock >= qty` would reject). Build a sibling for clarity.
create or replace function public.inc_menu_item_stock(
  item_id uuid,
  qty integer
) returns table (id uuid, stock integer)
language plpgsql
security definer
as $$
begin
  return query
  update public.vendor_menu_items vmi
     set stock = coalesce(vmi.stock, 0) + qty
   where vmi.id = item_id
     and vmi.stock is not null  -- null = unlimited, no restore needed
  returning vmi.id, vmi.stock;
end
$$;

grant execute on function public.inc_menu_item_stock(uuid, integer) to anon, authenticated;

-- Main cleanup function. Returns counts for observability.
create or replace function public.cleanup_abandoned_orders(
  age_minutes integer default 60
) returns table (orders_marked integer, items_restored integer)
language plpgsql
security definer
as $$
declare
  cutoff timestamptz;
  v_orders int := 0;
  v_items int := 0;
  rec record;
  item jsonb;
begin
  cutoff := now() - (age_minutes || ' minutes')::interval;

  -- Loop over abandoned rows (we need per-item processing to restore stock).
  for rec in
    select id, order_payload
      from public.chat_messages
     where order_payload is not null
       and order_payload->'payment'->>'status' = 'redirecting'
       and created_at < cutoff
  loop
    -- Restore stock for every item that had a `id` (UUID) AND quantity.
    -- Items without `id` were custom / promo-only and have no stock row.
    if jsonb_typeof(rec.order_payload->'items') = 'array' then
      for item in select * from jsonb_array_elements(rec.order_payload->'items')
      loop
        if (item->>'id') is not null and (item->>'qty') is not null then
          begin
            perform public.inc_menu_item_stock(
              (item->>'id')::uuid,
              (item->>'qty')::int
            );
            v_items := v_items + 1;
          exception when others then
            -- Item id wasn't a UUID (e.g. demo data) — skip silently.
            null;
          end;
        end if;
      end loop;
    end if;

    -- Flip the order's payment status to 'abandoned' and stamp the time.
    -- jsonb_set preserves the rest of the payload.
    update public.chat_messages
       set order_payload = jsonb_set(
             jsonb_set(order_payload, '{payment,status}', '"abandoned"'),
             '{payment,abandoned_at}',
             to_jsonb(now())
           )
     where id = rec.id;
    v_orders := v_orders + 1;
  end loop;

  return query select v_orders, v_items;
end
$$;

grant execute on function public.cleanup_abandoned_orders(integer) to anon, authenticated;

-- Schedule the cron — every 10 minutes. Reuses the existing pg_cron
-- extension installed by the re-engagement migration.
-- Drop first so re-applying the migration doesn't conflict.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('cleanup-abandoned-orders')
      where exists (
        select 1 from cron.job where jobname = 'cleanup-abandoned-orders'
      );
    perform cron.schedule(
      'cleanup-abandoned-orders',
      '*/10 * * * *',
      $cmd$select public.cleanup_abandoned_orders(60)$cmd$
    );
  end if;
end
$$;
