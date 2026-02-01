"use server";

import OpenAI from 'openai';
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse(messages: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Fetch User Context from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
        settings: true,
        incomes: {
            take: 10,
            orderBy: { date: 'desc' }
        }
    }
  });

  if (!dbUser) {
    return { error: "User not found in database" };
  }

  // 2. Prepare Context String
  const incomeTotal = dbUser.incomes.reduce((sum: number, inc: any) => sum + inc.amount, 0);
  const taxGroup = dbUser.settings?.group || 3;
  const taxRate = taxGroup === 3 ? "5%" : "Fixed (Group 2)";
  
  const systemContext = `
    You are Finbase AI, a smart financial assistant for a Ukrainian entrepreneur (FOP).
    
    USER CONTEXT:
    - Name: ${dbUser.name}
    - FOP Group: ${taxGroup} (Tax Rate: ${taxRate})
    - Recent Income (Last 10): ${JSON.stringify(dbUser.incomes.map((i: any) => ({ amount: i.amount, source: i.source, date: i.date })))}
    - Total Tracked Income: ${incomeTotal} UAH
    
    INSTRUCTIONS:
    - Answer questions about taxes, income, and financial advice based on the context above.
    - Be concise, professional, and helpful.
    - If asked about taxes, calculate them based on the user's group (Group 3 = 5% of total income).
    - Reply in Ukrainian.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-3.5-turbo if cost is concern
      messages: [
        { role: "system", content: systemContext },
        ...messages
      ],
      temperature: 0.7,
    });

    return { 
        role: 'assistant', 
        content: response.choices[0].message.content 
    };
  } catch (error) {
    console.error("OpenAI Error:", error);
    return { error: "Failed to get AI response. Check API Key." };
  }
}
