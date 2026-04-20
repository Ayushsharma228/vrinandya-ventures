import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const dateWhere = from && to ? {
    createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59.999Z") },
  } : {};

  const orders = await prisma.order.findMany({
    where: dateWhere,
    select: { status: true, totalAmount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const trendMap = new Map<string, { total: number; delivered: number; rto: number; cancelled: number }>();
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const cur = trendMap.get(day) ?? { total: 0, delivered: 0, rto: 0, cancelled: 0 };
    cur.total++;
    if (o.status === "DELIVERED") cur.delivered++;
    if (o.status === "RTO")       cur.rto++;
    if (o.status === "CANCELLED") cur.cancelled++;
    trendMap.set(day, cur);
  }

  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);

  return NextResponse.json({ trend, totalRevenue, totalOrders: orders.length });
}
