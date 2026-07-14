import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const dateWhere = (from || to) ? {
    createdAt: {
      ...(from ? { gte: new Date(from) }                       : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") }     : {}),
    },
  } : {};

  // ── Parallel queries ─────────────────────────────────────────────────────
  const [orders, settlements, sellerRows, supplierPaymentAgg] = await Promise.all([
    prisma.order.findMany({
      where: dateWhere,
      select: { status: true, totalAmount: true, createdAt: true, sellerId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.settlement.findMany({
      where: dateWhere,
      select: {
        status: true, sellingPrice: true, platformFee: true, gstOnFees: true,
        netPayable: true, supplierPayable: true, platformEarnings: true,
        sellerId: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Top sellers by GMV (from orders)
    prisma.order.groupBy({
      by:      ["sellerId"],
      where:   dateWhere,
      _count:  { id: true },
      _sum:    { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take:    10,
    }),
    prisma.supplierPayment.aggregate({
      where:  dateWhere,
      _sum:   { amount: true },
      _count: { id: true },
    }),
  ]);

  // ── Order trend (daily) ──────────────────────────────────────────────────
  const orderTrendMap = new Map<string, { total: number; delivered: number; rto: number; cancelled: number; revenue: number }>();
  let totalRevenue = 0;
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const cur = orderTrendMap.get(day) ?? { total: 0, delivered: 0, rto: 0, cancelled: 0, revenue: 0 };
    cur.total++;
    cur.revenue += o.totalAmount;
    totalRevenue += o.totalAmount;
    if (o.status === "DELIVERED")  cur.delivered++;
    if (o.status === "RTO")        cur.rto++;
    if (o.status === "CANCELLED")  cur.cancelled++;
    orderTrendMap.set(day, cur);
  }
  const orderTrend = Array.from(orderTrendMap.entries()).map(([date, v]) => ({ date, ...v }));

  // ── Settlement aggregates ─────────────────────────────────────────────────
  const settlementTrendMap = new Map<string, { count: number; grossRevenue: number; platformEarnings: number; netPayable: number }>();
  let sGross = 0, sFee = 0, sGst = 0, sNet = 0, sSupplier = 0, sPlatformEarnings = 0;
  const byStatus: Record<string, number> = {};

  for (const s of settlements) {
    sGross            += s.sellingPrice;
    sFee              += s.platformFee;
    sGst              += s.gstOnFees;
    sNet              += s.netPayable;
    sSupplier         += s.supplierPayable ?? 0;
    sPlatformEarnings += s.platformEarnings ?? 0;
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;

    const day = s.createdAt.toISOString().slice(0, 10);
    const cur = settlementTrendMap.get(day) ?? { count: 0, grossRevenue: 0, platformEarnings: 0, netPayable: 0 };
    cur.count++;
    cur.grossRevenue    += s.sellingPrice;
    cur.platformEarnings += (s.platformEarnings ?? 0);
    cur.netPayable      += s.netPayable;
    settlementTrendMap.set(day, cur);
  }
  const settlementTrend = Array.from(settlementTrendMap.entries()).map(([date, v]) => ({ date, ...v }));

  // ── Settlement funnel (all-time totals by status) ─────────────────────────
  const funnelAll = await prisma.settlement.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const funnel = Object.fromEntries(funnelAll.map(f => [f.status, f._count.id]));

  // ── Top sellers (enrich with names + settlement earnings) ────────────────
  const sellerIds = sellerRows.map(r => r.sellerId);
  const [sellerUsers, sellerSettlements] = await Promise.all([
    sellerIds.length > 0
      ? prisma.user.findMany({
          where:  { id: { in: sellerIds } },
          select: { id: true, name: true, email: true, brandName: true },
        })
      : Promise.resolve([]),
    sellerIds.length > 0
      ? prisma.settlement.groupBy({
          by:    ["sellerId"],
          where: { sellerId: { in: sellerIds }, ...dateWhere },
          _sum:  { sellingPrice: true, platformEarnings: true, netPayable: true },
        })
      : Promise.resolve([]),
  ]);

  const userMap        = Object.fromEntries(sellerUsers.map(u => [u.id, u]));
  const settlementMap2 = Object.fromEntries(sellerSettlements.map(s => [s.sellerId, s._sum]));

  const topSellers = sellerRows.map(row => ({
    id:               row.sellerId,
    name:             userMap[row.sellerId]?.name ?? null,
    email:            userMap[row.sellerId]?.email ?? "",
    brandName:        userMap[row.sellerId]?.brandName ?? null,
    orderCount:       row._count.id,
    gmv:              row._sum.totalAmount ?? 0,
    platformEarnings: settlementMap2[row.sellerId]?.platformEarnings ?? 0,
    netPayable:       settlementMap2[row.sellerId]?.netPayable        ?? 0,
  }));

  // ── Order status counts ──────────────────────────────────────────────────
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    period: { from: from ?? null, to: to ?? null },
    orders: {
      trend:           orderTrend,
      totalOrders:     orders.length,
      deliveredOrders: statusCounts["DELIVERED"]  ?? 0,
      rtoOrders:       statusCounts["RTO"]        ?? 0,
      cancelledOrders: statusCounts["CANCELLED"]  ?? 0,
      activeOrders:    (statusCounts["PROCESSING"] ?? 0) + (statusCounts["SHIPPED"] ?? 0) + (statusCounts["IN_TRANSIT"] ?? 0),
      totalRevenue,
    },
    settlements: {
      count:            settlements.length,
      grossRevenue:     sGross,
      platformFee:      sFee,
      gstOnFees:        sGst,
      netPayable:       sNet,
      supplierPayable:  sSupplier,
      platformEarnings: sPlatformEarnings,
      trend:            settlementTrend,
      byStatus,
      funnel,
    },
    topSellers,
    supplierPayments: {
      totalPaid: supplierPaymentAgg._sum.amount ?? 0,
      count:     supplierPaymentAgg._count.id,
    },
  });
}
