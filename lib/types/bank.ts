export interface BankStatementRow {
  date: string;
  amount: number;
  description?: string;
  counterparty?: string;
  currency?: string;
  direction?: "income" | "expense" | "";
}
