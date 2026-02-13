export interface CategorizationRuleInput {
  direction: "expense" | "income" | "auto";
  category: string;
  containsText?: string;
  counterpartyContains?: string;
  priority?: number;
  isActive?: boolean;
}
