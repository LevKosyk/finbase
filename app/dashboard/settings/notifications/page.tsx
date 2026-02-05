"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getUser } from "@/app/actions/auth";
import { updateNotificationSettings } from "@/app/actions/settings";
import { Loader2, Save, Mail, CreditCard } from "lucide-react";
import MotionWrapper from "@/components/MotionWrapper";

export default function NotificationsSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [notifyData, setNotifyData] = useState<any>({
        emailNews: true,
        monthlyReport: true,
        reportChannel: "email",
        weeklyGovReport: false
    });

    useEffect(() => {
        async function loadData() {
            const user = await getUser();
            if (user && user.notifications) {
                setNotifyData(user.notifications);
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
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                <div className="mb-10 pb-8 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Сповіщення</h2>
                    <p className="text-gray-500 text-sm mt-1">Налаштуйте, які повідомлення ви хочете отримувати.</p>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                            <h3 className="font-bold text-gray-900">Новини та оновлення</h3>
                            <p className="text-sm text-gray-500 mt-1">Отримувати інформацію про нові функції та зміни в законодавстві.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={notifyData.emailNews}
                                onChange={(e) => setNotifyData({...notifyData, emailNews: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fin-primary)]"></div>
                        </label>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Щомісячний звіт</h3>
                                <p className="text-sm text-gray-500 mt-1">Надсилати підсумки за місяць та нагадування.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={notifyData.monthlyReport}
                                    onChange={(e) => setNotifyData({...notifyData, monthlyReport: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fin-primary)]"></div>
                            </label>
                        </div>
                        
                        {notifyData.monthlyReport && (
                            <div className="pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-1">
                                <label className="text-sm font-semibold text-gray-700 block mb-3">Канал зв'язку</label>
                                <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${notifyData.reportChannel === 'email' ? 'border-[var(--fin-primary)] bg-blue-50 text-[var(--fin-primary)]' : 'border-gray-200 hover:border-gray-300'}`}>
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
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${notifyData.reportChannel === 'sms' ? 'border-[var(--fin-primary)] bg-blue-50 text-[var(--fin-primary)]' : 'border-gray-200 hover:border-gray-300'}`}>
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

                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                            <h3 className="font-bold text-gray-900">Щотижневий звіт для уряду</h3>
                            <p className="text-sm text-gray-500 mt-1">Нагадувати надсилати звіт до податкової (Email/SMS).</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={notifyData.weeklyGovReport || false} 
                                onChange={(e) => setNotifyData({...notifyData, weeklyGovReport: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fin-primary)]"></div>
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
