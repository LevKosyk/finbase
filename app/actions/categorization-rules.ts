"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CategorizationRuleInput {
  direction: "expense" | "income" | "auto";
  category: string;
  containsText?: string;
  counterpartyContains?: string;
  priority?: number;
  isActive?: boolean;
}

export async function getCategorizationRules() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return prisma.categorizationRule.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
}

export async function createCategorizationRule(input: CategorizationRuleInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!input.category?.trim()) {
    return { success: false, error: "Category is required" };
  }
  if (!input.containsText?.trim() && !input.counterpartyContains?.trim()) {
    return { success: false, error: "Set containsText or counterpartyContains" };
  }

  await prisma.categorizationRule.create({
    data: {
      userId: user.id,
      direction: input.direction,
      category: input.category.trim(),
      containsText: input.containsText?.trim() || null,
      counterpartyContains: input.counterpartyContains?.trim() || null,
      priority: input.priority ?? 100,
      isActive: input.isActive ?? true,
    },
  });

  revalidatePath("/dashboard/rules");
  return { success: true };
}

export async function updateCategorizationRule(id: string, input: Partial<CategorizationRuleInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.categorizationRule.update({
    where: { id, userId: user.id },
    data: {
      direction: input.direction,
      category: input.category?.trim(),
      containsText: input.containsText !== undefined ? input.containsText.trim() || null : undefined,
      counterpartyContains: input.counterpartyContains !== undefined ? input.counterpartyContains.trim() || null : undefined,
      priority: input.priority,
      isActive: input.isActive,
    },
  });

  revalidatePath("/dashboard/rules");
  return { success: true };
}

export async function deleteCategorizationRule(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.categorizationRule.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/dashboard/rules");
  return { success: true };
}
