import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const order = await prisma.order.findFirst({
    where: { externalOrderId: orderId },
    select: {
      id: true,
      externalOrderId: true,
      status: true,
      supplierStatus: true,
      customerName: true,
      totalAmount: true,
      supplierTrackingNo: true,
      supplierCourier: true,
      expectedDispatchDate: true,
      expectedDeliveryDate: true,
      dispatchedAt: true,
      createdAt: true,
      items: {
        select: { name: true, quantity: true, price: true },
      },
      timeline: {
        orderBy: { createdAt: "asc" },
        select: { event: true, details: true, createdAt: true, actorRole: true },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ order });
}
