export interface DashboardStats {
  income: {
    total: number;
    change: number;
    history: { name: string; value: number }[];
  };
  expenses: {
    total: number;
    change: number;
  };
  tax: {
    amount: number;
    singleTax: number;
    esv: number;
    status: "ok" | "warning" | "danger";
    nextPaymentDate: string | null;
  };
  limit: {
    current: number;
    max: number;
    percent: number;
  };
  fop: {
    group: number;
    taxSystem: string;
    reportingPeriod: string;
  };
}
