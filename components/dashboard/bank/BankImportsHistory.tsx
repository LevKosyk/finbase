"use client";

import useSWR from "swr";
import DataState from "@/components/ui/DataState";

type ImportItem = {
  id: string;
  fileName: string;
  totalRows: number;
  importedIncome: number;
  importedExpense: number;
  duplicateRows: number;
  skippedRows: number;
  createdAt: string | Date;
};

const fetcher = async (url: string): Promise<{ imports: ImportItem[] }> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch bank imports");
  return response.json();
};

export default function BankImportsHistory({ initialImports }: { initialImports: ImportItem[] }) {
  const { data, error } = useSWR("/api/dashboard/bank-imports", fetcher, {
    fallbackData: { imports: initialImports },
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  if (error) {
    return (
      <DataState
        variant="error"
        title="Не вдалося завантажити історію імпортів"
        description="Спробуйте оновити сторінку або повторити запит пізніше."
      />
    );
  }

  const imports = data?.imports || initialImports;
  if (!imports.length) {
    return (
      <DataState
        variant="empty"
        title="Імпортів поки немає"
        description="Завантажте CSV/XLSX виписку вище, щоб побачити історію обробки."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500">
            <th className="py-2 pr-4">Дата</th>
            <th className="py-2 pr-4">Файл</th>
            <th className="py-2 pr-4">Рядків</th>
            <th className="py-2 pr-4">Дохід</th>
            <th className="py-2 pr-4">Витрати</th>
            <th className="py-2 pr-4">Дублі</th>
            <th className="py-2 pr-4">Пропущено</th>
          </tr>
        </thead>
        <tbody>
          {imports.map((item) => (
            <tr key={item.id} className="border-t border-gray-100 text-sm">
              <td className="py-3 pr-4">{new Date(item.createdAt).toLocaleString("uk-UA")}</td>
              <td className="py-3 pr-4 font-semibold">{item.fileName}</td>
              <td className="py-3 pr-4">{item.totalRows}</td>
              <td className="py-3 pr-4 font-semibold text-emerald-700">{item.importedIncome}</td>
              <td className="py-3 pr-4 font-semibold text-blue-700">{item.importedExpense}</td>
              <td className="py-3 pr-4 font-semibold text-amber-700">{item.duplicateRows}</td>
              <td className="py-3 pr-4 font-semibold text-red-700">{item.skippedRows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
