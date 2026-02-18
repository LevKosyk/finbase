"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Shield, Smartphone, Globe, AlertTriangle, CheckCircle2, Chrome, Facebook, Apple } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getActiveSessions, getSuspiciousActivityAlerts, terminateAllSessions, terminateOtherSessions, terminateSession } from "@/app/actions/security";
import type { ActiveSessionItem } from "@/lib/types/security";
import {
  authorizeSensitiveActionWithTwoFactor,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getTrustedDevices,
  getTwoFactorStatus,
  revokeTrustedDevice,
} from "@/app/actions/two-factor";
import { changePassword } from "@/app/actions/password";
import { createApiKey, getApiKeys, revokeApiKey } from "@/app/actions/api-keys";
import { useToast } from "@/components/providers/ToastProvider";

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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [setupQr, setSetupQr] = useState<string | null>(null);
  const [trustedDevices, setTrustedDevices] = useState<Array<{ id: string; label: string | null; lastUsedAt: Date | string }>>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; prefix: string; createdAt: string; revokedAt: string | null }>>([]);
  const [newKeyName, setNewKeyName] = useState("Primary");
  const [lastCreatedApiKey, setLastCreatedApiKey] = useState("");
  const toast = useToast();

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
    (async () => {
      const status = await getTwoFactorStatus();
      setTwoFactorEnabled(status.enabled);
      setTrustedDevices(await getTrustedDevices());
      setAlerts(await getSuspiciousActivityAlerts());
      setApiKeys(await getApiKeys());
    })();
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Двофакторна автентифікація (2FA)</h2>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${twoFactorEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {twoFactorEnabled ? "Увімкнено" : "Вимкнено"}
          </span>
        </div>
        {!twoFactorEnabled ? (
          <div className="space-y-3">
            <Button
              variant="secondary"
              onClick={async () => {
                const res = await beginTwoFactorSetup();
                if (!res.success) {
                  toast.error({ title: "Не вдалося почати налаштування 2FA", description: res.error });
                  return;
                }
                setSetupQr(res.qrDataUrl || null);
              }}
            >
              Налаштувати 2FA
            </Button>
            {setupQr && (
              <div className="space-y-2">
                <Image src={setupQr} alt="2FA QR" width={176} height={176} className="w-44 h-44 border rounded-xl p-2 bg-white" unoptimized />
                <div className="flex items-center gap-2">
                  <input
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Код з Authenticator"
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <Button
                    onClick={async () => {
                      const res = await confirmTwoFactorSetup(twoFactorCode);
                      if (!res.success) {
                        toast.error({ title: "Невірний код 2FA", description: res.error });
                        return;
                      }
                      setTwoFactorEnabled(true);
                      setSetupQr(null);
                      setTwoFactorCode("");
                      toast.success({ title: "2FA увімкнено" });
                    }}
                  >
                    Підтвердити
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Код для вимкнення"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <Button
                variant="danger"
                onClick={async () => {
                  const res = await disableTwoFactor(twoFactorCode);
                  if (!res.success) {
                    toast.error({ title: "Не вдалося вимкнути 2FA", description: res.error });
                    return;
                  }
                  setTwoFactorEnabled(false);
                  setTwoFactorCode("");
                  toast.info({ title: "2FA вимкнено" });
                }}
              >
                Вимкнути 2FA
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Довірені пристрої</p>
              {trustedDevices.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Немає збережених пристроїв.</p>
              ) : (
                trustedDevices.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{item.label || "Unknown device"}</span>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      await revokeTrustedDevice(item.id);
                      setTrustedDevices(await getTrustedDevices());
                      toast.info({ title: "Довірений пристрій видалено" });
                    }}>
                      Видалити
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Підтвердження чутливих дій</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Перед експортом, видаленням та критичними змінами підтвердіть 2FA-код. Діє 10 хвилин.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="Код з Authenticator"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <Button
            onClick={async () => {
              const res = await authorizeSensitiveActionWithTwoFactor(twoFactorCode);
              if (!res.success) {
                toast.error({ title: "Не вдалося підтвердити дію", description: res.error });
                return;
              }
              setTwoFactorCode("");
              toast.success({ title: "Підтверджено", description: "Чутливі дії дозволені на 10 хвилин." });
            }}
          >
            Підтвердити
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Зміна паролю</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Потребує 2FA + re-auth.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Поточний пароль"
            type="password"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <input
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
            placeholder="Новий пароль"
            type="password"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <Button
            onClick={async () => {
              const res = await changePassword(currentPassword, nextPassword);
              if (!res.success) {
                toast.error({ title: "Не вдалося змінити пароль", description: res.error });
                return;
              }
              setCurrentPassword("");
              setNextPassword("");
              toast.success({ title: "Пароль змінено" });
            }}
          >
            Змінити пароль
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">API-ключі</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Створення/відкликання потребує 2FA + re-auth.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Назва ключа"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <Button
            onClick={async () => {
              const res = await createApiKey(newKeyName);
              if (!res.success) {
                toast.error({ title: "Не вдалося створити ключ", description: res.error });
                return;
              }
              setLastCreatedApiKey(res.apiKey || "");
              setApiKeys(await getApiKeys());
              toast.success({ title: "API-ключ створено" });
            }}
          >
            Створити API-ключ
          </Button>
        </div>
        {lastCreatedApiKey ? (
          <div className="rounded-xl bg-amber-50 text-amber-900 px-3 py-2 text-sm break-all">
            Збережіть ключ зараз (потім не показуємо): <span className="font-mono">{lastCreatedApiKey}</span>
          </div>
        ) : null}
        <div className="space-y-2">
          {apiKeys.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ключів ще немає.</p>
          ) : (
            apiKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{k.name}</p>
                  <p className="text-xs text-gray-500">{k.prefix}… · {new Date(k.createdAt).toLocaleString("uk-UA")}</p>
                </div>
                {k.revokedAt ? (
                  <span className="text-xs font-bold text-red-600">Відкликано</span>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      const res = await revokeApiKey(k.id);
                      if (!res.success) {
                        toast.error({ title: "Не вдалося відкликати ключ", description: res.error });
                        return;
                      }
                      setApiKeys(await getApiKeys());
                      toast.info({ title: "Ключ відкликано" });
                    }}
                  >
                    Відкликати
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

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
          <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleTerminateOthers} isLoading={pending}>
            Завершити всі інші сесії
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              startTransition(async () => {
                const res = await terminateAllSessions();
                if (!res.success) {
                  setSessionsError(res.error || "Не вдалося завершити всі сесії.");
                  return;
                }
                await supabase.auth.signOut();
                window.location.href = "/login";
              })
            }
          >
            Force sign-out all
          </Button>
          </div>
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
        <div className="space-y-1">
          <p>Якщо ви помітили підозрілу активність, негайно змініть пароль та завершіть усі інші сесії.</p>
          {alerts.map((alert) => (
            <p key={alert} className="font-semibold">• {alert}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
