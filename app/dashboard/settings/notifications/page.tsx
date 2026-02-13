"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getUser } from "@/app/actions/auth";
import { updateNotificationSettings } from "@/app/actions/settings";
import { Loader2, Save, Mail, CreditCard } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";

export default function NotificationsSettingsPage() {
    type NotificationFormData = {
        emailNews: boolean;
        monthlyReport: boolean;
        reportChannel: "email" | "sms";
        weeklyGovReport: boolean;
    };

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [notifyData, setNotifyData] = useState<NotificationFormData>({
        emailNews: true,
        monthlyReport: true,
        reportChannel: "email",
        weeklyGovReport: false
    });

    useEffect(() => {
        async function loadData() {
            const user = await getUser();
            if (user && user.notifications) {
                setNotifyData({
                    emailNews: user.notifications.emailNews,
                    monthlyReport: user.notifications.monthlyReport,
                    weeklyGovReport: user.notifications.weeklyGovReport,
                    reportChannel: user.notifications.reportChannel === "sms" ? "sms" : "email",
                });
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const handleNotificationSave = async () => {
        setSaving(true);
        const res = await updateNotificationSettings(notifyData);
        setSaving(false);
        if(res.success) alert("Налаштування сповіщень збережено!");
        else alert("Помилка збереження");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--fin-primary)]" />
            </div>
        );
    }

    return (
        <MotionWrapper>
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-700 shadow-sm p-8 relative overflow-hidden">
                <div className="mb-10 pb-8 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Сповіщення</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Налаштуйте, які повідомлення ви хочете отримувати.</p>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">Новини та оновлення</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Отримувати інформацію про нові функції та зміни в законодавстві.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={notifyData.emailNews}
                                onChange={(e) => setNotifyData({...notifyData, emailNews: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-100 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-100 after:border-gray-300 dark:after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fin-primary)]"></div>
                        </label>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Щомісячний звіт</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Надсилати підсумки за місяць та нагадування.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={notifyData.monthlyReport}
                                    onChange={(e) => setNotifyData({...notifyData, monthlyReport: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-100 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-100 after:border-gray-300 dark:after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fin-primary)]"></div>
                            </label>
                        </div>
                        
                        {notifyData.monthlyReport && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Канал зв&apos;язку</label>
                                <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${notifyData.reportChannel === 'email' ? 'border-[var(--fin-primary)] bg-blue-50 dark:bg-blue-950/30 text-[var(--fin-primary)] dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="channel" 
                                            value="email" 
                                            className="sr-only"
                                            checked={notifyData.reportChannel === 'email'}
                                            onChange={() => setNotifyData({...notifyData, reportChannel: 'email'})}
                                        />
                                        <Mail className="w-5 h-5" />
                                        <span className="font-bold">Email</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${notifyData.reportChannel === 'sms' ? 'border-[var(--fin-primary)] bg-blue-50 dark:bg-blue-950/30 text-[var(--fin-primary)] dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="channel" 
                                            value="sms" 
                                            className="sr-only"
                                            checked={notifyData.reportChannel === 'sms'}
                                            onChange={() => setNotifyData({...notifyData, reportChannel: 'sms'})}
                                        />
                                        <CreditCard className="w-5 h-5" />
                                        <span className="font-bold">SMS</span>
                                        </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">Щотижневий звіт для уряду</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Нагадувати надсилати звіт до податкової (Email/SMS).</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={notifyData.weeklyGovReport || false} 
                                onChange={(e) => setNotifyData({...notifyData, weeklyGovReport: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-100 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-100 after:border-gray-300 dark:after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fin-primary)]"></div>
                        </label>
                    </div>

                    <div className="pt-6">
                        <Button 
                            onClick={handleNotificationSave}
                            disabled={saving} 
                            isLoading={saving}
                            leftIcon={<Save className="w-5 h-5" />}
                            size="lg"
                        >
                            Зберегти налаштування
                        </Button>
                    </div>
                </div>
            </div>
        </MotionWrapper>
    );
}
