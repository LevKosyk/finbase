"use client";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AIHelper from "@/components/AIHelper";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);
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
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={signUpWithGoogle}
            className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            title="Google"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-6 h-6" 
            />
          </button>
          <button
            onClick={signUpWithFacebook}
            className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            title="Facebook"
          >
             <img 
              src="https://www.svgrepo.com/show/475647/facebook-color.svg" 
              alt="Facebook" 
              className="w-6 h-6" 
            />
          </button>
          <button
            onClick={signUpWithApple}
            className="flex items-center justify-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            title="Apple"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.93 2.52.12 3.69 1.48 4.22 2.2-3.79 2.33-2.85 7.6 1.45 9.07-.63 1.54-1.5 3.01-2.94 4.39-1.5 1.48-1.54 1.47-1.54 1.47zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-1.93 4.27-3.74 4.25z" />
             </svg>
          </button>
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--fin-primary)] focus:border-transparent transition-all"
                    placeholder="name@company.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--fin-primary)] focus:border-transparent transition-all"
                    placeholder="••••••••"
                />
            </div>
            
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--fin-primary)] text-white font-bold py-4 rounded-xl hover:bg-[var(--fin-secondary)] shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? "Реєстрація..." : "Створити акаунт"}
            </button>
        </form>

        <div className="text-center">
            <p className="text-gray-500">
                Вже маєте акаунт?{" "}
                <Link href="/login" className="text-[var(--fin-primary)] font-bold hover:underline">
                    Увійти
                </Link>
            </p>
        </div>
        
        <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
            Реєструючись, ви погоджуєтесь з нашими <Link href="/terms" className="underline hover:text-gray-600">умовами використання</Link> та <Link href="/privacy" className="underline hover:text-gray-600">політикою конфіденційності</Link>.
        </p>
      </div>
      <AIHelper isOpen={isAIHelperOpen} onClose={() => setIsAIHelperOpen(false)} />

      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => router.push("/onboarding")}
            className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-red-600 transition-colors"
          >
            DEV: Skip to Onboarding
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
