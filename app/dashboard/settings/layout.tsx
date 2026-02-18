import SettingsNav from "@/components/dashboard/SettingsNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Налаштування</h1>
        <p className="text-gray-500 dark:text-gray-400">Керуйте своїм профілем та безпекою</p>
      </div>

      <SettingsNav />

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}
