import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sellerId = session.user.id;

  const [tickets, stats] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { sellerId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, isInternal: true } },
      },
    }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      where: { sellerId },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({ tickets, stats });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, category, priority, description, relatedOrderId } = await req.json();
  if (!subject?.trim() || !description?.trim())
    return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });

  const ticket = await prisma.supportTicket.create({
    data: {
      sellerId: session.user.id,
      subject:  subject.trim(),
      category: category ?? "OTHER",
      priority: priority ?? "NORMAL",
      relatedOrderId: relatedOrderId?.trim() || null,
      messages: {
        create: {
          authorId:  session.user.id,
          message:   description.trim(),
          isInternal: false,
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json({ ticket });
}
