import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { message, isInternal } = await req.json();
  if (!message?.trim())
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, sellerId: true, subject: true, ticketNumber: true, status: true },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const internal = Boolean(isInternal);

  const [msg] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId: id, authorId: session.user.id, message: message.trim(), isInternal: internal },
      include: { author: { select: { id: true, name: true, role: true } } },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: {
        status: ticket.status === "OPEN" || ticket.status === "WAITING_ON_SELLER"
          ? "IN_PROGRESS" : ticket.status,
        updatedAt: new Date(),
      },
    }),
  ]);

  // Notify seller (public replies only)
  if (!internal) {
    await prisma.notification.create({
      data: {
        userId: ticket.sellerId,
        type:   "GENERAL",
        title:  `Reply on Ticket #${ticket.ticketNumber}`,
        message: `Support replied to your ticket "${ticket.subject}". Tap to view.`,
        data: { category: "General", ticketId: id },
      },
    });
  }

  return NextResponse.json({ message: msg });
}
