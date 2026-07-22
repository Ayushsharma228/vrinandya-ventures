import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCarrierTrackingUrl } from "@/lib/shipping-adapters";

interface AwbRow {
  externalOrderId: string;
  awbNumber: string;
  courier?: string;
  markShipped?: boolean;
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await req.json() as { rows: AwbRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows required" }, { status: 400 });
  }

  const externalIds = rows.map((r) => r.externalOrderId.trim()).filter(Boolean);

  const orders = await prisma.order.findMany({
    where: { externalOrderId: { in: externalIds } },
    select: { id: true, externalOrderId: true, status: true },
  });

  const orderMap = Object.fromEntries(orders.map((o) => [o.externalOrderId, o]));

  let updated = 0;
  const notFound: string[] = [];

  for (const row of rows) {
    const eid = row.externalOrderId.trim();
    const awb = row.awbNumber.trim();
    if (!eid || !awb) continue;

    const order = orderMap[eid];
    if (!order) { notFound.push(eid); continue; }

    const courier = row.courier?.trim() || "Delhivery";
    const shouldShip = row.markShipped ?? true;
    const newStatus =
      shouldShip && !["DELIVERED", "CANCELLED", "RTO"].includes(order.status)
        ? "SHIPPED"
        : order.status;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        awbNumber:   awb,
        courier,
        trackingUrl: getCarrierTrackingUrl(courier, awb) || null,
        status:      newStatus as never,
      },
    });

    // Timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId:   order.id,
        actorRole: "ADMIN",
        actorId:   session.user.id,
        event:     "AWB_ASSIGNED",
        details:   `AWB ${awb} assigned via bulk import. Courier: ${courier}.${shouldShip ? " Status → SHIPPED." : ""}`,
      },
    });

    updated++;
  }

  return NextResponse.json({ updated, notFound, total: rows.length });
}
