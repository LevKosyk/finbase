"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  Mail,
  Loader2
} from "lucide-react";
import { getUser } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/settings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import MotionWrapper from "@/components/MotionWrapper";
import { useToast } from "@/components/providers/ToastProvider";
import { useDashboardStore } from "@/lib/store/dashboard-store";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const profileDraft = useDashboardStore((state) => state.profileDraft);
  const setProfileDraft = useDashboardStore((state) => state.setProfileDraft);
  
  type UserProfileData = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };

  // State for form data
  const [userData, setUserData] = useState<UserProfileData | null>(null);

  useEffect(() => {
    async function loadData() {
        const user = await getUser();
        if (user) {
            setUserData(user);
            if (profileDraft.userId !== user.id) {
              setProfileDraft({
                userId: user.id,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
              });
            }
        }
        setLoading(false);
    }
    loadData();
  }, [profileDraft.userId, setProfileDraft]);

  const handleProfileSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userData) return;
      setSaving(true);
      const res = await updateProfile({ 
          firstName: profileDraft.firstName || undefined,
          lastName: profileDraft.lastName || undefined,
          name: `${profileDraft.firstName || ""} ${profileDraft.lastName || ""}`.trim(),
      });
      setSaving(false);
      if (res.success) {
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                firstName: profileDraft.firstName,
                lastName: profileDraft.lastName,
                name: `${profileDraft.firstName} ${profileDraft.lastName}`.trim(),
              }
            : prev
        );
        toast.success({ title: "Профіль оновлено" });
      }
      else toast.error({ title: "Помилка оновлення профілю" });
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[500px]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--fin-primary)]" />
          </div>
      );
  }

  if (!userData) {
      return (
          <div className="flex items-center justify-center min-h-[500px] text-gray-500 dark:text-gray-400">
              Не вдалося завантажити профіль.
          </div>
      );
  }

  return (
    <MotionWrapper>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 min-h-[500px]">
        <div className="max-w-4xl">
            <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Особиста інформація</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Керуйте своїми персональними даними.</p>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label="Ім'я"
                        type="text" 
                        value={profileDraft.firstName} 
                        onChange={(e) => setProfileDraft({ firstName: e.target.value })}
                        placeholder="Іван"
                    />
                    <Input 
                        label="Прізвище"
                        type="text" 
                        value={profileDraft.lastName} 
                        onChange={(e) => setProfileDraft({ lastName: e.target.value })}
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
