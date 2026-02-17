import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";

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
    </div>
  );
}
