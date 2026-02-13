export type ExpenseData = {
  amount: number;
  category: string;
  date: Date;
  description?: string;
};

export type ExpenseImportRow = {
  amount: number;
  category: string;
  date: string;
  description?: string;
};
