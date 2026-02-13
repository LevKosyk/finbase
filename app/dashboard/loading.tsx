export default function DashboardLoading() {
  return (
    <div className="min-h-[calc(100vh-110px)] animate-pulse">
      <div className="rounded-[2.2rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 md:p-6 flex flex-col gap-5">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-8 w-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="hidden lg:flex gap-2">
            <div className="h-11 w-36 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-11 w-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-11 w-28 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-[168px] rounded-3xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 flex flex-col gap-5">
            <div className="h-[360px] rounded-3xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-[220px] rounded-3xl bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex flex-col gap-5">
            <div className="h-[190px] rounded-3xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-[245px] rounded-3xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-[180px] rounded-3xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
