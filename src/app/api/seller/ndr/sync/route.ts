import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Delhivery statuses that indicate NDR
const NDR_KEYWORDS = [
  "undelivered", "delivery attempt", "ndr", "failed delivery",
  "not available", "refused", "wrong address", "out of delivery area",
  "door locked", "customer not contactable", "rescheduled",
];

function isNDR(status: string): boolean {
  const s = status.toLowerCase();
  return NDR_KEYWORDS.some(k => s.includes(k));
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  // Get all active orders with AWB (not terminal status)
  const orders = await prisma.order.findMany({
    where: {
      sellerId: session.user.id,
      awbNumber: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "RTO"] },
    },
    select: { id: true, awbNumber: true, ndrAttempts: true },
  });

  if (orders.length === 0) return NextResponse.json({ found: 0 });

  const waybills = orders.map(o => o.awbNumber).join(",");

  const res = await fetch(
    `https://track.delhivery.com/api/v1/packages/json/?waybill=${waybills}&token=${token}`,
    { headers: { Authorization: `Token ${token}`, Accept: "application/json" } }
  );

  if (!res.ok) return NextResponse.json({ error: "Delhivery API error" }, { status: 400 });

  const data = await res.json();
  const shipments: Array<{ Shipment: Record<string, unknown> }> = data.ShipmentData ?? [];

  let found = 0;

  for (const order of orders) {
    const shipment = shipments.find(s =>
      String(s.Shipment.Waybill ?? s.Shipment.AWB) === order.awbNumber
    )?.Shipment;

    if (!shipment) continue;

    const statusObj = shipment.Status as { Status?: string; Instructions?: string } | null;
    const statusStr = statusObj?.Status ?? "";
    const reason = statusObj?.Instructions ?? statusStr;

    if (!isNDR(statusStr)) continue;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ndrStatus: statusStr,
        ndrReason: reason || "Delivery attempt failed",
        ndrAttempts: (order.ndrAttempts ?? 0) + 1,
      },
    });

    found++;
  }

  return NextResponse.json({ found });
}
