-- ═══════════════════════════════════════════════════════════
-- Re-engagement broadcast cron — daily job that fires the active
-- marketing banner into chat conversations of customers who haven't
-- ordered in the vendor's configured interval window.
-- ═══════════════════════════════════════════════════════════

-- Avoid double-broadcasting: track the last time we sent a marketing
-- message into each conversation. Cron skips anything broadcast
-- within the past interval.
alter table public.chat_conversations
  add column if not exists last_marketing_broadcast_at timestamptz;

-- pg_cron extension. On Supabase it must be installed in the
-- `pg_catalog` / `extensions` schema by project admin first.
-- CREATE EXTENSION is idempotent.
create extension if not exists pg_cron with schema pg_catalog;

-- Helper function — invokes the Edge Function via http extension.
-- pg_cron runs this with the service_role authority of the project.
-- Schedule: once a day at 09:00 server time (UTC by default).
do $$
declare
  job_id bigint;
begin
  -- Remove any existing schedule under the same name so we can update
  -- without manual unschedule.
  begin
    perform cron.unschedule('streetlocal_reengagement_daily');
  exception when others then
    -- no-op if it didn't exist
    null;
  end;

  -- Reschedule. The cron call uses pg_net.http_post to hit the
  -- Edge Function. The function URL + service_role key live in
  -- Supabase project settings and are interpolated below — replace
  -- if the project ref ever changes.
  begin
    select cron.schedule(
      'streetlocal_reengagement_daily',
      '0 9 * * *',  -- every day at 09:00 UTC
      $sql$
        select net.http_post(
          url := 'https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/marketing-reengagement-broadcast',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := '{"source":"cron"}'::jsonb
        ) as request_id;
      $sql$
    ) into job_id;
  exception when others then
    -- pg_net may not be enabled on the project — leave a hint in the
    -- error log but don't fail the migration. The Edge Function can
    -- still be triggered manually via supabase functions invoke.
    raise notice 'Could not schedule cron job: % (pg_net required)', sqlerrm;
  end;
end $$;
