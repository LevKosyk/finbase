import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import Link from "next/link";

export default async function AdminPage() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-4">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Admin</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Admin route is protected by explicit role check (`ADMIN_EMAILS`).
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/admin/feature-flags" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold">
          Feature Rollout
        </Link>
        <Link href="/dashboard/admin/security" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold">
          Security Dashboard
        </Link>
        <Link href="/dashboard/admin/metrics" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold">
          Бізнес-метрики
        </Link>
        <Link href="/dashboard/admin/security/rls" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold">
          RLS Audit
        </Link>
      </div>
    </div>
  );
}
