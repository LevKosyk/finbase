import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { cacheKey, getCacheJson, setCacheJson } from "@/lib/redis-cache";
import { enforceRateLimit, hashString, sanitizeText } from "@/lib/security";
import { getSupabaseEnv } from "@/lib/supabaseEnv";
import { aiRouteRequestSchema } from "@/lib/validation";
import { measureAction } from "@/lib/performance";
import { captureError } from "@/lib/monitoring";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function toChatRole(role: string): ChatMessage["role"] {
  if (role === "user" || role === "assistant" || role === "system") return role;
  return "assistant";
}

const GUEST_DEVICE_COOKIE = "fin_guest_ai_device";
const GUEST_TOTAL_LIMIT = 2;
const USER_FREE_DAILY_LIMIT = 10;
const USER_PRO_DAILY_LIMIT = 50;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct";
const OPENROUTER_MAX_TOKENS = Math.max(64, Math.min(2048, Number(process.env.OPENROUTER_MAX_TOKENS || 400)));
const OPENROUTER_TEMPERATURE = Math.max(0, Math.min(1, Number(process.env.OPENROUTER_TEMPERATURE || 0.15)));
const OFFTOPIC_RESPONSE =
  "Я допомагаю тільки з Finbase: доходи, витрати, виписки, документи, податки ФОП 3 групи, статистика та налаштування. Поставте, будь ласка, питання в межах цих тем.";

const INTERFACE_HELP: Record<string, string> = {
  "/dashboard": "Головний дашборд: KPI, ризики, ліміти, задачі на сьогодні.",
  "/dashboard/income": "Розділ доходів: додавання, імпорт, контроль джерел і дублів.",
  "/dashboard/expenses": "Розділ витрат: категорії, оптимізація, імпорт виписок.",
  "/dashboard/bank": "Банківська виписка: імпорт CSV/XLSX, авто-розбір, звірка дублів.",
  "/dashboard/rules": "Правила категоризації: умови, пріоритет, перевірка конфліктів.",
  "/dashboard/statistics": "Статистика: тренди, податкове навантаження, практичні дії.",
  "/dashboard/documents": "Документи: заповнення реквізитів, перевірка обов'язкових полів, експорт.",
  "/dashboard/settings": "Налаштування: ФОП 3 групи, ставка, ліміти, платіжні реквізити.",
};

function resolveUiHint(pathname: string) {
  const exact = INTERFACE_HELP[pathname];
  if (exact) return exact;
  const matched = Object.entries(INTERFACE_HELP).find(([key]) => pathname.startsWith(key));
  return matched?.[1] || "Допомагай користувачу кроками через поточний інтерфейс.";
}

const SYSTEM_PROMPT = `
Ти — AI-помічник Finbase для ФОП в Україні.
- Відповідай стисло, по суті, українською.
- Не вигадуй законодавство, якщо не впевнений — зазнач це.
- Не надавай персоналізованих юридичних гарантій.
`;

const LAW_CONTEXT = `
Базовий контекст:
- Finbase працює для ФОП 3 групи.
- Для ФОП 3 групи часто застосовують ставку 5% (без ПДВ) або 3% (з ПДВ).
- ЄСВ сплачується окремо.
- Звітність залежить від налаштувань та поточних правил.
`;

const DOMAIN_KEYWORDS = [
  "finbase",
  "фоп",
  "подат",
  "єсв",
  "дпс",
  "документ",
  "декларац",
  "інвойс",
  "рахунок",
  "акт",
  "дохід",
  "витрат",
  "виписк",
  "банк",
  "категор",
  "правил",
  "ліміт",
  "статист",
  "dashboard",
  "income",
  "expenses",
  "documents",
  "calendar",
  "settings",
];

function isInDomainQuestion(text: string, currentPath?: string) {
  const value = (text || "").toLowerCase().trim();
  if (!value) return false;
  if (currentPath?.startsWith("/dashboard")) return true;
  return DOMAIN_KEYWORDS.some((keyword) => value.includes(keyword));
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as { role?: string }).role;
      const content = (item as { content?: string }).content;
      if (!role || !content) return null;
      if (!["system", "user", "assistant"].includes(role)) return null;
      return {
        role: role as ChatMessage["role"],
        content: sanitizeText(String(content), 1800),
      };
    })
    .filter((item): item is ChatMessage => Boolean(item))
    .slice(-20);
}

