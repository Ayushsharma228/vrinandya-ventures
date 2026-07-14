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
  seller: { select: { brandName: true, name: true } },
  items: { select: { name: true, quantity: true, price: true } },
  timeline: {
    orderBy: { createdAt: "asc" as const },
    select: { event: true, details: true, createdAt: true },
  },
};

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("id")?.trim();
  if (!ref) return NextResponse.json({ error: "id param required" }, { status: 400 });

  // 1. Try exact match by internal DB id (CUID — from the seller's copy-link button)
  const byId = await prisma.order.findUnique({ where: { id: ref }, select: SELECT });
  if (byId) return NextResponse.json({ order: byId });

  // 2. Shopify stores order names as "#1039" — normalise so both "1039" and "#1039" work
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

  // Multiple stores with the same order number — return list for disambiguation
  return NextResponse.json({ multiple: true, orders: byExtId });
}
