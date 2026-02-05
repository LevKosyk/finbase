"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Save, 
  Camera,
  Mail,
  Loader2,
  Upload
} from "lucide-react";
import { getUser } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/settings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import MotionWrapper from "@/components/MotionWrapper";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for form data
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
        const user = await getUser();
        if (user) {
            setUserData(user);
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
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          avatarUrl: userData.avatarUrl
      });
      setSaving(false);
      if(res.success) alert("Профіль оновлено!");
      else alert("Помилка оновлення");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
          setSaving(true);
          const fileExt = file.name.split('.').pop();
          const fileName = `${userData.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

          if (uploadError) {
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

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[500px]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fin-primary)]" />
          </div>
      );
  }

  return (
    <MotionWrapper>
      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 min-h-[500px] relative overflow-hidden">
        
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--fin-primary)]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
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
      </div>
    </MotionWrapper>
  );
}
