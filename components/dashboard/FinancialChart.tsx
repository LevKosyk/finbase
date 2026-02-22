"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { memo } from "react";
import type { DashboardStats } from "@/lib/types/dashboard";

interface FinancialChartProps {
  data: DashboardStats["income"]["history"];
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-950 rounded-xl px-3 py-2.5 shadow-xl border border-white/10 min-w-28">
      <p className="text-[11px] font-semibold text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-white text-xs font-bold">
            {Number(entry.value ?? 0).toLocaleString("uk-UA")}&nbsp;&#8372;
          </span>
        </div>
      ))}
    </div>
  );
}

const FinancialChart = memo(function FinancialChart({
  data,
}: FinancialChartProps) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col min-h-70">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Динаміка доходів
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Поточний рік · щомісячно
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-(--fin-primary) inline-block" />
            Дохід
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-48">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
              Немає даних для відображення
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--fin-primary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--fin-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                width={38}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "var(--fin-primary)",
                  strokeWidth: 1.5,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Дохід"
                stroke="var(--fin-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradIncome)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "var(--fin-primary)",
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export default FinancialChart;
