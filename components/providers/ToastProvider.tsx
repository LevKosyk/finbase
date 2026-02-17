"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastInput = {
  title: string;
  description?: string;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  pushToast: (type: ToastType, payload: ToastInput) => void;
  success: (payload: ToastInput) => void;
  error: (payload: ToastInput) => void;
  info: (payload: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function toastTheme(type: ToastType) {
  if (type === "success") {
    return {
      icon: CheckCircle2,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      cardClass: "border-emerald-200/70 dark:border-emerald-800/70",
    };
  }
  if (type === "error") {
    return {
      icon: XCircle,
      iconClass: "text-red-600 dark:text-red-400",
      cardClass: "border-red-200/70 dark:border-red-800/70",
    };
  }
  return {
    icon: Info,
    iconClass: "text-blue-600 dark:text-blue-400",
    cardClass: "border-blue-200/70 dark:border-blue-800/70",
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: ToastType, payload: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextItem: ToastItem = {
        id,
        type,
        title: payload.title,
        description: payload.description,
        actionLabel: payload.actionLabel,
        onAction: payload.onAction,
      };
      setItems((prev) => [...prev.slice(-3), nextItem]);

      const timeout = payload.durationMs ?? 4200;
      window.setTimeout(() => remove(id), timeout);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      success: (payload) => pushToast("success", payload),
      error: (payload) => pushToast("error", payload),
      info: (payload) => pushToast("info", payload),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[200] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => {
          const theme = toastTheme(item.type);
          const Icon = theme.icon;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur dark:bg-gray-900/95 ${theme.cardClass}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${theme.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
                  ) : null}
                  {item.actionLabel && item.onAction ? (
                    <button
                      onClick={() => {
                        item.onAction?.();
                        remove(item.id);
                      }}
                      className="mt-1 text-xs font-semibold text-[var(--fin-primary)] hover:underline"
                    >
                      {item.actionLabel}
                    </button>
                  ) : null}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
