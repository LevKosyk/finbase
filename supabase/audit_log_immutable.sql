-- Make audit log immutable (block UPDATE/DELETE).

create or replace function prevent_auditlog_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'AuditLog is immutable';
end;
$$;

drop trigger if exists auditlog_prevent_update on "AuditLog";
create trigger auditlog_prevent_update
before update on "AuditLog"
for each row
execute function prevent_auditlog_mutation();

drop trigger if exists auditlog_prevent_delete on "AuditLog";
create trigger auditlog_prevent_delete
before delete on "AuditLog"
for each row
execute function prevent_auditlog_mutation();
