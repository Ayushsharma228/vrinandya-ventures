import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WAConversationStatus, WAMessageRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const entries = (body?.entry as unknown[]) ?? [];

  for (const entry of entries) {
    const changes = ((entry as Record<string, unknown>)?.changes as unknown[]) ?? [];
    for (const change of changes) {
      const value = (change as Record<string, unknown>)?.value as Record<string, unknown>;
      if (!value) continue;

      const messages = (value?.messages as unknown[]) ?? [];
      const contacts = (value?.contacts as unknown[]) ?? [];

      const contactMap: Record<string, string> = {};
      for (const c of contacts) {
        const contact = c as Record<string, unknown>;
        const waId    = contact.wa_id as string;
        const name    = ((contact.profile as Record<string, unknown>)?.name as string) ?? waId;
        contactMap[waId] = name;
      }

      for (const msg of messages) {
        const m = msg as Record<string, unknown>;
        if (m.type !== "text") continue;

        const waId        = m.from as string;
        const text        = ((m.text as Record<string, unknown>)?.body as string) ?? "";
        const waMessageId = m.id as string;
        const contactName = contactMap[waId] ?? waId;

        if (!text.trim()) continue;

        let conv = await prisma.wAConversation.findUnique({ where: { waId } });

        if (!conv) {
          const digits      = waId.replace(/\D/g, "");
          const shortDigits = digits.startsWith("91") ? digits.slice(2) : digits;
          const lead = await prisma.lead.findFirst({
            where: { OR: [{ phone: { contains: shortDigits } }, { phone: { contains: digits } }] },
          });
          conv = await prisma.wAConversation.create({
            data: {
              waId,
              phoneNumber:   waId,
              name:          lead?.name ?? contactName,
              status:        WAConversationStatus.ACTIVE,
              leadId:        lead?.id ?? null,
              lastMessageAt: new Date(),
            },
          });
        } else {
          await prisma.wAConversation.update({
            where: { id: conv.id },
            data: {
              lastMessageAt: new Date(),
              name:   conv.name ?? contactName,
              status: conv.status === WAConversationStatus.CLOSED
                ? WAConversationStatus.ACTIVE : conv.status,
            },
          });
        }

        const dup = await prisma.wAMessage.findFirst({ where: { waMessageId } });
        if (!dup) {
          await prisma.wAMessage.create({
            data: { conversationId: conv.id, role: WAMessageRole.USER, content: text, waMessageId },
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
