import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const dateFilter = {
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      },
    } : {}),
  };

  const [settlementAgg, orderCounts, supplierPaymentAgg, pendingPayments] = await Promise.all([
    prisma.settlement.aggregate({
      where: { ...dateFilter },
      _sum: {
        sellingPrice:     true,
        platformFee:      true,
        gstOnFees:        true,
        netPayable:       true,
        supplierPayable:  true,
        platformEarnings: true,
        shippingCharge:   true,
        packingCharge:    true,
        codFee:           true,
        adSpend:          true,
        marketplaceFee:   true,
        grossProfit:      true,
        netProfit:        true,
      },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: dateFilter,
      _count: { id: true },
    }),
    prisma.supplierPayment.aggregate({
      where: { ...dateFilter },
      _sum:  { amount: true },
      _count: { id: true },
    }),
    prisma.supplierPayment.aggregate({
      where: { ...dateFilter, status: "PENDING" },
      _sum:  { amount: true },
      _count: { id: true },
    }),
  ]);

  const orderCountMap: Record<string, number> = {};
  for (const g of orderCounts) orderCountMap[g.status] = g._count.id;

  return NextResponse.json({
    period: { from: from ?? null, to: to ?? null },
    settlements: {
      count:            settlementAgg._count.id,
      grossRevenue:     settlementAgg._sum.sellingPrice     ?? 0,
      platformFee:      settlementAgg._sum.platformFee      ?? 0,
      gstOnFees:        settlementAgg._sum.gstOnFees        ?? 0,
      netPayable:       settlementAgg._sum.netPayable       ?? 0,
      supplierPayable:  settlementAgg._sum.supplierPayable  ?? 0,
      platformEarnings: settlementAgg._sum.platformEarnings ?? 0,
      shippingCharge:   settlementAgg._sum.shippingCharge   ?? 0,
      packingCharge:    settlementAgg._sum.packingCharge    ?? 0,
      codFee:           settlementAgg._sum.codFee           ?? 0,
      adSpend:          settlementAgg._sum.adSpend          ?? 0,
      marketplaceFee:   settlementAgg._sum.marketplaceFee   ?? 0,
      grossProfit:      settlementAgg._sum.grossProfit      ?? 0,
      netProfit:        settlementAgg._sum.netProfit        ?? 0,
    },
    orders: orderCountMap,
    supplierPayments: {
      total:         supplierPaymentAgg._sum.amount  ?? 0,
      count:         supplierPaymentAgg._count.id,
      pendingAmount: pendingPayments._sum.amount    ?? 0,
      pendingCount:  pendingPayments._count.id,
    },
  });
}
