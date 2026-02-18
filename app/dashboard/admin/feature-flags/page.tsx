import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import FeatureFlagRolloutManager from "@/components/dashboard/admin/FeatureFlagRolloutManager";

export default async function AdminFeatureFlagsPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/dashboard");

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Feature Rollout</h1>
        <p className="text-gray-600 dark:text-gray-300">Керуйте on/off та поступовим rollout 0-100%.</p>
      </div>
      <FeatureFlagRolloutManager />
    </div>
  );
}
