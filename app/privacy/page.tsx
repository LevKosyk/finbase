import StaticPageLayout from "@/components/marketing/StaticPageLayout";

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const backHref = params?.from === "register" ? "/register" : "/";
  return (
    <StaticPageLayout
      title="Політика конфіденційності"
      subtitle="Як Finbase збирає, використовує та захищає ваші дані."
      backHref={backHref}
    >
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Які дані ми збираємо</h2>
        <p>Ми зберігаємо лише дані, необхідні для роботи сервісу: дані профілю, реквізити ФОП та фінансові записи, які ви додаєте.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Для чого використовуються дані</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>створення та обслуговування акаунта;</li>
          <li>розрахунки, аналітика та формування документів;</li>
          <li>нагадування та сервісні повідомлення;</li>
          <li>підвищення якості продукту.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Захист інформації</h2>
        <p>Ми використовуємо сучасні механізми безпеки: шифрування, контроль доступу, аудит дій та моніторинг підозрілої активності.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Передача третім сторонам</h2>
        <p>Ми не продаємо персональні дані. Передача можлива лише у межах технічних інтеграцій та згідно із законом.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Ваші права</h2>
        <p>Ви можете звернутися до підтримки щодо доступу, виправлення або видалення даних, повʼязаних з вашим акаунтом.</p>
      </section>
      <p className="text-sm text-gray-500 pt-4 border-t border-gray-100 mt-8">Останнє оновлення: 18.02.2026</p>
    </StaticPageLayout>
  );
}
