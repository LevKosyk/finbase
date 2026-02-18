"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Plus, MessageSquare, Search, Pin, Archive, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";

type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

type ChatSession = {
  id: string;
  title: string;
  isPinned: boolean;
  archivedAt: string | null;
  lastUsedAt: string;
  messageCount: number;
};

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Привіт! Я ваш фінансовий асистент Finbase AI. Я знаю ваші доходи та податкову групу. Чим можу допомогти?",
};

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  }

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (showArchived) params.set("includeArchived", "1");
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/ai/sessions?${params.toString()}`, {
        method: "GET",
        headers: await authHeaders(),
      });

      if (!response.ok) {
        setSessions([]);
        setSessionsLoading(false);
        return;
      }

      const data = await response.json();
      const list = (data.sessions || []) as ChatSession[];
      setSessions(list);

      if (list.length > 0) {
        const nextActiveId = activeSessionId && list.some((item) => item.id === activeSessionId) ? activeSessionId : list[0].id;
        setActiveSessionId(nextActiveId);
        await loadSession(nextActiveId);
      } else {
        setMessages([GREETING]);
        setActiveSessionId(null);
      }
    } finally {
      setSessionsLoading(false);
    }
  }

  async function loadSession(sessionId: string) {
    const response = await fetch(`/api/ai/sessions/${sessionId}`, {
      method: "GET",
      headers: await authHeaders(),
    });

    if (!response.ok) {
      setMessages([GREETING]);
      return;
    }

    const data = await response.json();
    const history = (data.session?.messages || []) as ChatMessage[];
    setMessages(history.length > 0 ? history : [GREETING]);
    setActiveSessionId(sessionId);
  }

  async function createSession() {
    const response = await fetch("/api/ai/sessions", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ title: "Новий чат" }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const created = data.session as { id: string; title: string; isPinned: boolean; archivedAt: string | null; lastUsedAt: string };
    const next: ChatSession = { ...created, messageCount: 0 };
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
    setMessages([GREETING]);
    return next.id;
  }

  async function patchSession(sessionId: string, payload: { isPinned?: boolean; archived?: boolean }) {
    const response = await fetch(`/api/ai/sessions/${sessionId}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    await loadSessions();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    trackEvent("ai_question_sent", { message_length: input.length });
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const workingSessionId = activeSessionId || (await createSession());
    const nextHistory = [...messages, userMsg].filter((m) => m.role !== "system");

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        sessionId: workingSessionId || undefined,
        messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        currentPath: pathname,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      trackEvent("ai_response_failed", { reason: data?.error || "unknown" });
      setMessages((prev) => [...prev, { role: "assistant", content: data?.error || "Вибачте, виникла помилка." }]);
      return;
    }

    if (data?.session?.id) {
      setActiveSessionId(data.session.id);
      await loadSessions();
    }

    const assistantContent = data.assistant?.content || data.choices?.[0]?.message?.content || "Немає відповіді.";
    trackEvent("ai_response_success", { response_length: assistantContent.length });
    setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6 h-[calc(100vh-100px)]">
      <aside className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Історія чатів</h2>
          <Button size="sm" variant="secondary" onClick={() => void createSession()} leftIcon={<Plus className="w-4 h-4" />}>
            Новий
          </Button>
        </div>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void loadSessions();
              }
            }}
            placeholder="Пошук чатів..."
            className="pl-9 py-2 text-sm"
          />
        </div>
        <div className="mb-3 flex gap-2">
          <Button
            size="sm"
            variant={showArchived ? "secondary" : "ghost"}
            onClick={() => setShowArchived((prev) => !prev)}
            leftIcon={showArchived ? <Inbox className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          >
            {showArchived ? "Активні" : "Архів"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void loadSessions()}>
            Оновити
          </Button>
        </div>
        <div className="space-y-2">
          {sessionsLoading && <p className="text-xs text-gray-500">Завантаження...</p>}
          {!sessionsLoading && sessions.length === 0 && (
            <p className="text-xs text-gray-500">Ще немає чатів. Створіть перший.</p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${
                activeSessionId === session.id
                  ? "border-[var(--fin-primary)] bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <button onClick={() => void loadSession(session.id)} className="w-full text-left">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <MessageSquare className="w-4 h-4" />
                  {session.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="truncate">{session.title}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{new Date(session.lastUsedAt).toLocaleString("uk-UA")}</p>
              </button>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void patchSession(session.id, { isPinned: !session.isPinned })}
                  leftIcon={<Pin className="w-3.5 h-3.5" />}
                >
                  {session.isPinned ? "Відкріпити" : "Закріпити"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void patchSession(session.id, { archived: !Boolean(session.archivedAt) })}
                  leftIcon={session.archivedAt ? <Inbox className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                >
                  {session.archivedAt ? "Розархів." : "Архів"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col h-full max-w-4xl mx-auto pb-2 w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Фінансовий Асистент</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Контекст користувача + історія сесій</p>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {messages.map((m, i) => (
              <div key={m.id || i} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-gray-100 dark:bg-gray-800" : "bg-indigo-100 dark:bg-indigo-900/40"}`}>
                  {m.role === "user" ? <User className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-100 text-gray-900 dark:bg-blue-900/30 dark:text-blue-50 rounded-tr-none"
                    : "bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 rounded-tl-none border border-gray-100 dark:border-gray-700 flex items-center gap-2 text-gray-400 dark:text-gray-300 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Думаю...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 relative z-10">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Напишіть ваше питання..."
                rows={1}
                className="w-full min-h-[52px] max-h-44 resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 pl-5 pr-14 py-3.5 text-sm leading-6 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-[var(--fin-primary)] focus:ring-4 focus:ring-blue-500/10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 h-auto rounded-xl shadow-lg shadow-indigo-500/20"
                variant="primary"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
