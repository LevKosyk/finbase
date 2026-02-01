"use client";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUpWithGoogle = async () => {
    // For OAuth, sign in and sign up are the same flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`, // Redirect to onboarding after signup
      },
    });
    if (error) console.log("Ошибка регистрации:", error.message);
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setLoading(false);
    if (error) {
      alert("Помилка реєстрації: " + error.message);
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
        <button
          onClick={signUpWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="w-5 h-5" 
          />
          Зареєструватися через Google
        </button>

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
    </AuthLayout>
  );
}
