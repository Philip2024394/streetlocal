-- funnel_events upsert — let anon UPDATE so the client's
-- supabase.from('funnel_events').upsert({...}, {onConflict:..., ignoreDuplicates:true})
-- doesn't 403. PostgREST routes the upsert as INSERT...ON CONFLICT,
-- which needs both INSERT and UPDATE permissions even when the
-- conflict action is DO NOTHING.
--
-- funnel_events is analytics telemetry — non-sensitive — so wide-open
-- INSERT + UPDATE is acceptable. SELECT remains closed (no policy)
-- so anonymous browsers can't enumerate funnel data.

drop policy if exists "funnel_events anon update" on public.funnel_events;
create policy "funnel_events anon update"
  on public.funnel_events for update
  using (true) with check (true);
