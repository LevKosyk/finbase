"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AuthLayout
      title="Відновлення паролю"
      subtitle="Введіть вашу електронну адресу, і ми надішлемо вам посилання для скидання паролю."
    >
      <div className="space-y-6">
        {sent ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Перевірте вашу пошту!
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Ми надіслали інструкції для відновлення паролю на адресу{" "}
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
            </div>
            <div className="pt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Повернутися до входу
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Не отримали листа?{" "}
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-[var(--fin-primary)] font-semibold hover:underline"
              >
                Спробувати ще раз
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={error}
            />

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full"
            >
              {loading ? "Надсилання..." : "Надіслати посилання"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--fin-primary)] transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Повернутися до входу
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
