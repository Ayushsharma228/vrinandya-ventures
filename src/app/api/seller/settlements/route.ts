import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const where = {
    sellerId: session.user.id,
    ...(status ? { status: status as never } : {}),
  };

  const [settlements, total, agg, upcomingAgg, pipelineAgg, nextPayout] = await Promise.all([
    prisma.settlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.settlement.count({ where }),
    prisma.settlement.aggregate({
      where,
      _sum: {
        sellingPrice: true, platformFee: true, gstOnFees: true,
        netPayable: true, shippingCharge: true, packingCharge: true,
        codFee: true, adSpend: true, marketplaceFee: true,
        grossProfit: true, netProfit: true,
      },
    }),
    // Upcoming payout = SETTLED status (approved, not yet hit wallet)
    prisma.settlement.aggregate({
      where: { sellerId: session.user.id, status: "SETTLED" as never },
      _sum:   { netPayable: true },
      _count: { id: true },
    }),
    // In pipeline = PENDING + PROCESSING
    prisma.settlement.aggregate({
      where: { sellerId: session.user.id, status: { in: ["PENDING", "PROCESSING"] as never[] } },
      _sum:   { netPayable: true },
      _count: { id: true },
    }),
    // Nearest upcoming remittance date from wallet
    prisma.walletTransaction.findFirst({
      where: {
        sellerId: session.user.id,
        remittanceDate: { gte: new Date() },
      },
      orderBy: { remittanceDate: "asc" },
      select: { remittanceDate: true, amount: true },
    }),
  ]);

  // Batch-fetch order details — also apply search filter client-side on fetched orders
  const orderIds = settlements.map(s => s.orderId).filter(Boolean);
  const orders = orderIds.length > 0
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, externalOrderId: true, customerName: true, source: true, createdAt: true },
      })
    : [];
  const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));

  let settlementsWithOrder = settlements.map(s => ({
    ...s,
    order: orderMap[s.orderId] ?? null,
  }));

  // Client-side search on current page (order ID or customer name)
  if (search) {
    const q = search.toLowerCase();
    settlementsWithOrder = settlementsWithOrder.filter(s =>
      s.order?.externalOrderId?.toLowerCase().includes(q) ||
      s.order?.customerName?.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    settlements: settlementsWithOrder,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: {
      grossRevenue:   agg._sum.sellingPrice   ?? 0,
      platformFee:    agg._sum.platformFee    ?? 0,
      gstOnFees:      agg._sum.gstOnFees      ?? 0,
      netPayable:     agg._sum.netPayable     ?? 0,
      shippingCharge: agg._sum.shippingCharge ?? 0,
      packingCharge:  agg._sum.packingCharge  ?? 0,
      codFee:         agg._sum.codFee         ?? 0,
      adSpend:        agg._sum.adSpend        ?? 0,
      marketplaceFee: agg._sum.marketplaceFee ?? 0,
      grossProfit:    agg._sum.grossProfit    ?? 0,
      netProfit:      agg._sum.netProfit      ?? 0,
    },
    upcomingPayout: {
      amount: upcomingAgg._sum.netPayable ?? 0,
      count:  upcomingAgg._count.id       ?? 0,
      nextDate: nextPayout?.remittanceDate ?? null,
    },
    inPipeline: {
      amount: pipelineAgg._sum.netPayable ?? 0,
      count:  pipelineAgg._count.id       ?? 0,
    },
  });
}
