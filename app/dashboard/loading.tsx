export default function DashboardLoading() {
  return (
    <div className="pb-10 max-w-350 mx-auto space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="h-22 rounded-2xl bg-gray-200 dark:bg-gray-700" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-30 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>

      {/* Chart + Today actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 h-75 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="xl:col-span-4 h-75 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 h-65 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="xl:col-span-4 h-55 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="xl:col-span-3 h-45 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
