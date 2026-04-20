import { NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const STATUS_RANK: Record<string, number> = {
  NEW: 0, PROCESSING: 1, SHIPPED: 2, IN_TRANSIT: 3,
  DELIVERED: 4, RTO: 4, CANCELLED: 4,
};

// Covers: "RTO Initiated", "RTO In Transit", "RTO Out for Delivery", "RTO Delivered",
//         "Reverse In Transit", "Reverse Pickup Initiated", "Reverse Pickup"
const isRTOStatus = (s: string) => s.includes("rto") || s.includes("reverse");

function mapDelhiveryStatus(status: string): { dbStatus: string; courier: string } {
  const s = status?.toLowerCase() ?? "";
  const rto = isRTOStatus(s);

  let dbStatus = "";  // empty = unknown, do not change current status
  if (rto)                                                dbStatus = "RTO";
  else if (s.includes("delivered"))                       dbStatus = "DELIVERED";
  else if (s.includes("transit") || s.includes("out for delivery")) dbStatus = "IN_TRANSIT";
  else if (s.includes("dispatch") || s.includes("picked")) dbStatus = "SHIPPED";
  else if (s.includes("cancel"))                          dbStatus = "CANCELLED";
  // "Manifested", "Pickup Pending", etc. → empty → keep current status

  const courier = rto ? "Delhivery (RTO)" : "Delhivery";
  return { dbStatus, courier };
}

export async function POST(req: NextRequest)() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id, awbNumber: null },
    select: { id: true, externalOrderId: true, totalAmount: true, status: true, customerAddress: true },
  });

  let synced = 0;
  const notFound: string[] = [];
  const apiErrors: string[] = [];

  for (const order of orders) {
    const addr = order.customerAddress as { phone?: string } | null;
    const rawPhone = addr?.phone?.replace(/\D/g, "") ?? "";
    const phone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
    if (!phone || phone.length < 10) continue;

    try {
      const res = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?phone=${phone}&token=${token}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        apiErrors.push(`${order.externalOrderId}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const shipments: Array<{ Shipment: Record<string, unknown> }> = data.ShipmentData ?? [];

      if (!shipments.length) {
        notFound.push(order.externalOrderId);
        continue;
      }

      // Match by reference number (Shopify order name or numeric ID)
      const orderName = order.externalOrderId.replace("#", "");
      let matched = shipments.find((s) => {
        const ref = String(s.Shipment.ReferenceNo ?? "");
        return (
          ref === order.externalOrderId ||
          ref === orderName ||
          ref.includes(orderName)
        );
      });

      // Fallback: match by amount
      if (!matched) {
        matched = shipments.find(
          (s) => Math.abs(Number(s.Shipment.GrossAmount) - order.totalAmount) < 1
        );
      }

      // Last resort: take the most recent shipment
      if (!matched && shipments.length === 1) {
        matched = shipments[0];
      }

      if (!matched) {
        notFound.push(order.externalOrderId);
        continue;
      }

      const shipment = matched.Shipment;
      const awb = String(shipment.Waybill ?? shipment.AWB ?? "").trim();
      if (!awb) continue;

      const statusStr = (shipment.Status as { Status?: string } | null)?.Status ?? "";
      const { dbStatus, courier } = mapDelhiveryStatus(statusStr);

      // Determine the status to save — never downgrade
      const currentRank = STATUS_RANK[order.status] ?? 0;
      const newRank     = STATUS_RANK[dbStatus] ?? 0;
      const canUpdate   = dbStatus && (dbStatus === "RTO" || dbStatus === "CANCELLED" || newRank > currentRank);
      const finalStatus = canUpdate ? dbStatus : order.status;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          awbNumber: awb,
          status: finalStatus as never,
          courier,
          trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
        },
      });

      synced++;
    } catch (e) {
      apiErrors.push(`${order.externalOrderId}: ${String(e)}`);
    }
  }

  return NextResponse.json({ synced, notFound, apiErrors });
}
