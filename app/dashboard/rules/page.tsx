import { redirect } from "next/navigation";

export default async function RulesPage() {
  redirect("/dashboard/settings/rules");
}
