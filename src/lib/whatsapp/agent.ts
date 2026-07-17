import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "./client";
import { ARYA_WA_SYSTEM_PROMPT, buildWAContext } from "./prompts";
import { WAConversationStatus, WAMessageRole } from "@prisma/client";

const MAX_MESSAGES = 20; // close conversation after this many exchanges

interface QualificationResult {
  qualified: boolean;
  score: number;
  temperature: string;
  name?: string;
  business?: string;
  revenue?: string;
  recommendedPlan?: string;
  summary?: string;
  handOff?: boolean;
}

function extractQualification(text: string): QualificationResult | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function cleanReply(text: string): string {
  // Remove the JSON block from the reply sent to user
  return text.replace(/```json[\s\S]*?```/g, "").trim();
}

export async function handleIncomingMessage(
  waId: string,
  phoneNumber: string,
  senderName: string | undefined,
  messageText: string,
  waMessageId: string,
): Promise<void> {
  // Find or create conversation
  let conversation = await prisma.wAConversation.findUnique({ where: { waId } });

  if (!conversation) {
    conversation = await prisma.wAConversation.create({
      data: {
        waId,
        phoneNumber,
        name: senderName,
        status: WAConversationStatus.ACTIVE,
        lastMessageAt: new Date(),
      },
    });
  }

  // Skip if closed/opted-out
  if (
    conversation.status === WAConversationStatus.CLOSED ||
    conversation.status === WAConversationStatus.OPTED_OUT
  ) {
    return;
  }

  // Handle opt-out keywords
  const lowerText = messageText.toLowerCase().trim();
  if (["stop", "unsubscribe", "opt out", "block", "band karo"].some(k => lowerText.includes(k))) {
    await prisma.wAConversation.update({
      where: { id: conversation.id },
      data: { status: WAConversationStatus.OPTED_OUT },
    });
    await sendTextMessage(waId, "You have been unsubscribed. We will not contact you again. Take care! 🙏");
    return;
  }

  // Save incoming message
  await prisma.wAMessage.create({
    data: {
      conversationId: conversation.id,
      role: WAMessageRole.USER,
      content: messageText,
      waMessageId,
    },
  });

  // Load recent message history (last 15 messages for context)
  const history = await prisma.wAMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 15,
  });

  // Check message count — close after MAX_MESSAGES if not yet qualified
  if (history.length > MAX_MESSAGES && conversation.status === WAConversationStatus.ACTIVE) {
    await prisma.wAConversation.update({
      where: { id: conversation.id },
      data: { status: WAConversationStatus.CLOSED },
    });
    await sendTextMessage(
      waId,
      "Thank you for chatting with us! Our team will reach out to you soon. Have a great day! 😊",
    );
    return;
  }

  // Generate AI reply
  if (!process.env.ANTHROPIC_API_KEY) {
    await sendTextMessage(waId, "Hi! Thanks for reaching out to Vrinandya Ventures. Our team will contact you shortly! 🙏");
    return;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const userPrompt = buildWAContext(
      history.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    ) + `\n\nLatest message from lead: ${messageText}\n\nRespond as Arya. Be conversational and brief.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: ARYA_WA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const fullReply = response.content[0]?.type === "text" ? response.content[0].text : "";
    const cleanedReply = cleanReply(fullReply);

    // Save assistant message
    await prisma.wAMessage.create({
      data: {
        conversationId: conversation.id,
        role: WAMessageRole.ASSISTANT,
        content: cleanedReply,
      },
    });

    // Send reply to WhatsApp
    await sendTextMessage(waId, cleanedReply);

    // Update conversation
    await prisma.wAConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), name: senderName ?? conversation.name },
    });

    // Check for qualification result
    const qual = extractQualification(fullReply);
    if (qual && qual.qualified) {
      await handleQualification(conversation.id, waId, qual, senderName, phoneNumber);
    }
  } catch (err) {
    console.error("[WA Agent] LLM error:", err);
    await sendTextMessage(waId, "Thanks for your message! Our team will get back to you shortly. 🙏");
  }
}

async function handleQualification(
  conversationId: string,
  waId: string,
  qual: QualificationResult,
  name: string | undefined,
  phone: string,
): Promise<void> {
  // Find or create a Lead record
  const existingConv = await prisma.wAConversation.findUnique({
    where: { id: conversationId },
    select: { leadId: true },
  });

  let leadId = existingConv?.leadId;

  if (!leadId) {
    // Find admin to assign as creator
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    if (admin) {
      const lead = await prisma.lead.create({
        data: {
          name: qual.name ?? name ?? "WhatsApp Lead",
          phone: phone.replace(/^91/, ""),
          source: "WHATSAPP",
          stage: "LEAD",
          pipelineStage: qual.temperature === "HOT" ? "HOT_LEAD" : qual.temperature === "WARM" ? "WARM_LEAD" : "COLD_LEAD",
          temperature: qual.temperature as never,
          leadScore: qual.score,
          qualificationSummary: qual.summary,
          recommendedPlan: qual.recommendedPlan,
          aiStatus: "COMPLETED",
          createdById: admin.id,
          notes: `WhatsApp lead. Business: ${qual.business ?? "unknown"}. Revenue: ${qual.revenue ?? "unknown"}`,
        },
      });
      leadId = lead.id;

      // Link conversation to lead
      await prisma.wAConversation.update({
        where: { id: conversationId },
        data: {
          leadId,
          status: qual.handOff ? WAConversationStatus.HANDED_OFF : WAConversationStatus.QUALIFIED,
          qualifiedAt: new Date(),
          ...(qual.handOff ? { handedOffAt: new Date() } : {}),
        },
      });

      // Notify admins
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const a of admins) {
        await prisma.notification.create({
          data: {
            userId: a.id,
            type: "GENERAL",
            title: qual.temperature === "HOT" ? "🔥 Hot WhatsApp Lead!" : "✅ WhatsApp Lead Qualified",
            message: `${qual.name ?? "A lead"} qualified via WhatsApp. Score: ${qual.score}/100. ${qual.summary ?? ""}`,
            data: { leadId, conversationId, score: qual.score, temperature: qual.temperature },
          },
        });
      }

      // Send handoff message to lead if hot
      if (qual.handOff) {
        await sendTextMessage(
          waId,
          `Great chatting with you! 🎉 I'm connecting you with our senior team member who will guide you through the next steps. They'll reach out to you very soon! 📞`,
        );
      }
    }
  }
}
