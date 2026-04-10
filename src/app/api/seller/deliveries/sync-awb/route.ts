import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function mapDelhiveryStatus(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("deliver")) return "DELIVERED";
  if (s.includes("transit") || s.includes("out for")) return "IN_TRANSIT";
  if (s.includes("dispatch") || s.includes("picked")) return "SHIPPED";
  if (s.includes("cancel") || s.includes("rto")) return "CANCELLED";
  return "SHIPPED";
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  // Get orders without AWB that have a phone number
  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id, awbNumber: null },
  });

  let synced = 0;
  const errors: string[] = [];

  for (const order of orders) {
    const addr = order.customerAddress as { phone?: string } | null;
    const phone = addr?.phone?.replace(/\D/g, "").slice(-10); // last 10 digits
    if (!phone) continue;

    try {
      const res = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?phone=${phone}&token=${token}`,
        { headers: { "Accept": "application/json" } }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const shipments: Array<{ Shipment: Record<string, unknown> }> = data.ShipmentData ?? [];
      if (!shipments.length) continue;

      // Match by order ID or amount
      let matched = shipments.find(
        (s) =>
          String(s.Shipment.ReferenceNo) === order.externalOrderId ||
          String(s.Shipment.ReferenceNo).includes(order.externalOrderId.replace("#", ""))
      );

      // Fallback: match by amount
      if (!matched) {
        matched = shipments.find(
          (s) => Number(s.Shipment.GrossAmount) === order.totalAmount
        );
      }

      if (!matched) continue;

      const shipment = matched.Shipment;
      const awb = String(shipment.Waybill ?? shipment.AWB ?? "");
      const statusStr = (shipment.Status as { Status?: string } | null)?.Status ?? "";
      const status = mapDelhiveryStatus(statusStr);

      if (!awb) continue;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          awbNumber: awb,
          status: status as never,
          courier: "Delhivery",
          trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
        },
      });

      synced++;
    } catch {
      errors.push(order.externalOrderId);
    }
  }

  return NextResponse.json({ synced, errors });
}
