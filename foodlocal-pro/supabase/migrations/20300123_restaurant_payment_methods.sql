-- ─────────────────────────────────────────────────────────────────────────────
-- 20300123  Restaurant payment methods — COD + Bank Transfer (3% discount)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add payment columns to restaurant_orders ───────────────────────────────
alter table restaurant_orders
  add column if not exists payment_method     text not null default 'cod'
    check (payment_method in ('cod', 'bank_transfer')),
  add column if not exists gross_total        numeric(12,2),   -- original before discount
  add column if not exists discount_amount    numeric(12,2) default 0,
  add column if not exists payment_proof_url  text,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists auto_confirm_at    timestamptz,     -- 15-min auto-confirm deadline
  add column if not exists qr_scanned_at      timestamptz,     -- driver barcode scan timestamp
  add column if not exists qr_scanned_by      uuid references auth.users(id);

-- ── 2. Index for payment status queries ──────────────────────────────────────
create index if not exists idx_restorders_payment_method
  on restaurant_orders(payment_method);

create index if not exists idx_restorders_auto_confirm
  on restaurant_orders(auto_confirm_at)
  where auto_confirm_at is not null and payment_confirmed_at is null;

-- ── 3. Auto-confirm bank-transfer orders after 15 min (cron) ─────────────────
create or replace function auto_confirm_bank_transfer_orders()
returns void
language sql
security definer
as $$
  update restaurant_orders
  set payment_confirmed_at = now(),
      commission_status     = 'pending'
  where payment_method      = 'bank_transfer'
    and payment_proof_url   is not null
    and payment_confirmed_at is null
    and auto_confirm_at     < now();
$$;

select cron.schedule(
  'auto-confirm-bank-transfer',
  '* * * * *',            -- every minute
  $$ select auto_confirm_bank_transfer_orders(); $$
) on conflict do nothing;

-- ── 4. RPC: record_commission_on_qr_scan ─────────────────────────────────────
-- Called when driver scans the restaurant QR (COD payment confirmed)
create or replace function record_commission_on_qr_scan(
  p_order_id  text,
  p_driver_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_seller_id  uuid;
  v_gross      numeric(12,2);
  v_comm_id    uuid;
begin
  select seller_id, coalesce(gross_total, total)
  into   v_seller_id, v_gross
  from   restaurant_orders
  where  id = p_order_id
    and  payment_method = 'cod'
    and  qr_scanned_at  is null;

  if not found then return null; end if;

  -- Mark order as QR-scanned
  update restaurant_orders
  set qr_scanned_at   = now(),
      qr_scanned_by   = p_driver_id
  where id = p_order_id;

  -- Record 10% commission
  insert into seller_commissions(seller_id, order_id, amount, commission_type, rate)
  values (v_seller_id, p_order_id, round(v_gross * 0.10, 2), 'restaurant', 0.10)
  returning id into v_comm_id;

  update restaurant_orders
  set commission_amount = round(v_gross * 0.10, 2),
      commission_status = 'pending'
  where id = p_order_id;

  return v_comm_id;
end;
$$;
