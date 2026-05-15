-- ═══════════════════════════════════════════════════════════
-- plan_level — Starter / Professional / Enterprise tier gating.
--
-- NB: this is a NEW column. The existing `plan_tier` column is left
-- alone — it stores order-channel routing ('whatsapp' | 'chat' |
-- 'both') and is wired into ~30 code paths. Two separate concepts;
-- two separate columns.
--
-- Grandfathering rule: every existing row gets 'enterprise'. They
-- already paid for the full feature set when there was only one
-- tier, so silently demoting them would be a betrayal. New signups
-- default to 'starter'.
-- ═══════════════════════════════════════════════════════════

alter table public.vendor_accounts
  add column if not exists plan_level text;

-- Backfill grandfather: every existing row → enterprise. Idempotent.
update public.vendor_accounts
   set plan_level = 'enterprise'
 where plan_level is null;

-- After backfill: new rows default to 'starter', constraint enforced.
alter table public.vendor_accounts
  alter column plan_level set default 'starter',
  alter column plan_level set not null;

-- Drop the constraint if it exists, then add the fresh one. Lets
-- the migration run repeatedly without erroring.
alter table public.vendor_accounts
  drop constraint if exists vendor_accounts_plan_level_check;
alter table public.vendor_accounts
  add constraint vendor_accounts_plan_level_check
  check (plan_level in ('starter', 'professional', 'enterprise'));

create index if not exists vendor_plan_level_idx
  on public.vendor_accounts (plan_level);
