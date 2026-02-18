"use client";
import { login, signInWithOAuth } from "@/app/actions/auth";
import { SocialAuth } from "@/components/auth/SocialAuth";
import { useTransition } from "react";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (formData: FormData) => {
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        toast.error({ title: "Помилка входу", description: result.error });
        return;
      }
      if (result?.requires2fa) {
        router.push("/login/2fa");
        return;
      }
      router.push("/dashboard");
    });
  };

  return (
    <AuthLayout
      title="З поверненням!"
      subtitle="Увійдіть у свій акаунт, щоб продовжити роботу."
    >
      <div className="space-y-6">
        <SocialAuth />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">або через email</span>
          </div>
        </div>

        <form action={handleLogin} className="space-y-4">
            <Input
                label="Email"
                name="email"
                type="email"
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                />
            </div>
            
            <Button
                type="submit"
                disabled={isPending}
                isLoading={isPending}
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
