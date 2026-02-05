"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";

export default function BillingSettingsPage() {
    return (
        <MotionWrapper>
             <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-r from-gray-900 via-[#1e293b] to-gray-800 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold mb-4 border border-white/20">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            ACTIVE
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Поточний план</p>
                        <h3 className="text-4xl font-extrabold tracking-tight">Free</h3>
                        <p className="text-gray-400 mt-2 text-sm">Безкоштовно назавжди</p>
                    </div>
                    <div className="mt-6 md:mt-0 relative z-10">
                        <Link href="/dashboard/plans" className="inline-flex px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                            Перейти на Pro
                        </Link>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        Історія платежів
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                             <CreditCard className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-medium">Платежів ще не було</p>
                        <p className="text-gray-500 text-sm mt-1">Тут з'явиться історія ваших оплат за підписку.</p>
                    </div>
                 </div>
             </div>
        </MotionWrapper>
    );
}
