"use client";

import { signup, verifyEmail } from "@/app/actions/auth";
import { SocialAuth } from "@/components/auth/SocialAuth";
import { useState, useTransition } from "react";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import AIHelper from "@/components/AIHelper";
import { CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/providers/ToastProvider";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [emailForVerify, setEmailForVerify] = useState("");

  const handleRegister = (formData: FormData) => {
    const email = formData.get("email") as string;
    trackEvent("signup_submitted", { has_terms: agreedToTerms });
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        trackEvent("signup_failed", { reason: result.error });
        toast.error({ title: "Помилка реєстрації", description: result.error });
      } else if (result?.success) {
         trackEvent("signup_success", { email_domain: email.split("@")[1] || "unknown" });
         setEmailForVerify(email);
         setStep('verify');
      }
    });
  };

  const handleVerify = (formData: FormData) => {
    const code = formData.get("code") as string;
    startTransition(async () => {
        const result = await verifyEmail(emailForVerify, code);
        if (result?.error) {
            trackEvent("signup_verify_failed", { reason: result.error });
            toast.error({ title: "Помилка підтвердження", description: result.error });
        } else if (result?.success) {
            trackEvent("signup_verify_success");
            router.push("/onboarding");
        }
    });
  }

  return (
    <AuthLayout
      title={step === 'register' ? "Створити акаунт" : "Підтвердження Email"}
      subtitle={step === 'register' ? "Почніть керувати своїми фінансами ефективно вже сьогодні." : `Ми відправили код підтвердження на ${emailForVerify}`}
      currentStep={step === 'register' ? 1 : 2}
      totalSteps={2}
      stepContent={{
        icon: <CheckCircle2 className="w-24 h-24 text-white" />,
        title: "Швидкий старт",
        description: "Реєстрація займає менше хвилини. Ніяких паперів та черг."
      }}
    >
      <div className="space-y-6">
        {step === 'register' && (
            <>
            <SocialAuth />

            <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">або через email</span>
            </div>
            </div>

            <form action={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Ім'я"
                        type="text"
                        name="firstName"
                        required
                        placeholder="Іван"
                    />
                    <Input
                        label="Прізвище"
                        type="text"
                        name="lastName"
                        required
                        placeholder="Петренко"
                    />
                </div>
                <Input
                    label="Email"
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                />
                <Input
                    label="Пароль"
                    type="password"
                    name="password"
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
                    disabled={isPending || !agreedToTerms}
                    isLoading={isPending}
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
            </>
        )}

        {step === 'verify' && (
            <form action={handleVerify} className="space-y-6">
                 <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-700">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>Перевірте вашу пошту <strong>{emailForVerify}</strong> та введіть код підтвердження нижче.</p>
                </div>

                <Input
                    label="Код підтвердження"
                    type="text"
                    name="code"
                    required
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest"
                    autoComplete="one-time-code"
                />
                
                <Button
                    type="submit"
                    disabled={isPending}
                    isLoading={isPending}
                    size="lg"
                    className="w-full"
                >
                    Підтвердити <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center">
                    <button 
                        type="button"
                        onClick={() => setStep('register')}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
                    >
                        <RefreshCw className="w-3 h-3" /> Змінити email
                    </button>
                </div>
            </form>
        )}
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
