"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  CreditCard, 
  Save, 
  Camera,
  Mail,
  Smartphone,
  MapPin,
  FileText,
  Briefcase,
  Loader2
} from "lucide-react";
import { getUser } from "@/app/actions/auth";
import { updateFOPSettings, updateProfile } from "@/app/actions/settings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for form data
  const [userData, setUserData] = useState<any>(null);
  const [fopData, setFopData] = useState<any>({
    legalName: "",
    ipn: "",
    group: 3,
    address: "",
    kveds: ""
  });

  useEffect(() => {
    async function loadData() {
        const user = await getUser();
        if (user) {
            setUserData(user);
            if (user.settings) {
                setFopData(user.settings);
            }
        }
        setLoading(false);
    }
    loadData();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const res = await updateProfile({ name: userData.name });
      setSaving(false);
      if(res.success) alert("Профіль оновлено!");
      else alert("Помилка оновлення");
  };

  const handleFOPSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const res = await updateFOPSettings({
          legalName: fopData.legalName,
          ipn: fopData.ipn,
          group: Number(fopData.group),
          address: fopData.address,
          kveds: fopData.kveds
      });
      setSaving(false);
      if(res.success) alert("Дані ФОП збережено!");
      else alert("Помилка збереження");
  };

  const tabs = [
    { id: 'general', label: 'Загальні', icon: User },
    { id: 'business', label: 'Мій ФОП', icon: Building2 },
    { id: 'notifications', label: 'Сповіщення', icon: Bell },
    { id: 'security', label: 'Безпека', icon: Shield },
    { id: 'billing', label: 'Підписка', icon: CreditCard },
  ];

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[500px]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fin-primary)]" />
          </div>
      );
  }

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Налаштування</h1>
        <p className="text-gray-500 mt-2">Керуйте всіма аспектами вашого акаунту та бізнесу</p>
      </div>

      {/* Top Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-sm border border-gray-200/60 mb-8 inline-flex flex-wrap gap-1 sticky top-4 z-10 supports-[backdrop-filter]:bg-white/60">
        {tabs.map((tab) =>                <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    variant="ghost"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 h-auto shadow-none ${
                        activeTab === tab.id 
                            ? 'bg-white text-[var(--fin-primary)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 hover:bg-white' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent'
                    }`}
                >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'fill-[var(--fin-primary)]/10' : ''}`} />
                    {tab.label}
                </Button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 min-h-[500px] relative overflow-hidden">
        
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--fin-primary)]/5 rounded-full blur-3xl pointer-events-none"></div>

        {activeTab === 'general' && (
            <div className="max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row gap-8 mb-10 pb-10 border-b border-gray-100 items-start">
                    <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-xl flex items-center justify-center text-gray-400 text-4xl font-bold overflow-hidden">
                             {userData?.avatarUrl ? (
                                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                userData?.name?.[0] || "U"
                             )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Особиста інформація</h2>
                        <p className="text-gray-500 text-sm mb-4">Оновіть фото та персональні дані.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <Input 
                            label="Повне ім'я"
                            type="text" 
                            value={userData?.name || ""} 
                            onChange={(e) => setUserData({...userData, name: e.target.value})}
                            placeholder="Введіть ваше ім'я"
                        />
                    </div>

                    <Input 
                        label="Email адреса"
                        type="email" 
                        value={userData?.email || ""} 
                        disabled 
                        leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <div className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={saving} 
                            isLoading={saving}
                            leftIcon={<Save className="w-5 h-5" />}
                            size="lg"
                        >
                            Зберегти зміни
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {activeTab === 'business' && (
            <div className="max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-10 pb-8 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Дані ФОП</h2>
                    <p className="text-gray-500 text-sm mt-1">Ця інформація використовується для генерації звітів та декларацій.</p>
                </div>

                <form onSubmit={handleFOPSave} className="space-y-8">
                     {/* Basic Info */}
                     <div className="space-y-6">
                        <Input 
                            label="Повна назва ФОП"
                            type="text" 
                            placeholder="ФОП Петренко Петро Петрович" 
                            value={fopData.legalName || ""}
                            onChange={(e) => setFopData({...fopData, legalName: e.target.value})}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="ІПН (РНОКПП)"
                                type="text" 
                                placeholder="1234567890" 
                                maxLength={10} 
                                value={fopData.ipn || ""}
                                onChange={(e) => setFopData({...fopData, ipn: e.target.value})}
                                leftIcon={<FileText className="w-4 h-4" />}
                                className="font-mono"
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Група оподаткування</label>
                                <select 
                                    value={fopData.group || 3}
                                    onChange={(e) => setFopData({...fopData, group: e.target.value})}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all cursor-pointer"
                                >
                                    <option value="1">1 група (до 167 МЗП)</option>
                                    <option value="2">2 група (до 834 МЗП)</option>
                                    <option value="3">3 група (5%)</option>
                                    <option value="4">4 група (Загальна система)</option>
                                </select>
                            </div>
                        </div>
                     </div>

                     <hr className="border-gray-100" />

                     {/* Address */}
                     <div className="space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[var(--fin-primary)]" />
                            Адреса реєстрації
                        </h3>
                        <Input 
                            label="Повна адреса"
                            type="text" 
                            placeholder="02000, м. Київ, вул..." 
                            value={fopData.address || ""}
                            onChange={(e) => setFopData({...fopData, address: e.target.value})}
                        />
                     </div>

                     <hr className="border-gray-100" />

                      {/* KVEDs */}
                     <div className="space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[var(--fin-primary)]" />
                            КВЕДи
                        </h3>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Список КВЕДів</label>
                            <textarea 
                                rows={3} 
                                placeholder="62.01, 73.11..." 
                                value={fopData.kveds || ""}
                                onChange={(e) => setFopData({...fopData, kveds: e.target.value})}
                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                     </div>

                     <div className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={saving} 
                            isLoading={saving}
                            leftIcon={<Save className="w-5 h-5" />}
                            size="lg"
                        >
                            Зберегти дані ФОП
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {/* Other tabs remain simpler for now */}
        {(activeTab === 'notifications' || activeTab === 'security') && (
             <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Розділ у розробці</h3>
                <p className="text-gray-500 max-w-sm mt-3 leading-relaxed">
                    Ми працюємо над налаштуваннями безпеки та сповіщень. Вони з'являться зовсім скоро.
                </p>
             </div>
        )}

        {activeTab === 'billing' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        <FileText className="w-5 h-5 text-gray-400" />
                        Історія платежів
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                             <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-medium">Платежів ще не було</p>
                        <p className="text-gray-500 text-sm mt-1">Тут з'явиться історія ваших оплат за підписку.</p>
                    </div>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
}
