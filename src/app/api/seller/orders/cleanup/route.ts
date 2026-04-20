import { NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// One-time cleanup: remove orders with numeric Shopify IDs (old format before using so.name)
export async function POST() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete orders where externalOrderId is purely numeric (old format)
  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id, source: "SHOPIFY" },
    select: { id: true, externalOrderId: true },
  });

  const oldIds = orders
    .filter((o) => /^\d+$/.test(o.externalOrderId))
    .map((o) => o.id);

  if (oldIds.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  await prisma.orderItem.deleteMany({ where: { orderId: { in: oldIds } } });
  await prisma.order.deleteMany({ where: { id: { in: oldIds } } });

  return NextResponse.json({ deleted: oldIds.length });
}
