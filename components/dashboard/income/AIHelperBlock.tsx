"use client";

import { Sparkles } from "lucide-react";

export default function AIHelperBlock() {
    return (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-[1.5rem] flex items-start gap-4 mb-8">
            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500 shrink-0">
                <Sparkles className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-base font-bold text-indigo-900 mb-1">ФОП Підказка</h4>
                <p className="text-sm text-indigo-700/80 leading-relaxed">
                    Всі додані тут доходи автоматично враховуються для розрахунку єдиного податку (5%). 
                    Ми сформуємо декларацію за вас на основі цих даних в кінці кварталу.
                </p>
            </div>
        </div>
    );
}
