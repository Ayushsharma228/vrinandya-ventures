import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, awb, status } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const isCancelled = status === "CANCELLED";
  if (!isCancelled && !awb) {
    return NextResponse.json({ error: "Order ID and AWB required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await prisma.order.update({
    where: { id: orderId },
    data: isCancelled
      ? { status: "CANCELLED" as never }
      : {
          awbNumber: awb.trim(),
          courier: "Delhivery",
          trackingUrl: `https://www.delhivery.com/track/package/${awb.trim()}`,
          status: (status ?? "SHIPPED") as never,
        },
  });

  return NextResponse.json({ success: true });
}
