export default function SettingsRulesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-96 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}
