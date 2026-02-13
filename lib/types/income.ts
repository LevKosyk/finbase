export type IncomeData = {
  amount: number;
  source: string;
  date: Date;
  type: string;
  status: string;
};

export type IncomeImportRow = {
  amount: number;
  source: string;
  date: string;
  type: string;
  status?: string;
};
