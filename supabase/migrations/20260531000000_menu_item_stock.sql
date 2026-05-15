-- ═══════════════════════════════════════════════════════════
-- Menu item stock — finite stock count per item, null = unlimited.
--
-- The client already has the full UX (stock input, auto-hide when
-- 0, low-stock badge, oversell guard) but the column didn't exist
-- on vendor_menu_items, so writes were silently dropped and stock
-- reset on page reload. Adding it persistently here.
--
-- Decrement happens via the dec_menu_item_stock RPC so concurrent
-- customers can't oversell — postgres serialises the update.
-- ═══════════════════════════════════════════════════════════

alter table public.vendor_menu_items
  add column if not exists stock integer;

-- Atomic decrement. Returns the row only if the update succeeded
-- (i.e. there was enough stock). If null is passed for new_stock,
-- this is a no-op (matches the "unlimited" convention).
create or replace function public.dec_menu_item_stock(
  item_id uuid,
  qty integer
) returns table (id uuid, stock integer)
language plpgsql
security definer
as $$
begin
  return query
  update public.vendor_menu_items vmi
     set stock = greatest(0, coalesce(vmi.stock, 0) - qty)
   where vmi.id = item_id
     and vmi.stock is not null
     and vmi.stock >= qty
  returning vmi.id, vmi.stock;
end
$$;

grant execute on function public.dec_menu_item_stock(uuid, integer) to anon, authenticated;
