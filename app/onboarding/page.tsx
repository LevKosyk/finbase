"use client";

import AuthLayout from "@/components/AuthLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { syncUser } from "@/app/actions/auth";
import { updateFOPSettings, updateProfile } from "@/app/actions/settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFinish = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
        // 1. Sync user to ensure DB record exists
        await syncUser();
        
        // 2. Update profile name
        await updateProfile({ name });

        // 3. Update FOP settings
        await updateFOPSettings({ group: 3 });

        router.push("/dashboard");
    } catch (e) {
        console.error(e);
        router.push("/dashboard");
    }
  };

  return (
    <AuthLayout
      title="Налаштування профілю"
      subtitle="Вкажіть дані вашого ФОП, щоб ми могли автоматизувати розрахунки."
      currentStep={2}
      totalSteps={2}
      stepContent={{
        icon: <Check className="w-24 h-24 text-white" />,
        title: "Налаштування профілю",
        description: "Сервіс налаштований для ФОП 3 групи."
      }}
    >
      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Як вас звати?</label>
           <Input 
             type="text" 
             placeholder="Ім'я та Прізвище" 
             value={name}
             onChange={(e) => setName(e.target.value)}
           />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Група ФОП</label>
           <div className="relative flex items-center p-4 rounded-xl border border-blue-500 bg-blue-50">
             <div className="flex-1">
               <div className="flex items-center gap-2">
                 <span className="font-bold text-gray-900">3 група</span>
                 <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold">Активна</span>
               </div>
               <p className="text-sm mt-1 text-gray-600">Для цього продукту доступна тільки 3 група ФОП.</p>
             </div>
             <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 text-white">
               <Check className="w-4 h-4" />
             </div>
           </div>
        </div>
        
        <Button
          onClick={handleFinish}
          disabled={loading || !name.trim()}
          isLoading={loading}
          size="lg"
          className="w-full"
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          {!loading && "Завершити налаштування"}
        </Button>
      </div>
    </AuthLayout>
  );
}
