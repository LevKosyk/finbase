"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Shield, Smartphone, Globe, AlertTriangle, CheckCircle2, Chrome, Facebook, Apple } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getActiveSessions, terminateOtherSessions, terminateSession } from "@/app/actions/security";
import type { ActiveSessionItem } from "@/lib/types/security";

type OAuthProvider = "google" | "facebook" | "apple";

type ProviderIdentity = {
  id: string;
  user_id: string;
  identity_id: string;
  provider: string;
  identity_data?: {
    email?: string;
  };
};

type LinkedAccount = {
  provider: OAuthProvider;
  connected: boolean;
  email?: string;
  identity?: ProviderIdentity;
};

function getProviderIcon(provider: OAuthProvider) {
  switch (provider) {
    case "google":
      return <Chrome className="w-6 h-6 text-gray-700 dark:text-gray-200" />;
    case "apple":
      return <Apple className="w-6 h-6 text-gray-900 dark:text-gray-100" />;
    case "facebook":
      return <Facebook className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
  }
}

export default function SecurityPage() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([
    { provider: "google", connected: false },
    { provider: "apple", connected: false },
    { provider: "facebook", connected: false },
  ]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState("");
  const [providerPending, setProviderPending] = useState<OAuthProvider | null>(null);

  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [pending, startTransition] = useTransition();

  const relativeTime = useMemo(
    () =>
      new Intl.RelativeTimeFormat("uk-UA", {
        numeric: "auto",
      }),
    []
  );

  const formatLastActive = (iso: string) => {
    const date = new Date(iso);
    const diffMs = date.getTime() - Date.now();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (Math.abs(diffMinutes) < 1) return "Зараз";
    if (Math.abs(diffMinutes) < 60) return relativeTime.format(diffMinutes, "minute");
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) return relativeTime.format(diffHours, "hour");
    const diffDays = Math.round(diffHours / 24);
    return relativeTime.format(diffDays, "day");
  };

  const loadLinkedAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const identities = ((data.user?.identities || []) as ProviderIdentity[]).filter((item) =>
        ["google", "apple", "facebook"].includes(item.provider)
      );
      const byProvider = new Map(identities.map((item) => [item.provider, item]));

      const next: LinkedAccount[] = (["google", "apple", "facebook"] as OAuthProvider[]).map((provider) => {
        const identity = byProvider.get(provider);
        return {
          provider,
          connected: Boolean(identity),
          email: identity?.identity_data?.email || data.user?.email || undefined,
          identity,
        };
      });

      setLinkedAccounts(next);
    } catch {
      setAccountsError("Не вдалося завантажити прив'язані акаунти.");
    } finally {
      setAccountsLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    setSessionsError("");
    try {
      const rows = await getActiveSessions();
      setSessions(rows);
    } catch {
      setSessionsError("Не вдалося завантажити сесії.");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadLinkedAccounts();
    loadSessions();
  }, []);

  const handleConnect = async (provider: OAuthProvider) => {
    setProviderPending(provider);
    setAccountsError("");
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard/settings/security`,
      },
    });

    if (error) {
      setAccountsError(error.message || "Не вдалося підключити провайдера.");
      setProviderPending(null);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    setProviderPending(null);
    await loadLinkedAccounts();
  };

  const handleDisconnect = async (provider: OAuthProvider) => {
    const account = linkedAccounts.find((item) => item.provider === provider);
    if (!account?.identity) return;

    setProviderPending(provider);
    setAccountsError("");
    const { error } = await supabase.auth.unlinkIdentity(account.identity);

    if (error) {
      setAccountsError(error.message || "Не вдалося відв'язати провайдера.");
      setProviderPending(null);
      return;
    }

    setProviderPending(null);
    await loadLinkedAccounts();
  };

  const handleTerminate = (sessionId: string) => {
    startTransition(async () => {
      const res = await terminateSession(sessionId);
      if (!res.success) {
        setSessionsError(res.error || "Не вдалося завершити сесію.");
        return;
      }
      await loadSessions();
    });
  };

  const handleTerminateOthers = () => {
    startTransition(async () => {
      const res = await terminateOtherSessions();
      if (!res.success) {
        setSessionsError(res.error || "Не вдалося завершити інші сесії.");
        return;
      }
      await loadSessions();
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[var(--fin-primary)] dark:text-blue-300">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Прив&apos;язані акаунти</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Використовуйте ці сервіси для швидкого входу.</p>
          </div>
        </div>

        <div className="space-y-4">
          {accountsError && (
            <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">{accountsError}</div>
          )}
          {accountsLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Завантаження...</div>
          ) : (
            linkedAccounts.map((acc) => (
              <div key={acc.provider} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  {getProviderIcon(acc.provider)}
                  <span className="capitalize font-bold text-gray-700 dark:text-gray-200">{acc.provider}</span>
                  {acc.connected && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Підключено
                    </span>
                  )}
                </div>

                {acc.connected ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">{acc.email || "Connected"}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(acc.provider)}
                      isLoading={providerPending === acc.provider}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      Відв&apos;язати
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleConnect(acc.provider)}
                    isLoading={providerPending === acc.provider}
                    className="text-[var(--fin-primary)] bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600"
                  >
                    Підключити
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Активні сесії</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Пристрої, з яких виконано вхід у ваш акаунт.</p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button variant="secondary" size="sm" onClick={handleTerminateOthers} isLoading={pending}>
            Завершити всі інші сесії
          </Button>
        </div>

        {sessionsError && (
          <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium mb-4">{sessionsError}</div>
        )}

        {sessionsLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Завантаження...</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Активних сесій не знайдено.</div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-start justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-300 shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {session.device}
                      {session.isCurrent && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          Цей пристрій
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{session.os} • {session.browser} • {session.location || "Unknown"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">IP: {session.ip || "—"} • <span className="text-[var(--fin-primary)]">{formatLastActive(session.lastActive)}</span></p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTerminate(session.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Завершити
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-700/50 flex items-start gap-3 text-yellow-800 dark:text-yellow-200 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>Якщо ви помітили підозрілу активність, негайно змініть пароль та завершіть усі інші сесії.</p>
      </div>
    </div>
  );
}
