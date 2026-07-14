import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SELECT = {
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
  items: { select: { name: true, quantity: true, price: true } },
  timeline: {
    orderBy: { createdAt: "asc" as const },
    select: { event: true, details: true, createdAt: true },
  },
};

export async function GET(req: NextRequest) {
  const ref      = req.nextUrl.searchParams.get("id")?.trim();
  const sellerId = req.nextUrl.searchParams.get("sellerId")?.trim();

  if (!ref) return NextResponse.json({ error: "id param required" }, { status: 400 });

  // When a sellerId is provided (store-scoped lookup from the 2-step tracking flow),
  // skip the global CUID search and only look within that seller's orders.
  if (sellerId) {
    const withHash    = ref.startsWith("#") ? ref : `#${ref}`;
    const withoutHash = ref.startsWith("#") ? ref.slice(1) : ref;

    const order = await prisma.order.findFirst({
      where: {
        sellerId,
        externalOrderId: { in: [withHash, withoutHash] },
      },
      select: SELECT,
      orderBy: { createdAt: "desc" },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  }

  // No sellerId — this is a direct CUID link (from seller's copy-link button).
  const byId = await prisma.order.findUnique({ where: { id: ref }, select: SELECT });
  if (byId) return NextResponse.json({ order: byId });

  // Fallback: try externalOrderId search (older links).
  const withHash    = ref.startsWith("#") ? ref : `#${ref}`;
  const withoutHash = ref.startsWith("#") ? ref.slice(1) : ref;

  const byExtId = await prisma.order.findMany({
    where: { externalOrderId: { in: [withHash, withoutHash] } },
    select: SELECT,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (byExtId.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (byExtId.length === 1) return NextResponse.json({ order: byExtId[0] });

  // Multiple stores matched — signal the UI to show the store-picker step.
  return NextResponse.json({ needsStore: true });
}
