"use client";

import useSWR from "swr";
import IncomeStats from "@/components/dashboard/income/IncomeStats";
import AIHelperBlock from "@/components/dashboard/income/AIHelperBlock";
import IncomeFilters from "@/components/dashboard/income/IncomeFilters";
import IncomeList from "@/components/dashboard/IncomeList";

type IncomeRow = {
  id: string;
  source: string;
  amount: number;
  date: string | Date;
  status: string;
  type: string;
};

type IncomeStatsData = {
  total: number;
  change: number;
  average: number;
  pending: number;
};

type IncomeApiPayload = {
  incomes: IncomeRow[];
  stats: IncomeStatsData;
};

const fetcher = async (url: string): Promise<IncomeApiPayload> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch income data");
  return response.json();
};

export default function IncomeLiveSection({
  initialIncomes,
  initialStats,
  query,
}: {
  initialIncomes: IncomeRow[];
  initialStats: IncomeStatsData;
  query: {
    q?: string;
    type?: string;
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
  const key = `/api/dashboard/income?${params.toString()}`;

  const { data } = useSWR(key, fetcher, {
    fallbackData: { incomes: initialIncomes, stats: initialStats },
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  return (
    <>
      <IncomeStats stats={data?.stats || initialStats} />
      <AIHelperBlock />
      <IncomeFilters />
      <IncomeList initialIncomes={data?.incomes || initialIncomes} />
    </>
  );
}
