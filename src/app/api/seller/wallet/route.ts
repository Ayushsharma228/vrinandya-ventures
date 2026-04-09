import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;

  const [orders, store] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId },
      select: { status: true, totalAmount: true, createdAt: true, externalOrderId: true, id: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shopifyStore.findFirst({
      where: { sellerId },
      select: { storeUrl: true },
    }),
  ]);

  const totalOrders = orders.length;
  const confirmed = orders
    .filter((o) => ["DELIVERED", "SHIPPED", "IN_TRANSIT", "PROCESSING"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const rto = orders
    .filter((o) => o.status === "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const netBalance = confirmed - rto;

  return NextResponse.json({
    totalOrders,
    confirmed,
    rto,
    netBalance,
    currentBalance: netBalance,
    totalMargins: 0,
    totalPenalties: 0,
    remitted: 0,
    storeUrl: store?.storeUrl ?? null,
    lastUpdated: new Date().toISOString(),
    orders: orders.map((o) => ({
      id: o.id,
      externalOrderId: o.externalOrderId,
      status: o.status,
      amount: o.totalAmount,
      createdAt: o.createdAt,
    })),
  });
}
