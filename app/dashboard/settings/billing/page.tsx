"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";

export default function BillingSettingsPage() {
    return (
        <MotionWrapper>
             <div className="space-y-6">
                  <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Поточний план</p>
                        <h3 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-gray-100">Free</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Безкоштовно назавжди</p>
                      </div>
                      <Link
                        href="/dashboard/plans"
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--fin-primary)] px-6 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        Перейти на Pro
                      </Link>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      Історія платежів
                    </h3>
                    <div className="rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                      <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-gray-700">
                        <CreditCard className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">Платежів ще не було</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Тут з&apos;явиться історія ваших оплат за підписку.</p>
                    </div>
                  </section>
             </div>
        </MotionWrapper>
    );
}
