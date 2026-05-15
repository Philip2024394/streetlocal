-- funnel_events upsert — anon needs INSERT + UPDATE + SELECT policies
-- so the client's
-- supabase.from('funnel_events').upsert({...}, {onConflict:..., ignoreDuplicates:true})
-- doesn't 403.
--
-- Why SELECT? Postgres ON CONFLICT DO NOTHING reads the existing row
-- to detect the conflict; without a SELECT RLS policy that read is
-- blocked and the whole statement aborts with 42501. Adding SELECT
-- here is what actually unblocked the upsert — INSERT/UPDATE alone
-- were not enough (verified with `set role anon; insert ... on conflict
-- do nothing;` reproducing the same 42501).
--
-- funnel_events is analytics telemetry. Per-row data (session id, step,
-- timestamp) is non-sensitive and anyone visiting the public site already
-- generates these events themselves, so wide-open INSERT + UPDATE +
-- SELECT for anon is the right trade-off versus moving to a security
-- definer RPC. Re-evaluate if metadata ever grows to hold PII.

drop policy if exists "funnel_events anon update" on public.funnel_events;
create policy "funnel_events anon update"
  on public.funnel_events for update
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "funnel_events anon select" on public.funnel_events;
create policy "funnel_events anon select"
  on public.funnel_events for select
  to anon, authenticated
  using (true);
