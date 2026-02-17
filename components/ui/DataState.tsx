"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

type DataStateProps = {
  variant: "empty" | "error";
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function DataState({ variant, title, description, retryLabel = "Спробувати ще раз", onRetry }: DataStateProps) {
  const router = useRouter();
  const Icon = variant === "error" ? AlertTriangle : Inbox;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mx-auto max-w-xl text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {variant === "error" ? (
        <div className="mt-6">
          <Button variant="secondary" onClick={handleRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
