-- ProductsLocal Email — add vendor_accounts.order_email column
-- Idempotent so it's safe to run repeatedly.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'vendor_accounts'
  )
  and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vendor_accounts'
      and column_name = 'order_email'
  ) then
    alter table public.vendor_accounts add column order_email text;
  end if;
end$$;
