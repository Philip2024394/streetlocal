-- One-time setup: schedule the orders retention sweep.
--
-- This is NOT a migration (project URL is environment-specific). Run
-- this once in Supabase Dashboard → SQL Editor after deploying the
-- orders-retention-sweep function.
--
-- Steps:
--   1. Deploy:
--        npx supabase functions deploy orders-retention-sweep --no-verify-jwt
--   2. Replace YOUR-PROJECT-REF below with your project ref.
--   3. Paste into Dashboard → SQL Editor → Run.
--
-- The cron fires daily at 03:00 UTC (low-traffic window). The sweep
-- deletes up to 1,000 settled orders older than 14 days per run.
-- Idempotent — safe to re-run or leave scheduled indefinitely.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  v_url text := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/orders-retention-sweep';
begin
  perform cron.unschedule('orders-retention-sweep')
    where exists (select 1 from cron.job where jobname = 'orders-retention-sweep');

  perform cron.schedule(
    'orders-retention-sweep',
    '0 3 * * *',  -- daily at 03:00 UTC
    format($cmd$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      ) as request_id
    $cmd$, v_url)
  );
end$$;

-- Inspect / manage:
-- select jobid, jobname, schedule, command from cron.job where jobname = 'orders-retention-sweep';
-- select * from cron.job_run_details where jobname = 'orders-retention-sweep' order by start_time desc limit 20;
-- select cron.unschedule('orders-retention-sweep');
