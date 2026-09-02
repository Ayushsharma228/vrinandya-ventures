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
  const { message } = await req.json();

  if (!message?.trim())
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const entry = await prisma.orderTimeline.create({
    data: {
      orderId:   id,
      actorId:   session.user.id,
      actorRole: "ADMIN",
      event:     "ADMIN_REPLY",
      details:   message.trim(),
    },
  });

  return NextResponse.json({ entry });
}
