type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function PageShell({ title, description, actions, children, className }: Props) {
  return (
    <div className={`max-w-7xl mx-auto pb-10 space-y-6 ${className || ""}`}>
      <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-7 py-7 md:px-9 md:py-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
            {description && <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {actions && <div className="flex w-full md:w-auto md:ml-auto flex-wrap items-center justify-end gap-3">{actions}</div>}
        </div>
      </section>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
