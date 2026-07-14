import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateSettlement } from "@/lib/settlement-service";

const VALID_STATUSES = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status, orderDate } = await req.json();
  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as never,
      ...(orderDate ? { createdAt: new Date(orderDate) } : {}),
    },
  });

  // Auto-generate settlement when order is delivered
  if (status === "DELIVERED") {
    try {
      await generateSettlement(orderId);
    } catch (err) {
      // Log but don't fail the status update
      console.error(`Settlement generation failed for ${orderId}:`, err);
    }
  }

  return NextResponse.json({ success: true });
}
