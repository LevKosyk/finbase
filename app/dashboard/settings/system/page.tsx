"use client";

import { useState } from "react";
import { Monitor, Moon, Sun, Languages } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";

export default function SystemSettingsPage() {
    const { theme, setTheme } = useTheme();
    const [language, setLanguage] = useState("ua");

    return (
        <MotionWrapper>
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-200 dark:border-gray-700 shadow-sm p-8 relative overflow-hidden space-y-8">
                <div className="border-b border-gray-100 dark:border-gray-700 pb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Системні налаштування</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Налаштуйте вигляд та мову програми.</p>
                </div>

                {/* Theme Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sun className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        Тема оформлення
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button 
                            onClick={() => setTheme("light")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-[var(--fin-primary)] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-[var(--fin-primary)] dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                        >
                            <Sun className="w-6 h-6" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">Світла</span>
                        </button>
                        <button 
                            onClick={() => setTheme("dark")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-[var(--fin-primary)] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-[var(--fin-primary)] dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                        >
                            <Moon className="w-6 h-6" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">Темна</span>
                        </button>
                        <button 
                            onClick={() => setTheme("system")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system' ? 'border-[var(--fin-primary)] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-[var(--fin-primary)] dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                        >
                            <Monitor className="w-6 h-6" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">Системна</span>
                        </button>
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-700" />

                {/* Language Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Languages className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        Мова інтерфейсу
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div 
                            onClick={() => setLanguage('ua')}
                            className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${language === 'ua' ? 'border-[var(--fin-primary)] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                         >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🇺🇦</span>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Українська</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Рідна солов'їна</p>
                                </div>
                            </div>
                            {language === 'ua' && <div className="w-4 h-4 rounded-full bg-[var(--fin-primary)] dark:bg-blue-400"></div>}
                         </div>

                         <div 
                            onClick={() => setLanguage('en')}
                            className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all opacity-50 ${language === 'en' ? 'border-[var(--fin-primary)] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                         >
                             <div className="flex items-center gap-3">
                                <span className="text-2xl">🇺🇸</span>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">English</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">International</p>
                                </div>
                            </div>
                            {language === 'en' && <div className="w-4 h-4 rounded-full bg-[var(--fin-primary)] dark:bg-blue-400"></div>}
                         </div>
                    </div>
                </div>
            </div>
        </MotionWrapper>
    );
}
