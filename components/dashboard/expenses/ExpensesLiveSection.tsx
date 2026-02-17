"use client";

import useSWR from "swr";
import ExpenseStats from "@/components/dashboard/expenses/ExpenseStats";
import ExpenseFilters from "@/components/dashboard/expenses/ExpenseFilters";
import ExpenseList from "@/components/dashboard/expenses/ExpenseList";

type ExpenseRow = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  date: string | Date;
};

type ExpenseStatsData = {
  total: number;
  change: number;
  average: number;
  count: number;
};

type ExpenseApiPayload = {
  expenses: ExpenseRow[];
  stats: ExpenseStatsData;
};

const fetcher = async (url: string): Promise<ExpenseApiPayload> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch expense data");
  return response.json();
};

export default function ExpensesLiveSection({
  initialExpenses,
  initialStats,
  query,
}: {
  initialExpenses: ExpenseRow[];
  initialStats: ExpenseStatsData;
  query: {
    q?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
  };
}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const key = `/api/dashboard/expenses?${params.toString()}`;

  const { data } = useSWR(key, fetcher, {
    fallbackData: { expenses: initialExpenses, stats: initialStats },
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  return (
    <>
      <ExpenseStats stats={data?.stats || initialStats} />
      <ExpenseFilters />
      <ExpenseList initialExpenses={data?.expenses || initialExpenses} />
    </>
  );
}
