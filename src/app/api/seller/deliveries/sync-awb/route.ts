import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function mapDelhiveryStatus(status: string): { dbStatus: string; courier: string } {
  const s = status?.toLowerCase() ?? "";
  const isRTO = s.includes("rto");

  let dbStatus = "SHIPPED";
  if (s.includes("delivered")) dbStatus = "DELIVERED";
  else if (s.includes("transit") || s.includes("out for delivery")) dbStatus = "IN_TRANSIT";
  else if (s.includes("dispatch") || s.includes("picked")) dbStatus = "SHIPPED";
  else if (s.includes("cancel")) dbStatus = "CANCELLED";

  const courier = isRTO ? "Delhivery (RTO)" : "Delhivery";
  return { dbStatus, courier };
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id, awbNumber: null },
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

      await prisma.order.update({
        where: { id: order.id },
        data: {
          awbNumber: awb,
          status: dbStatus as never,
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
