import { NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest)() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      sellerId: session.user.id,
      ndrStatus: { not: null },
      ndrActionTaken: null, // not yet acted on
    },
    select: {
      id: true, externalOrderId: true, customerName: true,
      customerAddress: true, totalAmount: true, awbNumber: true,
      trackingUrl: true, ndrReason: true, ndrStatus: true,
      ndrAttempts: true, ndrActionTaken: true, createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const actioned = await prisma.order.findMany({
    where: {
      sellerId: session.user.id,
      ndrStatus: { not: null },
      ndrActionTaken: { not: null },
    },
    select: {
      id: true, externalOrderId: true, customerName: true,
      awbNumber: true, ndrReason: true, ndrActionTaken: true,
      ndrAttempts: true, createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ pending: orders, actioned });
}
