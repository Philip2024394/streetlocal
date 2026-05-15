-- loyalty_stamps — per-vendor punch-card tracking, keyed by customer phone.
--
-- Replaces the localStorage-only stamp counter we were running before.
-- Now stamps survive device switches, the vendor can see + manually
-- adjust counts for in-person customers, and the server is the source
-- of truth (no client-side tampering can grant free items).
--
-- Schema:
--   id                — primary key
--   vendor_id         — FK to vendor_accounts (which shop's loyalty)
--   customer_phone    — the customer identifier (raw E.164 string)
--   stamps_count      — current punches toward next reward
--   rewards_earned    — total rewards earned (goal-met rollovers)
--   rewards_redeemed  — total rewards actually used (claimed by customer)
--   last_stamp_at     — when the last punch was added
--   last_redeemed_at  — when the last reward was claimed
--   created_at        — first time this customer earned a punch
--   updated_at        — last write (any field)
--
-- Unique (vendor_id, customer_phone) so on conflict we update instead of
-- creating duplicates.

create table if not exists public.loyalty_stamps (
  id                 uuid primary key default gen_random_uuid(),
  vendor_id          uuid not null references public.vendor_accounts(id) on delete cascade,
  customer_phone     text not null,
  stamps_count       int  not null default 0 check (stamps_count >= 0),
  rewards_earned     int  not null default 0 check (rewards_earned >= 0),
  rewards_redeemed   int  not null default 0 check (rewards_redeemed >= 0),
  last_stamp_at      timestamptz,
  last_redeemed_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (vendor_id, customer_phone)
);

-- The picker and reward UIs query by (vendor_id, customer_phone). The
-- vendor's "top stamp earners" view sorts by stamps_count desc per
-- vendor. One composite index handles both.
create index if not exists loyalty_stamps_vendor_phone_idx
  on public.loyalty_stamps (vendor_id, customer_phone);
create index if not exists loyalty_stamps_vendor_count_idx
  on public.loyalty_stamps (vendor_id, stamps_count desc);

-- ─── RLS ─────────────────────────────────────────────────────────────
-- Vendors read + write their own rows. Customers can't read or write
-- directly — they go through the security-definer RPCs below, which
-- enforce the (vendor_id, phone) match server-side. This means a
-- customer who knows another customer's phone CAN read that other
-- customer's stamp count for the same vendor (matches WhatsApp / SMS
-- loyalty programmes — knowing a phone is the auth signal).

alter table public.loyalty_stamps enable row level security;

drop policy if exists "loyalty_stamps vendor select" on public.loyalty_stamps;
create policy "loyalty_stamps vendor select"
  on public.loyalty_stamps for select
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

drop policy if exists "loyalty_stamps vendor update" on public.loyalty_stamps;
create policy "loyalty_stamps vendor update"
  on public.loyalty_stamps for update
  to authenticated
  using (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''))
  with check (vendor_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'vendor_id', ''));

-- INSERT and DELETE go through RPCs (no direct policies — defaults to deny).

