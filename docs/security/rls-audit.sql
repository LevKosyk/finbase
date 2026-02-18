-- RLS audit: run in Supabase SQL Editor

-- 1) Public tables + RLS state
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2) Policies by table
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) user-scoped tables without auth.uid in policy
with user_tables as (
  select table_name
  from information_schema.columns
  where table_schema = 'public'
    and column_name = 'userId'
),
policy_text as (
  select
    tablename,
    lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) as policy_expr
  from pg_policies
  where schemaname = 'public'
)
select
  ut.table_name,
  case when exists (
    select 1 from policy_text p where p.tablename = ut.table_name and p.policy_expr like '%auth.uid%'
  ) then 'ok' else 'missing auth.uid policy' end as status
from user_tables ut
order by ut.table_name;
