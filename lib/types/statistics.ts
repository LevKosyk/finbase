export interface StatisticsData {
  period: string;
  kpi: {
    income: { total: number; change: number };
    expenses: { total: number; change: number };
    netProfit: { total: number; change: number };
    tax: { total: number; change: number };
  };
  charts: {
    incomeDynamics: { date: string; amount: number; type: "income" | "expense" }[];
    incomeStructure: { name: string; value: number; color: string }[];
    expenseStructure: { name: string; value: number; color: string }[];
  };
  fop: {
    limit: { current: number; max: number; percent: number; status: "ok" | "warning" | "danger" };
  };
  insights: {
    id: string;
    title: string;
    description: string;
    type: "growth" | "risk" | "neutral";
  }[];
}
