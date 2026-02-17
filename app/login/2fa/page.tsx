"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { completeLoginTwoFactor } from "@/app/actions/two-factor";
import { useToast } from "@/components/providers/ToastProvider";

export default function LoginTwoFactorPage() {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [pending, startTransition] = useTransition();

  return (
    <AuthLayout title="Підтвердження 2FA" subtitle="Введіть код з додатка-аутентифікатора.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await completeLoginTwoFactor(code, trustDevice);
            if (!res.success) {
              toast.error({ title: "Помилка 2FA", description: res.error || "Невірний код" });
              return;
            }
            toast.success({ title: "2FA успішно підтверджено" });
            router.push("/dashboard");
          });
        }}
        className="space-y-4"
      >
        <Input
          label="Код 2FA"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          required
          autoComplete="one-time-code"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} />
          Довіряти цьому пристрою на 90 днів
        </label>
        <Button type="submit" isLoading={pending} disabled={pending || code.length < 6} className="w-full">
          Підтвердити
        </Button>
      </form>
    </AuthLayout>
  );
}
