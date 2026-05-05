-- ─────────────────────────────────────────────────────────────────────────────
-- 20300122  Restaurant Commission (10%)
-- Extends seller_commissions to carry a type (marketplace|restaurant) and the
-- actual rate used, and updates the RPC to accept both.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add type + rate columns ────────────────────────────────────────────────
alter table seller_commissions
  add column if not exists commission_type text not null default 'marketplace'
    check (commission_type in ('marketplace', 'restaurant')),
  add column if not exists rate            numeric(5,4) not null default 0.05;

create index if not exists idx_seller_commissions_type
  on seller_commissions(commission_type);

-- ── 2. Also track restaurant commissions on restaurant_orders ─────────────────
alter table restaurant_orders
  add column if not exists commission_amount  numeric(12,2),
  add column if not exists commission_status  text default 'none'
    check (commission_status in ('none','pending','paid','overdue','waived'));

-- ── 3. Replace record_commission RPC — now accepts type + rate ────────────────
create or replace function record_commission(
  p_seller_id       uuid,
  p_order_id        text,
  p_order_total     numeric(12,2),
  p_commission_type text    default 'marketplace',
  p_rate            numeric default 0.05
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_amount  numeric(12,2);
  v_comm_id uuid;
begin
  v_amount := round(p_order_total * p_rate, 2);

  insert into seller_commissions(seller_id, order_id, amount, commission_type, rate)
  values (p_seller_id, p_order_id, v_amount, p_commission_type, p_rate)
  returning id into v_comm_id;

  -- Mirror onto the matching order table
  if p_commission_type = 'marketplace' then
    update orders
    set commission_amount = v_amount,
        commission_status = 'pending'
    where id = p_order_id;
  elsif p_commission_type = 'restaurant' then
    update restaurant_orders
    set commission_amount = v_amount,
        commission_status = 'pending'
    where id = p_order_id;
  end if;

  return v_comm_id;
end;
$$;

-- ── 4. Updated balance RPC — optionally filter by type ───────────────────────
create or replace function get_seller_commission_balance(
  p_seller_id       uuid,
  p_commission_type text default null   -- null = all types
)
returns table(
  total_owed     numeric,
  total_paid     numeric,
  pending_count  bigint,
  overdue_count  bigint
)
language sql
security definer
as $$
  select
    coalesce(sum(case when status in ('pending','overdue') then amount else 0 end), 0),
    coalesce(sum(case when status = 'paid'                 then amount else 0 end), 0),
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'overdue')
  from seller_commissions
  where seller_id = p_seller_id
    and (p_commission_type is null or commission_type = p_commission_type);
$$;
