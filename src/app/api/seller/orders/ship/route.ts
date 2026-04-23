import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId: session.user.id },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "NEW") return NextResponse.json({ error: "Only NEW orders can be confirmed" }, { status: 400 });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PROCESSING" },
  });

  return NextResponse.json({ success: true });
}
