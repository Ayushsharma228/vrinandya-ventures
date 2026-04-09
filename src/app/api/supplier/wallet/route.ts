import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [orders, remittances] = await Promise.all([
      prisma.order.findMany({
        where: {
          items: { some: { product: { supplierId: session.user.id } } },
        },
        include: {
          items: {
            where: { product: { supplierId: session.user.id } },
            include: { product: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.remittance.findMany({
        where: { supplierId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalRemittances = remittances.reduce((sum, r) => sum + r.amount, 0);
    const orderRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
    const walletBalance = orderRevenue - totalRemittances;

    return NextResponse.json({
      orders,
      remittances,
      stats: {
        totalOrders: orders.length,
        delivered: orders.filter((o) => o.status === "DELIVERED").length,
        cancelled: orders.filter((o) => o.status === "CANCELLED").length,
        inTransit: orders.filter((o) => o.status === "IN_TRANSIT").length,
        walletBalance: Math.max(0, walletBalance),
        totalRemittances,
      },
    });
  } catch (error) {
    console.error("Wallet error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
