import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;

    const [products, pushed, orderItems] = await Promise.all([
      prisma.product.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { name: true } },
          variants:  { select: { id: true, name: true, sku: true, price: true, stock: true, attributes: true, images: true } },
        },
      }),
      prisma.listingRequest.findMany({
        where: { sellerId, platform: "SHOPIFY", status: "LISTED" },
        select: { productId: true },
      }),
      prisma.orderItem.findMany({
        where: {
          productId: { not: null },
          order: { sellerId },
        },
        select: {
          productId: true,
          quantity: true,
          price: true,
          order: { select: { status: true } },
        },
      }),
    ]);

    const pushedProductIds = new Set(pushed.map((r) => r.productId));

    type PerfEntry = { totalOrders: number; totalRevenue: number; deliveredCount: number; rtoCount: number };
    const perfMap: Record<string, PerfEntry> = {};
    for (const item of orderItems) {
      if (!item.productId) continue;
      if (!perfMap[item.productId]) {
        perfMap[item.productId] = { totalOrders: 0, totalRevenue: 0, deliveredCount: 0, rtoCount: 0 };
      }
      perfMap[item.productId].totalOrders++;
      perfMap[item.productId].totalRevenue += (item.price ?? 0) * (item.quantity ?? 1);
      if (item.order.status === "DELIVERED") perfMap[item.productId].deliveredCount++;
      if (item.order.status === "RTO")       perfMap[item.productId].rtoCount++;
    }

    function buildPerf(id: string) {
      const p = perfMap[id];
      if (!p || p.totalOrders === 0) return null;
      const resolved    = p.deliveredCount + p.rtoCount;
      const deliveryRate = resolved > 0 ? Math.round((p.deliveredCount / resolved) * 100) : 0;
      const rtoRate      = resolved > 0 ? Math.round((p.rtoCount      / resolved) * 100) : 0;
      const health =
        resolved === 0  ? "NO_DATA" :
        rtoRate > 30    ? "PAUSE"   :
        rtoRate > 15    ? "WATCH"   : "GOOD";
      return { ...p, deliveryRate, rtoRate, health };
    }

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        pushed: pushedProductIds.has(p.id),
        perf:   buildPerf(p.id),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
