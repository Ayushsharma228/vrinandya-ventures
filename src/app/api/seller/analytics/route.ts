import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { dataStartDate: true },
  });
  const dataStart = seller?.dataStartDate ?? null;

  // Effective lower bound: max(dataStartDate, from) so the hard floor always applies
  const fromDate = from ? new Date(from) : null;
  const gteDate = dataStart && fromDate
    ? (dataStart > fromDate ? dataStart : fromDate)
    : (dataStart ?? fromDate ?? null);
  const lteDate = to ? new Date(to + "T23:59:59.999Z") : null;
  const dateWhere = (gteDate || lteDate) ? {
    createdAt: {
      ...(gteDate ? { gte: gteDate } : {}),
      ...(lteDate ? { lte: lteDate } : {}),
    },
  } : {};

  // Orders filtered by date range (or all-time if no range given)
  const [orders, store] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId, ...dateWhere },
      select: {
        id: true,
        externalOrderId: true,
        status: true,
        courier: true,
        totalAmount: true,
        createdAt: true,
        items: { select: { name: true, sku: true, quantity: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shopifyStore.findFirst({
      where: { sellerId },
      select: { storeUrl: true, storeName: true },
    }),
  ]);

  const total = orders.length;

  // Correct status buckets
  const delivered  = orders.filter((o) => o.status === "DELIVERED");
  const rto        = orders.filter((o) => o.status === "RTO");
  const cancelled  = orders.filter((o) => o.status === "CANCELLED");
  const inTransit  = orders.filter((o) => o.status === "IN_TRANSIT" || o.status === "SHIPPED");

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  // Daily trend
  const trendMap = new Map<string, { delivered: number; rto: number; cancelled: number; total: number }>();
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const cur = trendMap.get(day) ?? { delivered: 0, rto: 0, cancelled: 0, total: 0 };
    cur.total++;
    if (o.status === "DELIVERED") cur.delivered++;
    if (o.status === "RTO") cur.rto++;
    if (o.status === "CANCELLED") cur.cancelled++;
    trendMap.set(day, cur);
  }
  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));

  // Product breakdown
  const productMap = new Map<string, { orders: number; units: number; delivered: number; rto: number }>();
  const skuMap = new Map<string, string>();
  for (const o of orders) {
    for (const item of o.items) {
      const cur = productMap.get(item.name) ?? { orders: 0, units: 0, delivered: 0, rto: 0 };
      cur.orders++;
      cur.units += item.quantity;
      if (o.status === "DELIVERED") cur.delivered++;
      if (o.status === "RTO") cur.rto++;
      productMap.set(item.name, cur);
      if (!skuMap.has(item.name) && item.sku) skuMap.set(item.name, item.sku);
    }
  }

  const topProducts = Array.from(productMap.entries())
    .sort((a, b) => b[1].orders - a[1].orders)
    .slice(0, 10)
    .map(([name, v]) => ({
      name,
      sku: skuMap.get(name) ?? "—",
      orders: v.orders,
      units: v.units,
      delPct: v.orders > 0 ? Math.round((v.delivered / v.orders) * 100) : 0,
      rtoPct: v.orders > 0 ? Math.round((v.rto / v.orders) * 100) : 0,
    }));

  const productDistribution = topProducts.slice(0, 5).map((p) => ({
    name: p.name,
    value: p.orders,
  }));

  // Revenue stats
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const avgRevenue = total > 0 ? totalRevenue / total : 0;

  return NextResponse.json({
    totalOrders: total,
    deliveryRate: pct(delivered.length),
    deliveredCount: delivered.length,
    rtoRate: pct(rto.length),
    rtoCount: rto.length,
    cancelledRate: pct(cancelled.length),
    cancelledCount: cancelled.length,
    inTransitRate: pct(inTransit.length),
    inTransitCount: inTransit.length,
    totalRevenue,
    avgRevenue,
    trend,
    topProducts,
    productDistribution,
    store,
  });
}
