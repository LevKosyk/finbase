-- Enable RLS and owner-bound policies for Finbase tables.
-- Run in Supabase SQL editor (project with auth schema available).

alter table if exists "User" enable row level security;
alter table if exists "FOPSettings" enable row level security;
alter table if exists "NotificationSettings" enable row level security;
alter table if exists "Income" enable row level security;
alter table if exists "Expense" enable row level security;
alter table if exists "Subscription" enable row level security;
alter table if exists "Session" enable row level security;
alter table if exists "CategorizationRule" enable row level security;
alter table if exists "StatementImport" enable row level security;
alter table if exists "AuditLog" enable row level security;
alter table if exists "TwoFactorAuth" enable row level security;
alter table if exists "TrustedDevice" enable row level security;
alter table if exists "DashboardPreference" enable row level security;
alter table if exists "DocumentTemplate" enable row level security;
alter table if exists "DocumentGeneration" enable row level security;

-- Generic owner policies
drop policy if exists user_select on "User";
create policy user_select on "User" for select using (id = auth.uid());
drop policy if exists user_update on "User";
create policy user_update on "User" for update using (id = auth.uid());

drop policy if exists fop_owner_all on "FOPSettings";
create policy fop_owner_all on "FOPSettings" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists notifications_owner_all on "NotificationSettings";
create policy notifications_owner_all on "NotificationSettings" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists income_owner_all on "Income";
create policy income_owner_all on "Income" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists expense_owner_all on "Expense";
create policy expense_owner_all on "Expense" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists subscription_owner_all on "Subscription";
create policy subscription_owner_all on "Subscription" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists session_owner_all on "Session";
create policy session_owner_all on "Session" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists categorization_owner_all on "CategorizationRule";
create policy categorization_owner_all on "CategorizationRule" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists statement_import_owner_all on "StatementImport";
create policy statement_import_owner_all on "StatementImport" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists audit_owner_select on "AuditLog";
create policy audit_owner_select on "AuditLog" for select using ("userId" = auth.uid());
drop policy if exists audit_owner_insert on "AuditLog";
create policy audit_owner_insert on "AuditLog" for insert with check ("userId" = auth.uid());

drop policy if exists twofa_owner_all on "TwoFactorAuth";
create policy twofa_owner_all on "TwoFactorAuth" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists trusted_owner_all on "TrustedDevice";
create policy trusted_owner_all on "TrustedDevice" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists dashboard_pref_owner_all on "DashboardPreference";
create policy dashboard_pref_owner_all on "DashboardPreference" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists doc_template_owner_all on "DocumentTemplate";
create policy doc_template_owner_all on "DocumentTemplate" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists doc_generation_owner_all on "DocumentGeneration";
create policy doc_generation_owner_all on "DocumentGeneration" for all using ("userId" = auth.uid()) with check ("userId" = auth.uid());
