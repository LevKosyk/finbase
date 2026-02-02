import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client to verify tokens/users if needed
// Or better, use the cookies/headers from the request if using @supabase/ssr
// For now, we'll try to get the user from the request headers (Authorization: Bearer <token>)
// or just trust the client-side user ID (NOT SECURE - MVP only?)
// user requested "Check on server", so we MUST verify.
// We will use standard supabase-js with the anon key and the user's access token passed in header.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const SYSTEM_PROMPT = `
Ты — AI-помощник веб-приложения Finbase.

Finbase — сервис для ФОП 3 группы в Украине:
- учёт доходов
- расчёт налогов (5% + ЕСВ)
- квартальные отчёты
- подписка free / pro

Правила:
- Отвечай ТОЛЬКО по Finbase и ФОП 3 группы
- Не давай юридических консультаций
- Не придумывай законы
- Если вопрос не по теме — откажи
- Говори простым языком
`;

const URGENT_LAW_CONTEXT = `
Контекст законодательства:
- ФОП 3 группы платит 5% с дохода
- ЕСВ платится отдельно (фиксированный)
- Отчётность — поквартально
- Доход — деньги, фактически полученные
`;

export async function POST(req: Request) {
  try {
    const { messages, currentPath } = await req.json();
    const authHeader = req.headers.get("Authorization");

    let userId: string | null = null;
    let userPlan = "guest";

    // 1. Authenticate User
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        userId = user.id;
        // Fetch user plan and other details from internal DB
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true, incomes: true }
        });
        
        if (dbUser) {
           userPlan = dbUser.subscription?.plan?.toLowerCase() || "free";
        }
      }
    }

    // 2. Check & Update Limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.aiUsage.findUnique({
      where: {
        userId_date: {
          userId: userId || "guest", // careful with guest handling in unique constraint
          date: today
        }
      }
    });

    const currentUsage = usage?.count || 0;
    
    // Limits
    // Guest: 3, User: 20, Pro: 50
    let limit = 3;
    if (userId) {
        if (userPlan === "pro") limit = 50;
        else limit = 20;
    }

    if (currentUsage >= limit) {
      return NextResponse.json(
        { error: "Daily limit exceeded. " + (userId ? "Upgrade to Pro for more." : "Sign up for more.") }, 
        { status: 429 }
      );
    }

    // Increment Usage
    // Note: Concurrency issue possible here but ok for MVP
    await prisma.aiUsage.upsert({
      where: {
        userId_date: {
          userId: userId || "guest",
          date: today
        }
      },
      update: {
        count: { increment: 1 }
      },
      create: {
        userId: userId || "guest",
        date: today,
        count: 1
      }
    });


    // 3. Build Context
    let userContext = `Контекст пользователя:\nПлан: ${userPlan}`;
    if (userId) {
        // We can add more specific info here if needed
        // For now, keeping it simple as per spec
        const incomeCount = await prisma.income.count({ where: { userId } });
        userContext += `\nДоходов в системе: ${incomeCount}`;
    }

    const screenContext = currentPath ? `\nПользователь находится на странице: ${currentPath}` : "";

    const finalMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: URGENT_LAW_CONTEXT },
      { role: "system", content: userContext + screenContext },
      ...messages
    ];

    // 4. Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.25,
        messages: finalMessages,
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter Error:", errText);
        return NextResponse.json({ error: "AI Service Unavailable" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
