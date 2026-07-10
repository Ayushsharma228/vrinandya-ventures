import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { calculateLeadScore } from "../score-lead/route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Arya, an AI Sales Development Representative (SDR) for Axiqen — India's leading dropshipping operations platform.

YOUR ROLE:
- Greet and build rapport with leads
- Qualify them by understanding their business needs
- Answer FAQs realistically (never overpromise)
- Recommend the best plan based on their answers
- Book a sales call ONLY if the lead is qualified (score ≥ 70)
- Hand off qualified leads to the human sales team
- NEVER try to close the sale yourself

AXIQEN PLANS:
- Starter: ₹10,000 + GST/month — 1 Shopify store, up to 200 orders/month, basic analytics
- Growth: ₹25,000 + GST/month — 3 Shopify stores, unlimited orders, full analytics, CRM, dedicated manager
- Enterprise: ₹40,000 + GST/month — unlimited stores, express fulfilment, custom integrations, 24/7 support

QUALIFICATION QUESTIONS TO ASK (naturally, one at a time):
1. What kind of business are you currently running or planning to start?
2. What is your monthly investment budget for this?
3. When are you looking to start?
4. Have you sold online before? Which platforms?
5. What's your biggest challenge right now?
6. Are you the decision-maker for this investment?
7. What's your main goal — more orders, better fulfilment, or scaling?

LEAD SCORING SIGNALS TO EXTRACT:
- budget: exact amount or range they mention
- timeline: when they want to start
- experience: new/intermediate/advanced
- isDecisionMaker: yes/no
- marketplace: which platforms they use
- goal: what they want to achieve
- urgency: how quickly they need a solution
- buyingIntent: do they seem ready to move forward

FAQ ANSWERS:
- Profit: Depends on product, margin, and orders. Realistic range ₹20,000–₹1,00,000/month after 3–6 months. Never promise fixed income.
- Orders: Starting sellers get 30–100 orders/month, scaling to 200–500+ with marketing.
- RTO: We track NDR automatically. RTO rate depends on product and targeting. We help minimise it.
- Investment: Starter ₹10,000/month. Includes platform, fulfilment, support.
- Setup time: 24–48 hours for onboarding, 7 days to first order.
- GST: 18% GST applicable on platform fee. Products are shipped B2C.
- Shipping: Via Delhivery, 18,000+ pin codes covered. COD and prepaid both supported.
- Returns: NDR management built-in. RTO handled from our warehouse.

CONVERSATION FLOW:
1. Greeting → 2. Rapport (ask about business) → 3. Qualification questions → 4. Pain discovery → 5. FAQ/objections → 6. Plan recommendation → 7. Sales call booking (if HOT) or nurturing plan (if WARM/COLD) → 8. CRM update

TONE: Friendly, professional, in Hinglish if the lead switches to Hindi. Keep messages short (2–3 sentences max). Do NOT use bullet points in messages — conversational only.

After qualification, end your message with a JSON block (invisible to user) formatted as:
[QUALIFICATION_DATA]{"budget":"X","timeline":"X","experience":"X","isDecisionMaker":true/false,"marketplace":"X","goal":"X","urgency":"X","buyingIntent":"X"}[/QUALIFICATION_DATA]`;

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leadId = new URL(req.url).searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const conversation = await prisma.aiConversation.findFirst({
    where: { leadId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ conversation });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId, userMessage, startNew } = await req.json() as {
    leadId: string; userMessage?: string; startNew?: boolean;
  };

  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Get or create conversation
  let conversation = await prisma.aiConversation.findFirst({
    where: { leadId, status: { in: ["PENDING", "ACTIVE"] } },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation || startNew) {
    conversation = await prisma.aiConversation.create({
      data: {
        leadId,
        status: "ACTIVE",
        startedAt: new Date(),
      },
      include: { messages: true },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { pipelineStage: "AI_CONVERSATION_STARTED", aiStatus: "ACTIVE" },
    });
  }

  // Build message history for Claude
  const history = conversation.messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // If no user message, generate the opening greeting
  const isOpening = !userMessage && history.length === 0;
  if (isOpening) {
    const openingPrompt = `Start the conversation. Greet ${lead.name} warmly and ask about their business in one friendly sentence. Do not mention the platform yet.`;
    history.push({ role: "user", content: openingPrompt });
  } else if (userMessage) {
    history.push({ role: "user", content: userMessage });
    await prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: "user", content: userMessage },
    });
  }

  // Call Claude
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  const rawReply = (response.content[0] as { type: string; text: string }).text ?? "";

  // Extract qualification data if present (avoid /s flag for TS compat)
  const qualStart = rawReply.indexOf("[QUALIFICATION_DATA]");
  const qualEnd   = rawReply.indexOf("[/QUALIFICATION_DATA]");
  const qualMatch = qualStart !== -1 && qualEnd !== -1
    ? [null, rawReply.slice(qualStart + 20, qualEnd)]
    : null;
  const cleanReply = qualStart !== -1
    ? (rawReply.slice(0, qualStart) + rawReply.slice(qualEnd + 21)).trim()
    : rawReply.trim();

  // Save assistant reply
  await prisma.aiMessage.create({
    data: { conversationId: conversation.id, role: "assistant", content: cleanReply },
  });

  // If qualification data found, score the lead
  let scoreResult = null;
  if (qualMatch) {
    try {
      const answers = JSON.parse(qualMatch[1] ?? "{}");
      const scored = calculateLeadScore(answers);
      scoreResult = scored;

      await prisma.$transaction([
        prisma.leadScoreDetail.upsert({
          where: { leadId },
          create: { leadId, ...scored },
          update: { ...scored, updatedAt: new Date() },
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            leadScore: scored.totalScore,
            temperature: scored.temperature,
            pipelineStage: "QUALIFICATION_COMPLETED",
            recommendedPlan: scored.recommendedPlan,
            aiStatus: "COMPLETED",
          },
        }),
        prisma.aiConversation.update({
          where: { id: conversation.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        }),
      ]);
    } catch { /* malformed JSON from AI — skip scoring */ }
  }

  return NextResponse.json({
    reply: cleanReply,
    conversationId: conversation.id,
    scoreResult,
    isOpening,
  });
}
