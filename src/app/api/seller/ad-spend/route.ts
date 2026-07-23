import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  // Default: last 30 days if no range specified
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const where: { sellerId: string; date?: { gte?: Date; lte?: Date } } = {
    sellerId: session.user.id,
    date: {
      gte: from ? new Date(from) : defaultFrom,
      ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
    },
  };

  const entries = await prisma.adSpend.findMany({ where, orderBy: { date: "desc" } });
  const total   = entries.reduce((sum, e) => sum + e.amount, 0);

  // Last 30 days revenue (to calculate ROAS over same window)
  const revenueFrom = from ? new Date(from) : defaultFrom;
  const revenueOrders = await prisma.order.aggregate({
    where: {
      sellerId: session.user.id,
      createdAt: { gte: revenueFrom },
      status: { notIn: ["CANCELLED", "RTO"] },
    },
    _sum: { totalAmount: true },
  });
  const last30DaysRevenue = revenueOrders._sum.totalAmount ?? 0;

  // Also return connection status
  const seller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaAdAccountId: true, metaTokenExpiresAt: true },
  });
  const metaConnected = !!(seller?.metaAdAccountId && seller?.metaTokenExpiresAt && seller.metaTokenExpiresAt > new Date());

  return NextResponse.json({ total, entries, metaConnected, last30DaysRevenue });
}
