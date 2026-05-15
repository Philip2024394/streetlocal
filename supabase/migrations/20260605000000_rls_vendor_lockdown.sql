-- ═══════════════════════════════════════════════════════════
-- RLS lockdown — close the wide-open policies on every vendor
-- table. Reads stay open (customers must browse menus, promos,
-- banners), but writes require auth.jwt() -> app_metadata ->>
-- vendor_id to match the row's vendor_id.
--
-- The JWT comes from supabase.auth.signInWithPassword() after the
-- vendor-login Edge Function provisions an auth.users row with
-- app_metadata.vendor_id baked in (see supabase/functions/vendor-login).
--
-- BEFORE:  qual = true, with_check = true  → anyone can write
-- AFTER:   qual / with_check = (auth.jwt() -> app_metadata ->> vendor_id)::uuid = vendor_id
--
-- For vendor_accounts itself, the check is on the row's own `id`
-- (not vendor_id, since the row IS the vendor).
-- ═══════════════════════════════════════════════════════════

-- ── Helper: extract vendor_id from the JWT app_metadata claim.
--    Returns NULL when no JWT is present (anonymous request) — RLS
--    policies that compare against this then fail-closed for writes.
create or replace function public.jwt_vendor_id() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'vendor_id', '')::uuid,
    null
  )
$$;

grant execute on function public.jwt_vendor_id() to anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- vendor_menu_items — vendors manage their own menu, customers read.
-- ═══════════════════════════════════════════════════════════
drop policy if exists "Allow public all on vendor_menu_items" on public.vendor_menu_items;
drop policy if exists "vendor read menu" on public.vendor_menu_items;
drop policy if exists "vendor write menu" on public.vendor_menu_items;
drop policy if exists "vendor update menu" on public.vendor_menu_items;
drop policy if exists "vendor delete menu" on public.vendor_menu_items;

create policy "public read menu"      on public.vendor_menu_items for select using (true);
create policy "vendor insert menu"    on public.vendor_menu_items for insert with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor update menu"    on public.vendor_menu_items for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete menu"    on public.vendor_menu_items for delete using (public.jwt_vendor_id() = vendor_id);

-- ═══════════════════════════════════════════════════════════
-- promo_codes — vendors manage, customers validate by reading.
-- ═══════════════════════════════════════════════════════════
drop policy if exists "anon read promo"   on public.promo_codes;
drop policy if exists "anon insert promo" on public.promo_codes;
drop policy if exists "anon update promo" on public.promo_codes;
drop policy if exists "anon delete promo" on public.promo_codes;

create policy "public read promo"     on public.promo_codes for select using (true);
create policy "vendor insert promo"   on public.promo_codes for insert with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor update promo"   on public.promo_codes for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete promo"   on public.promo_codes for delete using (public.jwt_vendor_id() = vendor_id);

-- ═══════════════════════════════════════════════════════════
-- marketing_banners — same model.
-- ═══════════════════════════════════════════════════════════
drop policy if exists "anon read marketing banners"   on public.marketing_banners;
drop policy if exists "anon insert marketing banners" on public.marketing_banners;
drop policy if exists "anon update marketing banners" on public.marketing_banners;
drop policy if exists "anon delete marketing banners" on public.marketing_banners;

create policy "public read banners"   on public.marketing_banners for select using (true);
create policy "vendor insert banners" on public.marketing_banners for insert with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor update banners" on public.marketing_banners for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete banners" on public.marketing_banners for delete using (public.jwt_vendor_id() = vendor_id);

-- ═══════════════════════════════════════════════════════════
-- vendor_staff — vendor-only, sensitive (contains PINs).
-- ═══════════════════════════════════════════════════════════
drop policy if exists "anon read staff"   on public.vendor_staff;
drop policy if exists "anon insert staff" on public.vendor_staff;
drop policy if exists "anon update staff" on public.vendor_staff;
drop policy if exists "anon delete staff" on public.vendor_staff;

