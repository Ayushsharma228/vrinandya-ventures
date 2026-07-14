import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      seller:   { select: { id: true, name: true, email: true, brandName: true, phone: true } },
      supplier: { select: { id: true, name: true, email: true, phone: true } },
      items:    true,
      purchaseOrder: {
        select: {
          id: true, poNumber: true, status: true,
          dispatchedAt: true, createdAt: true,
        },
      },
      timeline: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, event: true, details: true, metadata: true,
          actorRole: true, createdAt: true,
        },
      },
      supplierPayment: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Settlement (no direct relation, look up by orderId)
  const settlement = await prisma.settlement.findUnique({
    where: { orderId: id },
  });

  return NextResponse.json({ order, settlement });
}
