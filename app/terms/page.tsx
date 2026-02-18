import StaticPageLayout from "@/components/marketing/StaticPageLayout";

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const backHref = params?.from === "register" ? "/register" : "/";
  return (
    <StaticPageLayout
      title="Умови використання"
      subtitle="Правила використання сервісу Finbase."
      backHref={backHref}
    >
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Загальні положення</h2>
        <p>Ці Умови регулюють використання веб-сайту та сервісів Finbase. Використовуючи сервіс, ви погоджуєтесь з цими Умовами.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Опис послуг</h2>
        <p>Finbase надає програмний інструмент для ведення обліку ФОП 3 групи. Ми не є заміною індивідуальної юридичної чи податкової консультації.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Акаунт і безпека</h2>
        <p>Користувач відповідає за безпеку доступу до акаунта та коректність введених даних.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Обмеження відповідальності</h2>
        <p>Ми не несемо відповідальності за наслідки використання некоректних даних або змін у законодавстві, які не були враховані користувачем вчасно.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Зміни умов</h2>
        <p>Ми можемо оновлювати ці Умови. Актуальна версія публікується на цій сторінці.</p>
      </section>
      <p className="text-sm text-gray-500 pt-4 border-t border-gray-100 mt-8">Останнє оновлення: 18.02.2026</p>
    </StaticPageLayout>
  );
}