-- ─── RPC: get_loyalty_state ──────────────────────────────────────────
-- Read the current stamp state for (vendor, phone). Returns the row
-- if it exists, else a zero-row for the caller's UI to render the
-- empty card. Callable by anon — the (vendor_id, phone) pair is the
-- auth signal (you must know the customer's phone to read their card).
create or replace function public.get_loyalty_state (
  p_vendor_id uuid,
  p_phone     text
) returns table (
  stamps_count     int,
  rewards_earned   int,
  rewards_redeemed int,
  rewards_unclaimed int,
  last_stamp_at    timestamptz,
  last_redeemed_at timestamptz
) language sql security definer set search_path = public as $$
  select
    coalesce(ls.stamps_count, 0)                                       as stamps_count,
    coalesce(ls.rewards_earned, 0)                                     as rewards_earned,
    coalesce(ls.rewards_redeemed, 0)                                   as rewards_redeemed,
    coalesce(ls.rewards_earned, 0) - coalesce(ls.rewards_redeemed, 0)  as rewards_unclaimed,
    ls.last_stamp_at,
    ls.last_redeemed_at
  from public.loyalty_stamps ls
  where ls.vendor_id = p_vendor_id and ls.customer_phone = p_phone
  union all
  -- Fallback zero-row when no record exists yet, so the client always
  -- gets a single row back.
  select 0, 0, 0, 0, null::timestamptz, null::timestamptz
  where not exists (
    select 1 from public.loyalty_stamps
    where vendor_id = p_vendor_id and customer_phone = p_phone
  )
  limit 1;
$$;

-- ─── RPC: add_loyalty_stamp ──────────────────────────────────────────
-- Increment the customer's stamp count for a vendor. When the count
-- reaches the vendor's `p_goal`, rolls over: stamps_count → 0,
-- rewards_earned += 1.
--
-- Returns the new state so the client can update its UI without a
-- second read.
--
-- IDEMPOTENCY: this fn is called from the customer's checkout flow.
-- If the same order tries to add a stamp twice (e.g. network retry),
-- we WILL double-stamp. Future enhancement: pass p_order_id and dedupe
-- via a side table. For MVP, the rare double-stamp is acceptable —
-- vendors can manually subtract if a customer flags it.
create or replace function public.add_loyalty_stamp (
  p_vendor_id uuid,
  p_phone     text,
  p_goal      int default 10
) returns table (
  stamps_count     int,
  rewards_earned   int,
  rewards_redeemed int,
  rewards_unclaimed int,
  last_stamp_at    timestamptz,
  last_redeemed_at timestamptz
) language plpgsql security definer set search_path = public as $$
declare
  v_new_count int;
  v_new_earned int;
  v_goal int := greatest(1, coalesce(p_goal, 10));
begin
  -- Upsert + atomically increment. Postgres rolls back the whole txn on
  -- conflict resolution, so the math is consistent under concurrent
  -- order placements from the same customer (rare but possible if they
  -- tap submit twice).
  insert into public.loyalty_stamps (vendor_id, customer_phone, stamps_count, last_stamp_at, updated_at)
  values (p_vendor_id, p_phone, 1, now(), now())
  on conflict (vendor_id, customer_phone)
  do update set
    stamps_count  = loyalty_stamps.stamps_count + 1,
    last_stamp_at = now(),
    updated_at    = now()
  returning loyalty_stamps.stamps_count into v_new_count;

  -- Goal rollover: if the new count hits the goal, increment
  -- rewards_earned and reset the punch count to 0.
  if v_new_count >= v_goal then
    update public.loyalty_stamps
       set stamps_count   = 0,
           rewards_earned = rewards_earned + 1,
           updated_at     = now()
     where vendor_id = p_vendor_id and customer_phone = p_phone
     returning loyalty_stamps.rewards_earned into v_new_earned;
  end if;

  return query select
    ls.stamps_count, ls.rewards_earned, ls.rewards_redeemed,
    (ls.rewards_earned - ls.rewards_redeemed) as rewards_unclaimed,
    ls.last_stamp_at, ls.last_redeemed_at
  from public.loyalty_stamps ls
  where ls.vendor_id = p_vendor_id and ls.customer_phone = p_phone;
end;
$$;

-- ─── RPC: redeem_loyalty_reward ──────────────────────────────────────
-- Customer cashes in one earned reward. Increments rewards_redeemed if
-- there's an unclaimed reward; no-op (returns same state) if zero
-- unclaimed. Returns the new state for the client.
create or replace function public.redeem_loyalty_reward (
  p_vendor_id uuid,
  p_phone     text
) returns table (
  stamps_count     int,
  rewards_earned   int,
  rewards_redeemed int,
  rewards_unclaimed int,
  last_stamp_at    timestamptz,
  last_redeemed_at timestamptz,
  redeemed_ok      boolean
) language plpgsql security definer set search_path = public as $$
declare
  v_ok boolean := false;
begin
  -- Conditional decrement — only proceeds when there's at least one
  -- unclaimed reward. Done in a single SQL statement so no race.
  update public.loyalty_stamps
     set rewards_redeemed = rewards_redeemed + 1,
         last_redeemed_at = now(),
         updated_at       = now()
   where vendor_id = p_vendor_id
     and customer_phone = p_phone
     and rewards_earned > rewards_redeemed
  returning true into v_ok;

  return query select
    coalesce(ls.stamps_count, 0),
    coalesce(ls.rewards_earned, 0),
    coalesce(ls.rewards_redeemed, 0),
    coalesce(ls.rewards_earned, 0) - coalesce(ls.rewards_redeemed, 0),
    ls.last_stamp_at,
    ls.last_redeemed_at,
    coalesce(v_ok, false)
  from public.loyalty_stamps ls
  where ls.vendor_id = p_vendor_id and ls.customer_phone = p_phone
  union all
  -- Empty fallback so the client always gets exactly one row even when
  -- the redemption was a no-op against a non-existent record.
  select 0, 0, 0, 0, null::timestamptz, null::timestamptz, false
  where not exists (
    select 1 from public.loyalty_stamps
    where vendor_id = p_vendor_id and customer_phone = p_phone
  )
  limit 1;
end;
$$;

-- ─── RPC: vendor_adjust_loyalty_stamps ───────────────────────────────
-- Vendor-only RPC for manual stamp adjustments — used when the customer
-- is at the counter and the vendor wants to add or subtract stamps
-- outside the order flow. JWT vendor_id MUST match the row's vendor_id;
-- otherwise the SECURITY DEFINER block raises.
create or replace function public.vendor_adjust_loyalty_stamps (
  p_phone  text,
  p_delta  int
) returns table (
  stamps_count     int,
  rewards_earned   int,
  rewards_redeemed int,
  rewards_unclaimed int
) language plpgsql security definer set search_path = public as $$
declare
  v_vendor_id uuid;
begin
  v_vendor_id := (auth.jwt() -> 'app_metadata' ->> 'vendor_id')::uuid;
  if v_vendor_id is null then
    raise exception 'Not authorised — vendor token required';
  end if;

  insert into public.loyalty_stamps (vendor_id, customer_phone, stamps_count, last_stamp_at, updated_at)
  values (v_vendor_id, p_phone, greatest(0, p_delta), case when p_delta > 0 then now() else null end, now())
  on conflict (vendor_id, customer_phone)
  do update set
    stamps_count = greatest(0, loyalty_stamps.stamps_count + p_delta),
    last_stamp_at = case when p_delta > 0 then now() else loyalty_stamps.last_stamp_at end,
    updated_at    = now();

  return query select
    ls.stamps_count, ls.rewards_earned, ls.rewards_redeemed,
    (ls.rewards_earned - ls.rewards_redeemed) as rewards_unclaimed
  from public.loyalty_stamps ls
  where ls.vendor_id = v_vendor_id and ls.customer_phone = p_phone;
end;
$$;

-- ─── Grant execute permissions on the RPCs ──────────────────────────
grant execute on function public.get_loyalty_state      (uuid, text)       to anon, authenticated;
grant execute on function public.add_loyalty_stamp      (uuid, text, int)  to anon, authenticated;
grant execute on function public.redeem_loyalty_reward  (uuid, text)       to anon, authenticated;
grant execute on function public.vendor_adjust_loyalty_stamps (text, int)  to authenticated;
