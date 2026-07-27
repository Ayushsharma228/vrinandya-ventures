import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendTemplateMessage } from "@/lib/whatsapp/client";
import { WAConversationStatus, WAMessageRole } from "@prisma/client";

async function getConfig(key: string, fallback: string): Promise<string> {
  const r = await prisma.platformConfig.findUnique({ where: { key } });
  return r?.value ?? fallback;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, assignedToId: session.user.id },
    select: { id: true, name: true, phone: true, waConversations: { select: { id: true, status: true } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.phone) return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 });

  const activeConv = lead.waConversations.find(c =>
    c.status === WAConversationStatus.ACTIVE || c.status === WAConversationStatus.HANDED_OFF,
  );
  if (activeConv)
    return NextResponse.json({ error: "An active WhatsApp conversation already exists for this lead" }, { status: 409 });

  const digits = lead.phone.replace(/\D/g, "");
  const waId = digits.startsWith("91") ? digits : `91${digits}`;

  const templateName = await getConfig("ARYA_OUTREACH_TEMPLATE", "hello_world");
  const templateLang = await getConfig("ARYA_TEMPLATE_LANG", "en");

  const firstName = (lead.name ?? "there").split(" ")[0];
  const result = await sendTemplateMessage(waId, templateName, templateLang, [firstName]);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: 502 });
  const msgId = result.messageId;

  const existing = lead.waConversations[0];
  let conv;
  if (existing) {
    conv = await prisma.wAConversation.update({
      where: { id: existing.id },
      data: { status: WAConversationStatus.ACTIVE, lastMessageAt: new Date() },
    });
  } else {
    conv = await prisma.wAConversation.create({
      data: {
        waId,
        phoneNumber: waId,
        name: lead.name,
        status: WAConversationStatus.ACTIVE,
        leadId: lead.id,
        lastMessageAt: new Date(),
      },
    });
  }

  await prisma.wAMessage.create({
    data: {
      conversationId: conv.id,
      role: WAMessageRole.ASSISTANT,
      content: `[Outreach template sent: ${templateName}]`,
      waMessageId: result.messageId,
    },
  });

  return NextResponse.json({ ok: true, conversationId: conv.id, waId });
}