async function resolveUser(req: Request) {
  const { url, anonKey, isConfigured, isValidUrl } = getSupabaseEnv();
  if (!isConfigured || !isValidUrl) return { userId: null as string | null, userPlan: "guest" };

  const cookieStore = await cookies();
  const serverSupabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const { data: serverData } = await serverSupabase.auth.getUser();
  let userId = serverData.user?.id || null;

  if (!userId) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length).trim();
      if (token) {
        const supabase = createSupabaseClient(url, anonKey);
        const { data } = await supabase.auth.getUser(token);
        userId = data.user?.id || null;
      }
    }
  }

  if (!userId) return { userId: null as string | null, userPlan: "guest" };

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription: { select: { plan: true } } },
  });

  return {
    userId,
    userPlan: dbUser?.subscription?.plan?.toLowerCase() || "free",
  };
}

function readCookieFromRequest(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  const chunks = cookieHeader.split(";").map((part) => part.trim());
  for (const chunk of chunks) {
    if (!chunk.startsWith(`${name}=`)) continue;
    return decodeURIComponent(chunk.slice(name.length + 1));
  }
  return "";
}

async function getOrCreateGuestFingerprint(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const userAgent = req.headers.get("user-agent") || "unknown";
  let deviceId = readCookieFromRequest(req, GUEST_DEVICE_COOKIE);
  let shouldSetCookie = false;

  if (!deviceId) {
    deviceId = randomUUID();
    shouldSetCookie = true;
  }

  return {
    ip,
    userAgent,
    shouldSetCookie,
    deviceId,
    fingerprint: hashString(`${deviceId}|${ip}|${userAgent}`),
  };
}

function truncateTitle(value: string) {
  const clean = sanitizeText(value, 80);
  return clean.length > 0 ? clean : "Новий чат";
}

