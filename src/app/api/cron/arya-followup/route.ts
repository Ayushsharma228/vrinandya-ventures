import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTemplateMessage } from "@/lib/whatsapp/client";
import { WAConversationStatus, WAMessageRole } from "@prisma/client";

async function getConfig(key: string, fallback: string): Promise<string> {
  const r = await prisma.platformConfig.findUnique({ where: { key } });
  return r?.value ?? fallback;
}

// Runs daily via Vercel cron. Sends a follow-up template to HOT/WARM leads
// that have an active WhatsApp conversation with no reply in 48h.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Find active conversations linked to HOT/WARM leads, last message > 48h ago
  const staleConvs = await prisma.wAConversation.findMany({
    where: {
      status: WAConversationStatus.ACTIVE,
      lastMessageAt: { lt: cutoff48h },
      lead: { temperature: { in: ["HOT", "WARM"] } },
    },
    include: {
      lead: { select: { name: true, temperature: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 50,
  });

  const templateName = await getConfig("ARYA_FOLLOWUP_TEMPLATE", "hello_world");
  const templateLang = await getConfig("ARYA_TEMPLATE_LANG", "en");

  let sent = 0;
  const skipped: string[] = [];

  for (const conv of staleConvs) {
    // Skip if the last message was already from ASSISTANT (we already followed up, don't spam)
    const lastMsg = conv.messages[0];
    if (lastMsg?.role === "ASSISTANT") { skipped.push(conv.waId); continue; }

    const firstName = (conv.lead?.name ?? "there").split(" ")[0];
    const msgId = await sendTemplateMessage(conv.waId, templateName, templateLang, [firstName]);
    if (!msgId) { skipped.push(conv.waId); continue; }

    await prisma.wAMessage.create({
      data: {
        conversationId: conv.id,
        role: WAMessageRole.ASSISTANT,
        content: `[Follow-up template sent: ${templateName}]`,
        waMessageId: msgId,
      },
    });

    await prisma.wAConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent, skipped: skipped.length, total: staleConvs.length });
}
