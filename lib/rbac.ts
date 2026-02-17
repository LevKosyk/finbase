import { createClient } from "@/utils/supabase/server";

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
  return { ok: true as const, user };
}

export async function requireAdmin() {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const admins = parseAdminEmails();
  if (admins.length === 0) {
    return { ok: false as const, status: 403, error: "Admin access is not configured" };
  }

  const userEmail = (auth.user.email || "").toLowerCase();
  if (!admins.includes(userEmail)) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, user: auth.user };
}
