-- ─── Food Local Chat — in-app order chat ───
-- Creates conversation + message tables, push subscription table, RLS, realtime.
-- Adds show_wa_on_visit_us flag on vendor_accounts (foodlocalchat-only toggle).

create extension if not exists "uuid-ossp";

-- ── Vendor profile flag: show WhatsApp on Visit Us (foodlocalchat only) ──
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='vendor_accounts') then
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='vendor_accounts' and column_name='show_wa_on_visit_us'
    ) then
      execute 'alter table public.vendor_accounts add column show_wa_on_visit_us boolean not null default false';
    end if;
  end if;
end $$;

-- ── Conversations ──
create table if not exists public.chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null,
  customer_phone text not null,
  customer_name text,
  last_message_at timestamptz default now(),
  unread_vendor_count int default 0,
  unread_customer_count int default 0,
  created_at timestamptz default now(),
  unique (vendor_id, customer_phone)
);
create index if not exists chat_conversations_vendor_idx on public.chat_conversations (vendor_id, last_message_at desc);
create index if not exists chat_conversations_customer_idx on public.chat_conversations (customer_phone);

-- ── Messages ──
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','vendor','system')),
  body text,
  order_payload jsonb,
  created_at timestamptz default now(),
  read_at timestamptz
);
create index if not exists chat_messages_conv_idx on public.chat_messages (conversation_id, created_at);

-- ── Vendor push subscriptions ──
create table if not exists public.vendor_push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists vendor_push_subs_vendor_idx on public.vendor_push_subscriptions (vendor_id);

-- ── Trigger: auto-update conversation.last_message_at + unread counters when a message lands ──
create or replace function public.fn_chat_message_after_insert() returns trigger language plpgsql as $$
begin
  if new.sender_role = 'customer' then
    update public.chat_conversations
       set last_message_at = new.created_at,
           unread_vendor_count = unread_vendor_count + 1
     where id = new.conversation_id;
  elsif new.sender_role = 'vendor' then
    update public.chat_conversations
       set last_message_at = new.created_at,
           unread_customer_count = unread_customer_count + 1
     where id = new.conversation_id;
  else
    update public.chat_conversations
       set last_message_at = new.created_at
     where id = new.conversation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_chat_message_after_insert on public.chat_messages;
create trigger trg_chat_message_after_insert
  after insert on public.chat_messages
  for each row execute function public.fn_chat_message_after_insert();

-- ── RLS ──
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.vendor_push_subscriptions enable row level security;

-- Customer policies:
--   Anonymous web customers don't authenticate via Supabase Auth in this app — they identify
--   themselves only via phone number. We therefore allow anon insert/select on conversations
--   and messages so the chat works without a logged-in customer session. The vendor side
--   filters by vendor_id which is owned by the authenticated vendor account row.
--   For tighter security a future iteration should issue a phone-bound JWT.

drop policy if exists "anon read conversations" on public.chat_conversations;
create policy "anon read conversations" on public.chat_conversations
  for select using (true);

drop policy if exists "anon insert conversations" on public.chat_conversations;
create policy "anon insert conversations" on public.chat_conversations
  for insert with check (true);

drop policy if exists "anon update conversations" on public.chat_conversations;
create policy "anon update conversations" on public.chat_conversations
  for update using (true) with check (true);

drop policy if exists "anon read messages" on public.chat_messages;
create policy "anon read messages" on public.chat_messages
  for select using (true);

drop policy if exists "anon insert messages" on public.chat_messages;
create policy "anon insert messages" on public.chat_messages
  for insert with check (true);

drop policy if exists "anon update messages" on public.chat_messages;
create policy "anon update messages" on public.chat_messages
  for update using (true) with check (true);

-- Vendor push subs:
drop policy if exists "anon read push subs" on public.vendor_push_subscriptions;
create policy "anon read push subs" on public.vendor_push_subscriptions
  for select using (true);

drop policy if exists "anon insert push subs" on public.vendor_push_subscriptions;
create policy "anon insert push subs" on public.vendor_push_subscriptions
  for insert with check (true);

drop policy if exists "anon delete push subs" on public.vendor_push_subscriptions;
create policy "anon delete push subs" on public.vendor_push_subscriptions
  for delete using (true);

-- ── Realtime publication ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_conversations'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_conversations';
  end if;
end $$;
