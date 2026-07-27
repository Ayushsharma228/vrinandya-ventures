import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { WAMessageRole } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const conv = await prisma.wAConversation.findUnique({ where: { id } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const msgId = await sendTextMessage(conv.waId, message.trim());
  if (!msgId) return NextResponse.json({ error: "Failed to send — check WHATSAPP_ACCESS_TOKEN" }, { status: 502 });

  const [saved] = await Promise.all([
    prisma.wAMessage.create({
      data: { conversationId: conv.id, role: WAMessageRole.ASSISTANT, content: message.trim(), waMessageId: msgId },
    }),
    prisma.wAConversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, message: saved });
}
