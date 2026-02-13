import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { cacheKey, getCacheJson, setCacheJson } from "@/lib/redis-cache";
import { enforceRateLimit, hashString, sanitizeText } from "@/lib/security";
import { getSupabaseEnv } from "@/lib/supabaseEnv";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `
Ти — AI-помічник Finbase для ФОП в Україні.
- Відповідай стисло, по суті, українською.
- Не вигадуй законодавство, якщо не впевнений — зазнач це.
- Не надавай персоналізованих юридичних гарантій.
`;

const LAW_CONTEXT = `
Базовий контекст:
- Для ФОП 3 групи часто застосовують ставку 5% (без ПДВ) або 3% (з ПДВ).
- ЄСВ сплачується окремо.
- Звітність залежить від налаштувань та поточних правил.
`;

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
    .slice(-12);
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

  // Fallback for explicit bearer token (mobile-like clients).
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
    include: { subscription: true },
  });

  return {
    userId,
    userPlan: dbUser?.subscription?.plan?.toLowerCase() || "free",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: unknown; currentPath?: unknown };
    const messages = normalizeMessages(body?.messages);
    const currentPath = typeof body?.currentPath === "string" ? sanitizeText(body.currentPath, 120) : "";

    if (messages.length === 0) {
      return NextResponse.json({ error: "Empty messages" }, { status: 400 });
    }

    const { userId, userPlan } = await resolveUser(req);
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

    const dailyLimit = !userId ? 3 : userPlan === "pro" ? 80 : 30;
    const rateScope = userId || `guest:${ip}`;
    const daily = await enforceRateLimit(`ai:daily:${rateScope}`, dailyLimit, 86400);
    if (!daily.allowed) {
      return NextResponse.json(
        { error: "Daily limit exceeded. Upgrade plan or try tomorrow." },
        { status: 429 }
      );
    }

    const burst = await enforceRateLimit(`ai:burst:${rateScope}`, 12, 60);
    if (!burst.allowed) {
      return NextResponse.json({ error: "Too many requests. Try in a minute." }, { status: 429 });
    }

    const contextIncomeCount = userId
      ? await prisma.income.count({ where: { userId } })
      : 0;

    const finalMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: LAW_CONTEXT },
      {
        role: "system",
        content: sanitizeText(
          `Контекст: plan=${userPlan}; income_count=${contextIncomeCount}; page=${currentPath || "unknown"}`,
          300
        ),
      },
      ...messages,
    ];

    const responseHash = hashString(JSON.stringify(finalMessages));
    const responseKey = cacheKey("ai", userId || "guest", responseHash);
    const cached = await getCacheJson<unknown>(responseKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({ error: "AI provider key missing" }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.2,
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter Error:", errText);
      return NextResponse.json({ error: "AI Service Unavailable" }, { status: 502 });
    }

    const data = await response.json();
    await setCacheJson(responseKey, data, 120);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

