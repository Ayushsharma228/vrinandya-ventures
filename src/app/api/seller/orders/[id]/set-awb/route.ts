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
  const { awbNumber, courier, trackingUrl } = await req.json();

  if (!awbNumber?.trim())
    return NextResponse.json({ error: "AWB number is required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id, sellerId: session.user.id },
    select: { id: true, status: true },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (["DELIVERED", "CANCELLED", "RTO"].includes(order.status))
    return NextResponse.json({ error: "Cannot update AWB for completed orders" }, { status: 400 });

  await prisma.order.update({
    where: { id },
    data: {
      awbNumber:   awbNumber.trim(),
      courier:     courier?.trim()     || null,
      trackingUrl: trackingUrl?.trim() || null,
      // Advance to SHIPPED if still in early stages
      ...(["NEW", "PROCESSING"].includes(order.status) ? { status: "SHIPPED" } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
