import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.wAConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      lead: { select: { id: true, name: true, leadScore: true, temperature: true, pipelineStage: true, recommendedPlan: true, qualificationSummary: true } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ conversation });
}

// POST — admin sends a manual message or changes status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const conversation = await prisma.wAConversation.findUnique({ where: { id } });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "send_message" && body.message) {
    const msgId = await sendTextMessage(conversation.waId, body.message);
    await prisma.wAMessage.create({
      data: {
        conversationId: id,
        role: "ASSISTANT",
        content: `[Admin] ${body.message}`,
        waMessageId: msgId ?? undefined,
      },
    });
    await prisma.wAConversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "close") {
    await prisma.wAConversation.update({ where: { id }, data: { status: "CLOSED" } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reopen") {
    await prisma.wAConversation.update({ where: { id }, data: { status: "ACTIVE" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
