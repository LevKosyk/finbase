"use client";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      alert("Помилка входу: " + error.message);
    } else {
      // Login successful, redirect handled by middleware or client side check usually, 
      // but for now we can just alert or redirect.
      window.location.href = "/";
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) console.log("Ошибка входа:", error.message);
  };

  return (
    <AuthLayout
      title="З поверненням!"
      subtitle="Увійдіть у свій акаунт, щоб продовжити роботу."
    >
      <div className="space-y-6">
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="w-5 h-5" 
          />
          Продовжити з Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">або через email</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
                {loading ? "Вхід..." : "Увійти"}
            </button>
        </form>
        <div className="text-center">
            <p className="text-gray-500">
                Немає акаунту?{" "}
                <Link href="/register" className="text-[var(--fin-primary)] font-bold hover:underline">
                    Зареєструватися
                </Link>
            </p>
        </div>
      </div>
    </AuthLayout>
  );
}
