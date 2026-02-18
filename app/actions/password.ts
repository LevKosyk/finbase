"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";
import { logAuditEvent } from "@/lib/audit-log";

export async function changePassword(currentPassword: string, nextPassword: string) {
  const access = await ensureSensitiveActionAccess({
    action: "settings.password.change",
    requireRecentReauth: true,
    requireTwoFactor: true,
  });
  if (!access.ok) return { success: false, error: access.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { success: false, error: "Unauthorized" };

  const current = String(currentPassword || "");
  const next = String(nextPassword || "");
  if (next.length < 8) return { success: false, error: "Пароль має містити щонайменше 8 символів" };

  const check = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (check.error) {
    return { success: false, error: "Поточний пароль невірний" };
  }

  const update = await supabase.auth.updateUser({ password: next });
  if (update.error) {
    return { success: false, error: update.error.message || "Не вдалося змінити пароль" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "security.password.changed",
    entityType: "security",
  });

  return { success: true };
}
