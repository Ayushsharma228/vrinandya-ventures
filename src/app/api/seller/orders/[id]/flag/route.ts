import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason, note } = await req.json();

  if (!reason?.trim())
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id, sellerId: session.user.id },
    select: { id: true },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const details = note?.trim() ? `${reason}: ${note.trim()}` : reason;

  const entry = await prisma.orderTimeline.create({
    data: {
      orderId:   id,
      actorId:   session.user.id,
      actorRole: "SELLER",
      event:     "ORDER_FLAGGED",
      details,
    },
  });

  return NextResponse.json({ entry });
}
