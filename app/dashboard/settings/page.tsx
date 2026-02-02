"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  Building2, 
  Bell, 
  CreditCard, 
  Save, 
  Camera,
  Mail,
  MapPin,
  Briefcase,
  Loader2,
  Upload,
  Facebook, 
  Apple,
  Chrome // Using Chrome icon for Google as generic 'Globe' or specific brand might differ
} from "lucide-react";
import { getUser } from "@/app/actions/auth";
import { updateFOPSettings, updateProfile, updateNotificationSettings } from "@/app/actions/settings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for form data
  const [userData, setUserData] = useState<any>(null);
  const [fopData, setFopData] = useState<any>({
    legalName: "",
    ipn: "",
    group: 3,
    address: "", // Keep for fallback
    city: "",
    street: "",
    houseNumber: "",
    zipCode: "",
    kveds: ""
  });
  const [notifyData, setNotifyData] = useState<any>({
      emailNews: true,
      monthlyReport: true,
      reportChannel: "email"
  });

  useEffect(() => {
    async function loadData() {
        const user = await getUser();
        if (user) {
            setUserData(user);
            if (user.settings) {
                setFopData({
                    ...user.settings,
                    // Populate granular fields if they exist, otherwise they start empty (user needs to fill)
                    city: user.settings.city || "",
                    street: user.settings.street || "",
                    houseNumber: user.settings.houseNumber || "",
                    zipCode: user.settings.zipCode || "",
                });
            }
            if (user.notifications) {
                setNotifyData(user.notifications);
            }
        }
        setLoading(false);
    }
    loadData();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const res = await updateProfile({ 
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName} ${userData.lastName}`.trim(), // Keep legacy name in sync
          avatarUrl: userData.avatarUrl
      });
      setSaving(false);
      if(res.success) alert("Профіль оновлено!");
      else alert("Помилка оновлення");
  };

  const handleFOPSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const fullAddress = `${fopData.zipCode}, ${fopData.city}, ${fopData.street}, ${fopData.houseNumber}`;
      const res = await updateFOPSettings({
          legalName: fopData.legalName,
          ipn: fopData.ipn,
          group: Number(fopData.group),
          address: fullAddress, // Update legacy address
          city: fopData.city,
          street: fopData.street,
          houseNumber: fopData.houseNumber,
          zipCode: fopData.zipCode,
          kveds: fopData.kveds
      });
      setSaving(false);
      if(res.success) alert("Дані ФОП збережено!");
      else alert("Помилка збереження");
  };

  const handleNotificationSave = async () => {
      setSaving(true);
      const res = await updateNotificationSettings(notifyData);
      setSaving(false);
      if(res.success) alert("Налаштування сповіщень збережено!");
      else alert("Помилка збереження");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // In a real app, upload to storage here. 
      // For this demo, we'll try to just read it as base64 to show immediate feedback or just simulate success 
      // if we don't have a storage bucket set up with open policies.
      // But let's try a real upload assuming 'avatars' bucket exists or we can create it.
      // If not, we'll just alert.
      
      try {
          setSaving(true);
          const fileExt = file.name.split('.').pop();
          const fileName = `${userData.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

          if (uploadError) {
              // Fallback for demo: just local preview
               const reader = new FileReader();
               reader.onload = (ev) => {
                   setUserData({...userData, avatarUrl: ev.target?.result as string});
               };
               reader.readAsDataURL(file);
               alert("Upload failed (bucket missing?), using local preview.");
          } else {
             const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
             setUserData({...userData, avatarUrl: publicUrl});
          }
      } catch (error) {
          console.error(error);
      } finally {
          setSaving(false);
      }
  };

  const tabs = [
    { id: 'general', label: 'Загальні', icon: User },
    { id: 'business', label: 'Мій ФОП', icon: Building2 },
    { id: 'notifications', label: 'Сповіщення', icon: Bell },
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
        <p className="text-gray-500 mt-2">Керуйте вашим профілем та налаштуваннями</p>
      </div>

      {/* Modern Floating Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl mb-8 w-fit border border-gray-200/50">
        {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 outline-none ${
                    activeTab === tab.id 
                    ? 'text-gray-900 bg-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[var(--fin-primary)]' : 'text-current'}`} />
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 min-h-[500px] relative overflow-hidden">
        
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--fin-primary)]/5 rounded-full blur-3xl pointer-events-none"></div>

        {activeTab === 'general' && (
            <div className="max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row gap-8 mb-10 pb-10 border-b border-gray-100 items-start">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-xl flex items-center justify-center text-gray-400 text-4xl font-bold overflow-hidden relative">
                             {userData?.avatarUrl ? (
                                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                userData?.name?.[0] || userData?.firstName?.[0] || "U"
                             )}
                             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-8 h-8 text-white" />
                             </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Особиста інформація</h2>
                        <p className="text-gray-500 text-sm mb-4">Керуйте своїми особистими даними та аватаром.</p>
                        
                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" className="gap-2" leftIcon={<Chrome className="w-4 h-4" />}>
                                Google
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" leftIcon={<Apple className="w-4 h-4" />}>
                                Apple
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" leftIcon={<Facebook className="w-4 h-4" />}>
                                Facebook
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Ім'я"
                            type="text" 
                            value={userData?.firstName || ""} 
                            onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                            placeholder="Іван"
                        />
                        <Input 
                            label="Прізвище"
                            type="text" 
                            value={userData?.lastName || ""} 
                            onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                            placeholder="Петренко"
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
                    <p className="text-gray-500 text-sm mt-1">Детальні налаштування фізичної особи-підприємця.</p>
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
                                leftIcon={<Briefcase className="w-4 h-4" />}
                                className="font-mono"
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Група оподаткування</label>
                                <select 
                                    value={fopData.group || 3}
                                    onChange={(e) => setFopData({...fopData, group: e.target.value})}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[var(--fin-primary)] outline-none transition-all cursor-pointer"
                                >
                                    <option value="1">1 група</option>
                                    <option value="2">2 група</option>
                                    <option value="3">3 група (5%)</option>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Input 
                                label="Місто"
                                type="text" 
                                placeholder="Київ" 
                                value={fopData.city || ""}
                                onChange={(e) => setFopData({...fopData, city: e.target.value})}
                            />
                            <Input 
                                label="Індекс"
                                type="text" 
                                placeholder="02000" 
                                value={fopData.zipCode || ""}
                                onChange={(e) => setFopData({...fopData, zipCode: e.target.value})}
                            />
                        </div>
                         <div className="grid grid-cols-3 gap-6">
                             <div className="col-span-2">
                                <Input 
                                    label="Вулиця"
                                    type="text" 
                                    placeholder="Хрещатик" 
                                    value={fopData.street || ""}
                                    onChange={(e) => setFopData({...fopData, street: e.target.value})}
                                />
                             </div>
                             <Input 
                                label="Будинок/Кв"
                                type="text" 
                                placeholder="1 кв. 1" 
                                value={fopData.houseNumber || ""}
                                onChange={(e) => setFopData({...fopData, houseNumber: e.target.value})}
                            />
                        </div>
                     </div>

                     <hr className="border-gray-100" />

                      {/* KVEDs */}
                     <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">КВЕДи</label>
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

        {activeTab === 'notifications' && (
             <div className="max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                        <CreditCard className="w-5 h-5" /> {/* Should be Smartphone/Message usually */}
                                        <span className="font-bold">SMS</span>
                                     </label>
                                </div>
                            </div>
                        )}
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
        )}

      </div>
    </div>
  );
}