export async function POST(req: Request) {
  return measureAction(
    "api.ai.POST",
    async () => {
      const startedAt = Date.now();
      try {
        const rawBody = await req.json();
        const parsedBody = aiRouteRequestSchema.safeParse(rawBody);
        if (!parsedBody.success) {
          return NextResponse.json({ error: "Invalid AI request payload" }, { status: 400 });
        }

        const inputMessages = normalizeMessages(parsedBody.data.messages);
        const currentPath = parsedBody.data.currentPath ? sanitizeText(parsedBody.data.currentPath, 120) : "";
        const requestedSessionId = parsedBody.data.sessionId;

        if (inputMessages.length === 0) {
          return NextResponse.json({ error: "Empty messages" }, { status: 400 });
        }

        const lastUserMessage = [...inputMessages].reverse().find((item) => item.role === "user");
        if (!lastUserMessage) {
          return NextResponse.json({ error: "Missing user message" }, { status: 400 });
        }

        const { userId, userPlan } = await resolveUser(req);
        if (userId) {
          await enforceUserFopGroup3(userId, "api.ai.post");
        }

        const guest = await getOrCreateGuestFingerprint(req);
        const rateScope = userId || `guest:${guest.fingerprint}`;

        if (!userId) {
          const guestTotal = await enforceRateLimit(`ai:guest-total:${rateScope}`, GUEST_TOTAL_LIMIT, 60 * 60 * 24 * 365);
          const guestIpTotal = await enforceRateLimit(
            `ai:guest-ip-total:${guest.ip}`,
            GUEST_TOTAL_LIMIT,
            60 * 60 * 24 * 365
          );

          if (!guestTotal.allowed || !guestIpTotal.allowed) {
            const limitResponse = NextResponse.json(
              {
                error: "Guest limit reached. Please register to continue.",
                registerRequired: true,
                limits: { total: GUEST_TOTAL_LIMIT, remaining: 0 },
              },
              { status: 429 }
            );
            if (guest.shouldSetCookie) {
              limitResponse.cookies.set(GUEST_DEVICE_COOKIE, guest.deviceId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 365,
              });
            }
            return limitResponse;
          }
        }

        const dailyLimit = !userId ? GUEST_TOTAL_LIMIT : userPlan === "pro" ? USER_PRO_DAILY_LIMIT : USER_FREE_DAILY_LIMIT;
        const daily = await enforceRateLimit(`ai:daily:${rateScope}`, dailyLimit, 86400);
        if (!daily.allowed) {
          return NextResponse.json(
            { error: "Daily limit exceeded. Upgrade plan or try tomorrow.", limits: { total: dailyLimit, remaining: 0 } },
            { status: 429 }
          );
        }

        const burst = await enforceRateLimit(`ai:burst:${rateScope}`, 10, 60);
        if (!burst.allowed) {
          return NextResponse.json({ error: "Too many requests. Try in a minute." }, { status: 429 });
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const profile = userId
          ? await prisma.user.findUnique({
              where: { id: userId },
              select: {
                settings: {
                  select: {
                    group: true,
                    taxRate: true,
                    incomeLimit: true,
                  },
                },
              },
            })
          : null;

        const [monthIncomeAgg, monthExpenseAgg, yearIncomeAgg] = userId
          ? await Promise.all([
              prisma.income.aggregate({
                where: { userId, deletedAt: null, date: { gte: monthStart } },
                _count: { _all: true },
                _sum: { amount: true },
              }),
              prisma.expense.aggregate({
                where: { userId, deletedAt: null, date: { gte: monthStart } },
                _count: { _all: true },
                _sum: { amount: true },
              }),
              prisma.income.aggregate({
                where: { userId, deletedAt: null, date: { gte: yearStart } },
                _sum: { amount: true },
              }),
            ])
          : [
              { _count: { _all: 0 }, _sum: { amount: 0 } },
              { _count: { _all: 0 }, _sum: { amount: 0 } },
              { _sum: { amount: 0 } },
            ];

        const monthIncome = Number(monthIncomeAgg._sum.amount || 0);
        const monthExpense = Number(monthExpenseAgg._sum.amount || 0);
        const yearIncome = Number(yearIncomeAgg._sum.amount || 0);
        const group = 3;
        const taxRate = Number(profile?.settings?.taxRate || 0);
        const incomeLimit = Number(profile?.settings?.incomeLimit || 0);
        const limitUsage = incomeLimit > 0 ? ((yearIncome / incomeLimit) * 100).toFixed(1) : "n/a";
        const pathHint = resolveUiHint(currentPath || "");
        const isDomainQuestion = isInDomainQuestion(lastUserMessage.content, currentPath || "");

        let sessionId: string | null = null;
        let sessionTitle = "";
        let conversationMessages: ChatMessage[] = inputMessages;

        if (userId) {
          let session = requestedSessionId
            ? await prisma.aIChatSession.findFirst({
                where: { id: requestedSessionId, userId },
                select: { id: true, title: true },
              })
            : null;

          if (requestedSessionId && !session) {
            return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
          }

          if (!session) {
            session = await prisma.aIChatSession.create({
              data: {
                userId,
                title: truncateTitle(lastUserMessage.content),
              },
              select: { id: true, title: true },
            });
          }

          const history = await prisma.aIChatMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: "asc" },
            take: 40,
            select: { role: true, content: true },
          });

          sessionId = session.id;
          const sessionHasDefaultTitle = !session.title || session.title.trim() === "Новий чат";
          sessionTitle = sessionHasDefaultTitle ? truncateTitle(lastUserMessage.content) : session.title || "Новий чат";
          const sessionHistory: ChatMessage[] = history.map((item) => ({
            role: toChatRole(item.role),
            content: item.content,
          }));
          const merged: ChatMessage[] = [
            ...sessionHistory,
            { role: "user" as const, content: lastUserMessage.content },
          ];
          conversationMessages = merged.length > 20 ? merged.slice(-20) : merged;
        }

        const finalMessages: ChatMessage[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: LAW_CONTEXT },
          {
            role: "system",
            content:
              "Жорстке правило домену: відповідай лише в межах Finbase та задач ФОП 3 групи в цьому застосунку. Якщо питання поза доменом — коротко відмов.",
          },
          {
            role: "system",
            content: sanitizeText(
              `Контекст користувача: plan=${userPlan}; group=${group}; tax_rate=${taxRate}; month_income=${monthIncome}; month_expense=${monthExpense}; year_income=${yearIncome}; income_limit=${incomeLimit}; limit_usage_percent=${limitUsage}; page=${currentPath || "unknown"}; ui_hint=${pathHint};`,
              700
            ),
          },
          ...conversationMessages,
        ];

        const responseHash = hashString(JSON.stringify(finalMessages));
        const responseKey = cacheKey("ai", userId || guest.fingerprint, responseHash);
        const cached = await getCacheJson<{ assistant?: { role: string; content: string } }>(responseKey);
        if (cached?.assistant?.content) {
          const cachedResponse = NextResponse.json({
            ...cached,
            session: sessionId ? { id: sessionId, title: sessionTitle } : null,
            limits: { total: dailyLimit, remaining: daily.remaining },
            choices: [{ message: cached.assistant }],
          });
          if (guest.shouldSetCookie) {
            cachedResponse.cookies.set(GUEST_DEVICE_COOKIE, guest.deviceId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 365,
            });
          }
          cachedResponse.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
          return cachedResponse;
        }

        const openrouterKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterKey) {
          return NextResponse.json({ error: "AI provider key missing" }, { status: 500 });
        }

        if (!isDomainQuestion) {
          const restrictedPayload = {
            assistant: {
              role: "assistant" as const,
              content: OFFTOPIC_RESPONSE,
            },
            session: sessionId ? { id: sessionId, title: sessionTitle } : null,
            limits: { total: dailyLimit, remaining: daily.remaining },
            choices: [{ message: { role: "assistant", content: OFFTOPIC_RESPONSE } }],
          };
          const restrictedResponse = NextResponse.json(restrictedPayload);
          if (guest.shouldSetCookie) {
            restrictedResponse.cookies.set(GUEST_DEVICE_COOKIE, guest.deviceId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 365,
            });
          }
          restrictedResponse.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
          return restrictedResponse;
        }

        const providerResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Finbase",
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            temperature: OPENROUTER_TEMPERATURE,
            max_tokens: OPENROUTER_MAX_TOKENS,
            messages: finalMessages,
          }),
        });

        if (!providerResponse.ok) {
          const errText = await providerResponse.text();
          console.error("OpenRouter Error:", errText);
          return NextResponse.json({ error: "AI Service Unavailable" }, { status: 502 });
        }

        const data = await providerResponse.json();
        const assistantContent = sanitizeText(data?.choices?.[0]?.message?.content || "", 1800);
        if (!assistantContent) {
          return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
        }

        if (userId && sessionId) {
          await prisma.$transaction([
            prisma.aIChatMessage.create({
              data: {
                sessionId,
                role: "user",
                content: lastUserMessage.content,
              },
            }),
            prisma.aIChatMessage.create({
              data: {
                sessionId,
                role: "assistant",
                content: assistantContent,
              },
            }),
            prisma.aIChatSession.update({
              where: { id: sessionId },
              data: {
                lastUsedAt: new Date(),
                title: sessionTitle || truncateTitle(lastUserMessage.content),
              },
            }),
          ]);
        }

        const payload = {
          assistant: {
            role: "assistant" as const,
            content: assistantContent,
          },
          session: sessionId ? { id: sessionId, title: sessionTitle } : null,
          limits: { total: dailyLimit, remaining: daily.remaining },
          choices: [{ message: { role: "assistant", content: assistantContent } }],
        };

        await setCacheJson(responseKey, payload, 120);

        const okResponse = NextResponse.json(payload);
        if (guest.shouldSetCookie) {
          okResponse.cookies.set(GUEST_DEVICE_COOKIE, guest.deviceId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
          });
        }
        okResponse.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
        return okResponse;
      } catch (error) {
        console.error("AI route error:", error);
        await captureError(error, { route: "api/ai" });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    },
    { budgetMs: 1200 }
  );
}
