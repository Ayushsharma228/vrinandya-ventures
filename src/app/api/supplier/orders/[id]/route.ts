import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      supplierId: session.user.id,
    },
    include: {
      seller: { select: { name: true, email: true } },
      items: {
        include: { product: { select: { name: true, sku: true, images: true } } },
      },
      purchaseOrder: {
        include: { items: true },
      },
      timeline: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ order });
}
