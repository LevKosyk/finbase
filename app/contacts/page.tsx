import StaticPageLayout from "@/components/marketing/StaticPageLayout";
import { Mail, MapPin, Send } from "lucide-react";

export default function ContactsPage() {
  return (
    <StaticPageLayout
      title="Контакти"
      subtitle="Пишіть нам з будь-яких питань щодо Finbase."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2 text-[var(--fin-primary)]">
            <Mail className="w-4 h-4" />
            <span className="font-semibold text-gray-900">Email підтримки</span>
          </div>
          <a href="mailto:support@finbase.ua" className="text-[var(--fin-primary)] font-medium hover:underline">
            support@finbase.ua
          </a>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2 text-[#2AABEE]">
            <Send className="w-4 h-4" />
            <span className="font-semibold text-gray-900">Telegram</span>
          </div>
          <a href="https://t.me/finbase_support" className="text-[#2AABEE] font-medium hover:underline">
            @finbase_support
          </a>
        </div>
      </section>
      <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-500">
          <MapPin className="w-4 h-4" />
          <span className="font-semibold text-gray-900">Локація</span>
        </div>
        <p>Київ, Україна</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Графік відповіді</h2>
        <p>Підтримка відповідає у робочі дні. Типовий час відповіді: протягом 24 годин.</p>
      </section>
      <p className="text-sm text-gray-500 pt-4 border-t border-gray-100 mt-8">Останнє оновлення: 18.02.2026</p>
    </StaticPageLayout>
  );
}
