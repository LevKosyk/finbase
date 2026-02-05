"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Shield, Smartphone, Globe, AlertTriangle, CheckCircle2, Chrome, Facebook, Apple } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SecurityPage() {
    // Mock data for linked accounts - in real app would fetch from auth.getUser() identities
    const [linkedAccounts, setLinkedAccounts] = useState([
        { provider: 'google', connected: true, email: 'levkosyk@gmail.com' },
        { provider: 'apple', connected: false },
        { provider: 'facebook', connected: false },
    ]);

    // Helper to render provider icon
    const getProviderIcon = (provider: string) => {
        switch(provider) {
            case 'google': return <Chrome className="w-6 h-6 text-gray-700" />;
            case 'apple': return <Apple className="w-6 h-6 text-gray-900" />;
            case 'facebook': return <Facebook className="w-6 h-6 text-blue-600" />;
            default: return <Globe className="w-6 h-6 text-gray-500" />;
        }
    };

    // Mock sessions - Supabase doesn't expose list of ALL sessions to client easily for security
    const sessions = [
        { id: 1, device: 'MacBook Pro', os: 'macOS 14.2', location: 'Kyiv, Ukraine', ip: '192.168.1.1', current: true, lastActive: 'Зараз' },
        { id: 2, device: 'iPhone 15 Pro', os: 'iOS 17.3', location: 'Kyiv, Ukraine', ip: '192.168.1.5', current: false, lastActive: '2 години тому' },
    ];

    const handleConnect = async (provider: string) => {
        // Implement OAuth connect flow
        await supabase.auth.signInWithOAuth({
            provider: provider as any,
            options: {
                redirectTo: `${window.location.origin}/dashboard/settings/security`,
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Linked Accounts */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--fin-primary)]">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                         <h2 className="text-xl font-bold text-gray-900">Прив'язані акаунти</h2>
                         <p className="text-sm text-gray-500">Використовуйте ці сервіси для швидкого входу.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {linkedAccounts.map((acc) => (
                        <div key={acc.provider} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-4">
                                {getProviderIcon(acc.provider)}
                                <span className="capitalize font-bold text-gray-700">{acc.provider}</span>
                                {acc.connected && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Підключено
                                    </span>
                                )}
                            </div>
                            {acc.connected ? (
                                <div className="text-sm text-gray-400 font-medium">
                                    {acc.email}
                                </div>
                            ) : (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleConnect(acc.provider)}
                                    className="text-[var(--fin-primary)] bg-white shadow-sm border border-gray-200 hover:bg-blue-50"
                                >
                                    Підключити
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                         <h2 className="text-xl font-bold text-gray-900">Активні сесії</h2>
                         <p className="text-sm text-gray-500">Пристрої, з яких виконано вхід у ваш акаунт.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="flex items-start justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        {session.device}
                                        {session.current && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                Цей пристрій
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500">{session.os} • {session.location}</p>
                                    <p className="text-xs text-gray-400 mt-1">IP: {session.ip} • <span className="text-[var(--fin-primary)]">{session.lastActive}</span></p>
                                </div>
                            </div>
                            {!session.current && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Завершити
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-start gap-3 text-yellow-800 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                    Якщо ви помітили підозрілу активність, негайно змініть пароль та завершіть усі інші сесії.
                </p>
            </div>
        </div>
    );
}
