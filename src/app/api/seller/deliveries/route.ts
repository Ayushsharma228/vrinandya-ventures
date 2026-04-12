import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const sellerId = session.user.id;

  const allDeliveryStatuses: OrderStatus[] = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];
  const statusFilter: OrderStatus[] =
    status && status !== "ALL"
      ? [status as OrderStatus]
      : allDeliveryStatuses;

  const where: Record<string, unknown> = {
    sellerId,
    status: { in: statusFilter },
    ...(search
      ? {
          OR: [
            { externalOrderId: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      externalOrderId: true,
      status: true,
      awbNumber: true,
      trackingUrl: true,
      createdAt: true,
      customerName: true,
      customerEmail: true,
      customerAddress: true,
      courier: true,
    },
  });

  const allOrders = await prisma.order.findMany({
    where: { sellerId, status: { in: allDeliveryStatuses } },
    select: { status: true },
  });

  const stats = {
    pending:   allOrders.filter((o) => o.status === "NEW" || o.status === "PROCESSING").length,
    inTransit: allOrders.filter((o) => o.status === "IN_TRANSIT" || o.status === "SHIPPED").length,
    delivered: allOrders.filter((o) => o.status === "DELIVERED").length,
    rto:       allOrders.filter((o) => o.status === "RTO").length,
    cancelled: allOrders.filter((o) => o.status === "CANCELLED").length,
  };

  return NextResponse.json({ orders, stats });
}
