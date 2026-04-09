import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from ".prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const mode = searchParams.get("mode") ?? "delivered"; // "delivered" | "synced"

  const dateFilter =
    from && to
      ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
      : {};

  const [orders, store] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId, ...dateFilter },
      select: {
        id: true,
        externalOrderId: true,
        status: true,
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

  if (mode === "synced") {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const avgRevenue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // daily trend
    const trendMap = new Map<string, number>();
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
    }
    const trend = Array.from(trendMap.entries()).map(([date, orders]) => ({
      date,
      orders,
    }));

    // product distribution
    const productMap = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) {
        productMap.set(item.name, (productMap.get(item.name) ?? 0) + item.quantity);
      }
    }
    const productDistribution = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      mode: "synced",
      totalOrders,
      totalRevenue,
      avgRevenue,
      trend,
      productDistribution,
      store,
    });
  }

  // delivered mode
  const delivered = orders.filter((o) => o.status === ("DELIVERED" as OrderStatus));
  const rto = orders.filter((o) => o.status === ("CANCELLED" as OrderStatus));
  const inTransit = orders.filter(
    (o) => (o.status as string) === "IN_TRANSIT" || (o.status as string) === "SHIPPED"
  );

  const deliveryRate =
    orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0;
  const rtoRate =
    orders.length > 0 ? Math.round((rto.length / orders.length) * 100) : 0;

  // daily trend
  const trendMap = new Map<string, { delivered: number; rto: number; total: number }>();
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const cur = trendMap.get(day) ?? { delivered: 0, rto: 0, total: 0 };
    cur.total++;
    if (o.status === "DELIVERED") cur.delivered++;
    if (o.status === "CANCELLED") cur.rto++;
    trendMap.set(day, cur);
  }
  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  // product distribution
  const productMap = new Map<string, { orders: number; units: number; delivered: number; rto: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const cur = productMap.get(item.name) ?? { orders: 0, units: 0, delivered: 0, rto: 0 };
      cur.orders++;
      cur.units += item.quantity;
      if (o.status === "DELIVERED") cur.delivered++;
      if (o.status === "CANCELLED") cur.rto++;
      productMap.set(item.name, cur);
    }
  }

  // find SKU per product name (take first item's sku)
  const skuMap = new Map<string, string>();
  for (const o of orders) {
    for (const item of o.items) {
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

  return NextResponse.json({
    mode: "delivered",
    totalOrders: orders.length,
    deliveryRate,
    rtoRate,
    inTransit: inTransit.length,
    deliveredCount: delivered.length,
    rtoCount: rto.length,
    trend,
    topProducts,
    productDistribution,
    store,
  });
}