create policy "vendor read staff"     on public.vendor_staff for select using (public.jwt_vendor_id() = vendor_id);
create policy "vendor insert staff"   on public.vendor_staff for insert with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor update staff"   on public.vendor_staff for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete staff"   on public.vendor_staff for delete using (public.jwt_vendor_id() = vendor_id);

-- ═══════════════════════════════════════════════════════════
-- vendor_locations — public read so customers see addresses.
-- ═══════════════════════════════════════════════════════════
drop policy if exists "anon read locations"   on public.vendor_locations;
drop policy if exists "anon insert locations" on public.vendor_locations;
drop policy if exists "anon update locations" on public.vendor_locations;
drop policy if exists "anon delete locations" on public.vendor_locations;

create policy "public read locations" on public.vendor_locations for select using (true);
create policy "vendor insert locations" on public.vendor_locations for insert with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor update locations" on public.vendor_locations for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);
create policy "vendor delete locations" on public.vendor_locations for delete using (public.jwt_vendor_id() = vendor_id);

-- ═══════════════════════════════════════════════════════════
-- vendor_accounts — the row IS the vendor; check on `id`, not vendor_id.
-- Public read for active shops (existing policy preserved).
-- ═══════════════════════════════════════════════════════════
drop policy if exists "Allow public all on vendor_accounts" on public.vendor_accounts;
-- Keep "Public read active vendor" — already correct (limits to active shops).
-- Replace the ALL-permissive policy with a write-restricted one.
create policy "vendor update self" on public.vendor_accounts for update using (public.jwt_vendor_id() = id) with check (public.jwt_vendor_id() = id);
-- INSERT stays open: signup creates a new vendor row before any JWT exists.
create policy "anyone signup vendor" on public.vendor_accounts for insert with check (true);
-- DELETE blocked entirely from public — only service_role can delete a vendor.

-- ═══════════════════════════════════════════════════════════
-- vendor_orders — vendor-only read (contains customer phone numbers).
-- INSERT comes from the customer chat flow — allow public insert but
-- vendor_id must match an existing vendor (FK).
-- ═══════════════════════════════════════════════════════════
drop policy if exists "Allow public all on vendor_orders" on public.vendor_orders;

create policy "vendor read orders"    on public.vendor_orders for select using (public.jwt_vendor_id() = vendor_id);
create policy "public insert orders"  on public.vendor_orders for insert with check (true); -- customers don't have JWTs in v1
create policy "vendor update orders"  on public.vendor_orders for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);

-- ═══════════════════════════════════════════════════════════
-- chat_conversations + chat_messages — mixed traffic (customer + vendor).
-- v1 scope: vendor writes constrained by vendor_id; customer writes still
-- open (no customer JWT yet). Vendor reads constrained to own threads.
-- ═══════════════════════════════════════════════════════════
drop policy if exists "anon read conversations"   on public.chat_conversations;
drop policy if exists "anon insert conversations" on public.chat_conversations;
drop policy if exists "anon update conversations" on public.chat_conversations;

create policy "public read conversations" on public.chat_conversations for select using (true); -- customers re-open their thread by URL
create policy "anyone insert conversation" on public.chat_conversations for insert with check (true); -- customer chat start
-- Vendor can update any conversation they own; nobody else can update (e.g. status flips).
create policy "vendor update conversation" on public.chat_conversations for update using (public.jwt_vendor_id() = vendor_id) with check (public.jwt_vendor_id() = vendor_id);

drop policy if exists "anon read messages"   on public.chat_messages;
drop policy if exists "anon insert messages" on public.chat_messages;
drop policy if exists "anon update messages" on public.chat_messages;

create policy "public read messages"     on public.chat_messages for select using (true);
create policy "anyone insert message"    on public.chat_messages for insert with check (true); -- customer + vendor both insert
-- Updates (e.g. status flips on order_payload, marketing autopost markers)
-- are vendor-only.
create policy "vendor update message" on public.chat_messages for update using (
  exists (select 1 from public.chat_conversations c where c.id = chat_messages.conversation_id and c.vendor_id = public.jwt_vendor_id())
) with check (
  exists (select 1 from public.chat_conversations c where c.id = chat_messages.conversation_id and c.vendor_id = public.jwt_vendor_id())
);
