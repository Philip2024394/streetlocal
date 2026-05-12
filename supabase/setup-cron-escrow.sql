-- One-time setup: schedule the escrow auto-release safety net.
--
-- This is NOT a migration (the project URL is environment-specific so
-- it can't be hardcoded portably). Run this once in the Supabase
-- Dashboard → SQL Editor after deploying stripe-escrow-auto-release.
--
-- Steps:
--   1. Deploy the function:
--        npx supabase functions deploy stripe-escrow-auto-release --no-verify-jwt
--   2. Replace YOUR-PROJECT-REF below with your project ref
--      (find it in Supabase Dashboard → Project Settings → General).
--   3. Paste the whole block into Dashboard → SQL Editor → Run.
--
-- The cron fires every 30 minutes. The function captures any held
-- Stripe escrow holds whose release_at has passed. Idempotent: safe
-- to run on any schedule, safe to leave in place forever.

-- Enable required extensions (no-op if already enabled).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Replace this URL with your project's URL.
-- Example: https://abcdefghijklmn.supabase.co/functions/v1/stripe-escrow-auto-release
do $$
declare
  v_url text := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/stripe-escrow-auto-release';
begin
  -- Remove any existing job with the same name (re-runnable).
  perform cron.unschedule('stripe-escrow-auto-release')
    where exists (select 1 from cron.job where jobname = 'stripe-escrow-auto-release');

  perform cron.schedule(
    'stripe-escrow-auto-release',
    '*/30 * * * *',  -- every 30 minutes
    format($cmd$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      ) as request_id
    $cmd$, v_url)
  );
end$$;

-- Verify it scheduled:
-- select jobid, jobname, schedule, command from cron.job where jobname = 'stripe-escrow-auto-release';
--
-- To stop it later:
-- select cron.unschedule('stripe-escrow-auto-release');
--
-- To watch what it's doing:
-- select * from cron.job_run_details where jobname = 'stripe-escrow-auto-release' order by start_time desc limit 20;
