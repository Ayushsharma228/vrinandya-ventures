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
    select: { id: true, name: true, phone: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.phone) return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 });

  const digits = lead.phone.replace(/\D/g, "").replace(/^0+/, "");
  const waId = digits.startsWith("91") ? digits : `91${digits}`;

  const templateName = await getConfig("ARYA_OUTREACH_TEMPLATE", "hello_world");
  const rawLang      = await getConfig("ARYA_TEMPLATE_LANG", "en_US");
  const templateLang = (templateName === "hello_world" && rawLang === "en") ? "en_US" : rawLang;

  const firstName = (lead.name ?? "there").split(" ")[0];
  const repName   = (session.user.name ?? "our team").split(" ")[0];
  const bodyParams = templateName === "hello_world" ? [] : [firstName, repName];
  const result = await sendTemplateMessage(waId, templateName, templateLang, bodyParams);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: 502 });

  // Upsert by waId so we never hit a unique-constraint error on repeat sends
  const conv = await prisma.wAConversation.upsert({
    where: { waId },
    update: { status: WAConversationStatus.ACTIVE, lastMessageAt: new Date(), leadId: lead.id },
    create: {
      waId,
      phoneNumber: waId,
      name: lead.name,
      status: WAConversationStatus.ACTIVE,
      leadId: lead.id,
      lastMessageAt: new Date(),
    },
  });

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
