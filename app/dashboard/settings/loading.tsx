export default function SettingsLoading() {
  return (
    <div className="max-w-7xl mx-auto pb-10 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="h-12 w-[720px] max-w-full rounded-2xl bg-gray-200 dark:bg-gray-700" />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 space-y-5">
        <div className="h-7 w-48 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-12 w-44 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
