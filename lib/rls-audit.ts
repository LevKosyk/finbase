import { prisma } from "@/lib/prisma";

type TableInfo = { schema_name: string; table_name: string; rls_enabled: boolean; };
type PolicyInfo = { tablename: string; policyname: string; qual: string | null; with_check: string | null; };
type ColumnInfo = { table_name: string; column_name: string; };

const IGNORE_TABLES = new Set(["_prisma_migrations"]);

export async function runRlsAudit() {
  const tables = await prisma.$queryRaw<TableInfo[]>`
    select schemaname as schema_name, tablename as table_name, rowsecurity as rls_enabled
    from pg_tables t
    join pg_class c on c.relname = t.tablename
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
    where t.schemaname = 'public'
    order by t.tablename
  `;

  const policies = await prisma.$queryRaw<PolicyInfo[]>`
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  `;

  const userIdColumns = await prisma.$queryRaw<ColumnInfo[]>`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public' and column_name = 'userId'
  `;

  const policiesByTable = new Map<string, PolicyInfo[]>();
  for (const policy of policies) {
    const list = policiesByTable.get(policy.tablename) || [];
    list.push(policy);
    policiesByTable.set(policy.tablename, list);
  }

  const userScopedTables = new Set(userIdColumns.map((c) => c.table_name));

  const tableAudit = tables
    .filter((t) => !IGNORE_TABLES.has(t.table_name))
    .map((table) => {
      const tablePolicies = policiesByTable.get(table.table_name) || [];
      const hasPolicies = tablePolicies.length > 0;
      const hasAuthUidPolicy = tablePolicies.some((p) => {
        const q = `${p.qual || ""} ${p.with_check || ""}`.toLowerCase();
        return q.includes("auth.uid");
      });
      const shouldBeUserScoped = userScopedTables.has(table.table_name);
      return {
        table: table.table_name,
        rlsEnabled: table.rls_enabled,
        hasPolicies,
        hasAuthUidPolicy,
        shouldBeUserScoped,
        policyCount: tablePolicies.length,
        policies: tablePolicies,
        risk:
          shouldBeUserScoped && (!table.rls_enabled || !hasPolicies || !hasAuthUidPolicy)
            ? "high"
            : !table.rls_enabled || !hasPolicies
              ? "medium"
              : "low",
      };
    });

  return {
    summary: {
      totalTables: tableAudit.length,
      tablesWithRls: tableAudit.filter((t) => t.rlsEnabled).length,
      tablesWithPolicies: tableAudit.filter((t) => t.hasPolicies).length,
      highRisk: tableAudit.filter((t) => t.risk === "high").length,
      mediumRisk: tableAudit.filter((t) => t.risk === "medium").length,
    },
    tables: tableAudit,
    generatedAt: new Date().toISOString(),
  };
}
