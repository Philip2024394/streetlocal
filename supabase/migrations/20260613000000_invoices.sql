-- Invoices — vendor-customisable A4 invoice generation per order.
-- Distinct from the receipt (which is a quick thank-you slip);
-- invoice is the legal-grade document a B2B customer / accountant
-- can file. Required in Indonesia (Faktur Pajak) for VAT-registered
-- vendors; useful everywhere for catering / wholesale.
--
-- Vendor settings (on vendor_accounts):
--   invoice_template_id        — 'classic' | 'modern' | 'bold' | 'minimal'
--   invoice_letterhead_url     — uploaded background image (A4 portrait)
--   invoice_legal_name         — full registered business name
--   invoice_tax_id             — NPWP / VAT / EIN / ABN / etc.
--   invoice_registration_number— company registration / CIN / etc.
--   invoice_bank_details       — multi-line bank account block
--   invoice_signature_url      — vendor signature image
--   invoice_payment_terms      — "Due on receipt" / "Net 30" etc.
--   invoice_footer_note        — free-text footer line
--   invoice_number_prefix      — "INV-" / "FK-" / "F-2026-" etc.
--   invoice_next_number        — auto-incrementing counter
--   invoice_autosend_chat      — auto-post invoice to chat on payment
--   invoice_autosend_email     — auto-email invoice on payment
--   invoice_show_total_in_words— add a "Total in words" line
--
-- Per-order fields (on vendor_orders):
--   invoice_number             — assigned by assign_invoice_number()
--   invoice_customer_business  — optional B2B business name
--   invoice_customer_tax_id    — optional B2B tax id
--   invoice_po_reference       — optional purchase-order ref
--   invoice_due_date           — optional due date
--   invoice_pdf_url            — uploaded PDF copy (set when emailed)
--   invoice_sent_at            — idempotency stamp for cron sweep

alter table public.vendor_accounts
  add column if not exists invoice_template_id        text       not null default 'classic' check (invoice_template_id in ('classic','modern','bold','minimal')),
  add column if not exists invoice_letterhead_url     text,
  add column if not exists invoice_legal_name         text,
  add column if not exists invoice_tax_id             text,
  add column if not exists invoice_registration_number text,
  add column if not exists invoice_bank_details       text,
  add column if not exists invoice_signature_url      text,
  add column if not exists invoice_payment_terms      text,
  add column if not exists invoice_footer_note        text,
  add column if not exists invoice_number_prefix      text       not null default 'INV-',
  add column if not exists invoice_next_number        int        not null default 1 check (invoice_next_number >= 1),
  add column if not exists invoice_autosend_chat      boolean    not null default false,
  add column if not exists invoice_autosend_email     boolean    not null default false,
  add column if not exists invoice_show_total_in_words boolean   not null default false;

alter table public.vendor_orders
  add column if not exists invoice_number            text,
  add column if not exists invoice_customer_business text,
  add column if not exists invoice_customer_tax_id   text,
  add column if not exists invoice_po_reference      text,
  add column if not exists invoice_due_date          date,
  add column if not exists invoice_pdf_url           text,
  add column if not exists invoice_sent_at           timestamptz;

-- Index for the cron sweep — find paid orders awaiting invoice send.
create index if not exists vendor_orders_invoice_sweep_idx
  on public.vendor_orders (vendor_id, payment_status, invoice_sent_at)
  where payment_status = 'paid' and invoice_sent_at is null;

-- ─── RPC: assign_invoice_number ──────────────────────────────────────
-- Atomically grabs the next invoice number for a vendor + writes it
-- to the order. Returns the formatted invoice number string.
-- Caller (vendor or service role) must already have UPDATE rights on
-- vendor_orders / vendor_accounts via RLS.

create or replace function public.assign_invoice_number (
  p_vendor_id uuid,
  p_order_id  uuid
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_prefix text;
  v_num    int;
  v_str    text;
  v_existing text;
begin
  -- If the order already has a number assigned, return it (idempotent).
  select invoice_number into v_existing from public.vendor_orders
   where id = p_order_id and vendor_id = p_vendor_id;
  if v_existing is not null then
    return v_existing;
  end if;

  -- Atomic increment of the vendor's counter — UPDATE...RETURNING is
  -- the standard Postgres way to grab "next value with no race".
  update public.vendor_accounts
     set invoice_next_number = invoice_next_number + 1
   where id = p_vendor_id
  returning invoice_number_prefix, invoice_next_number - 1 into v_prefix, v_num;

  if v_num is null then
    raise exception 'Vendor not found: %', p_vendor_id;
  end if;

  -- Format: prefix + zero-padded 6-digit number. "INV-000001" etc.
  v_str := coalesce(v_prefix, 'INV-') || lpad(v_num::text, 6, '0');

  update public.vendor_orders
     set invoice_number = v_str
   where id = p_order_id and vendor_id = p_vendor_id;

  return v_str;
end;
$$;

grant execute on function public.assign_invoice_number(uuid, uuid) to authenticated, service_role;

-- ─── Cron job: invoice autosend sweep ──────────────────────────────
-- Same pattern as order-receipt-autosend-sweep. Runs every minute,
-- looks for paid orders with no invoice sent yet, fires the
-- order-invoice-autosend Edge Function for each. Edge Function reads
-- vendor's autosend_chat/email flags and acts (or no-ops if both off).

do $$
declare j_id bigint;
begin
  for j_id in (select jobid from cron.job where jobname = 'order-invoice-autosend-sweep')
  loop
    perform cron.unschedule(j_id);
  end loop;
end $$;

select cron.schedule(
  'order-invoice-autosend-sweep',
  '* * * * *',
  $cron$
    with paid_unsent as (
      select vo.id
      from public.vendor_orders vo
      join public.vendor_accounts va on va.id = vo.vendor_id
      where vo.payment_status = 'paid'
        and vo.invoice_sent_at is null
        and (va.invoice_autosend_chat or va.invoice_autosend_email)
      order by vo.created_at desc
      limit 20
    )
    select net.http_post(
      url := 'https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/order-invoice-autosend',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object('order_id', id::text)
    )
    from paid_unsent;
  $cron$
);
