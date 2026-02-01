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
  const [group, setGroup] = useState<number>(3);
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
        await updateFOPSettings({ group });

        router.push("/dashboard");
    } catch (e) {
        console.error(e);
        router.push("/dashboard");
    }
  };

  const groups = [
    { id: 1, title: "1 група", desc: "До 167 МЗП. Роздріб/послуги" },
    { id: 2, title: "2 група", desc: "До 834 МЗП. Послуги/торгівля/ресторани" },
    { id: 3, title: "3 група", desc: "5% від доходу. Будь-яка діяльність", recommended: true },
    { id: 4, title: "4 група", desc: "Загальна система оподаткування" },
  ];

  return (
    <AuthLayout
      title="Налаштування профілю"
      subtitle="Вкажіть дані вашого ФОП, щоб ми могли автоматизувати розрахунки."
      currentStep={2}
      totalSteps={2}
      stepContent={{
        icon: <Check className="w-24 h-24 text-white" />,
        title: "Налаштування профілю",
        description: "Вкажіть вашу групу ФОП для автоматизації податкового обліку."
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
           <div className="grid grid-cols-1 gap-3">
             {groups.map((g) => (
               <label key={g.id} className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${group === g.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="group" 
                    className="sr-only" 
                    checked={group === g.id}
                    onChange={() => setGroup(g.id)}
                  />
                  <div className="flex-1">
                     <div className="flex items-center gap-2">
                          <span className={`font-bold ${group === g.id ? 'text-gray-900' : 'text-gray-700'}`}>{g.title}</span>
                          {g.recommended && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold">Рекомендовано</span>
                          )}
                     </div>
                     <p className={`text-sm mt-1 ${group === g.id ? 'text-gray-600' : 'text-gray-500'}`}>{g.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${group === g.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                     {group === g.id && <Check className="w-4 h-4" />}
                  </div>
               </label>
             ))}
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
