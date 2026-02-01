"use client";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      router.push("/dashboard");
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) console.log("Ошибка входа Google:", error.message);
  };

  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) console.log("Ошибка входа Facebook:", error.message);
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) console.log("Ошибка входа Apple:", error.message);
  };

  return (
    <AuthLayout
      title="З поверненням!"
      subtitle="Увійдіть у свій акаунт, щоб продовжити роботу."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={signInWithGoogle}
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
            onClick={signInWithFacebook}
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
            onClick={signInWithApple}
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

        <form onSubmit={handleLogin} className="space-y-4">
            <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
            />
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Пароль</label>
                    <Link href="/forgot-password" className="text-xs text-[var(--fin-primary)] hover:underline font-medium">
                        Забули пароль?
                    </Link>
                </div>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
            </div>
            
            <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                size="lg"
                className="w-full"
            >
                Увійти
            </Button>
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
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="danger"
            size="sm"
            className="rounded-full shadow-lg"
          >
            DEV: Skip to Dashboard
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
