"use client";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AIHelper from "@/components/AIHelper";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  const signUpWithGoogle = async () => {
    // For OAuth, sign in and sign up are the same flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: encodeURI(`${window.location.origin}/onboarding`), // Redirect to onboarding after signup
      },
    });
    if (error) console.log("Ошибка регистрации Google:", error.message);
  };

  const signUpWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: encodeURI(`${window.location.origin}/onboarding`),
      },
    });
    if (error) console.log("Ошибка регистрации Facebook:", error.message);
  };

  const signUpWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: encodeURI(`${window.location.origin}/onboarding`),
      },
    });
    if (error) console.log("Ошибка регистрации Apple:", error.message);
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: encodeURI(`${window.location.origin}/onboarding`),
      },
    });
    setLoading(false);
    if (error) {
      alert("Помилка реєстрації: " + error.message);
    } else if (data.session) {
      router.push("/onboarding");
    } else {
      alert("Перевірте вашу пошту для підтвердження реєстрації!");
    }
  };

  return (
    <AuthLayout
      title="Створити акаунт"
      subtitle="Почніть керувати своїми фінансами ефективно вже сьогодні."
      currentStep={1}
      totalSteps={2}
      stepContent={{
        icon: <CheckCircle2 className="w-24 h-24 text-white" />,
        title: "Швидкий старт",
        description: "Реєстрація займає менше хвилини. Ніяких паперів та черг."
      }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={signUpWithGoogle}
            variant="secondary"
            className="w-full flex items-center justify-center !px-0"
            title="Google"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-6 h-6" 
            />
          </Button>
          <Button
            onClick={signUpWithFacebook}
            variant="secondary"
            className="w-full flex items-center justify-center !px-0"
            title="Facebook"
          >
             <img 
              src="https://www.svgrepo.com/show/475647/facebook-color.svg" 
              alt="Facebook" 
              className="w-6 h-6" 
            />
          </Button>
          <Button
            onClick={signUpWithApple}
            variant="secondary"
            className="w-full flex items-center justify-center !px-0"
            title="Apple"
          >
             <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.93 2.52.12 3.69 1.48 4.22 2.2-3.79 2.33-2.85 7.6 1.45 9.07-.63 1.54-1.5 3.01-2.94 4.39-1.5 1.48-1.54 1.47-1.54 1.47zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-1.93 4.27-3.74 4.25z" />
             </svg>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">або через email</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
            <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
            />
            <Input
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
            />
            
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        agreedToTerms 
                            ? 'bg-[var(--fin-primary)] border-[var(--fin-primary)]' 
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    {agreedToTerms && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <label className="text-sm text-gray-600 leading-relaxed">
                    Я погоджуюсь з{" "}
                    <Link href="/terms" className="text-[var(--fin-primary)] font-semibold hover:underline">
                        умовами використання
                    </Link>
                    {" "}та{" "}
                    <Link href="/privacy" className="text-[var(--fin-primary)] font-semibold hover:underline">
                        політикою конфіденційності
                    </Link>
                </label>
            </div>
            
            <Button
                type="submit"
                disabled={loading || !agreedToTerms}
                isLoading={loading}
                size="lg"
                className="w-full"
            >
                Створити акаунт
            </Button>
        </form>

        <div className="text-center">
            <p className="text-gray-500">
                Вже маєте акаунт?{" "}
                <Link href="/login" className="text-[var(--fin-primary)] font-bold hover:underline">
                    Увійти
                </Link>
            </p>
        </div>
      </div>
      <AIHelper isOpen={isAIHelperOpen} onClose={() => setIsAIHelperOpen(false)} />

      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            onClick={() => router.push("/onboarding")}
            variant="danger"
            size="sm"
            className="rounded-full shadow-lg"
          >
            DEV: Skip to Onboarding
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
