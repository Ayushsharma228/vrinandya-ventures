import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function mapDelhiveryStatus(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("rto")) return "RTO";
  if (s.includes("delivered")) return "DELIVERED";
  if (s.includes("transit") || s.includes("out for delivery")) return "IN_TRANSIT";
  if (s.includes("cancel")) return "CANCELLED";
  return "SHIPPED";
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const orders = await prisma.order.findMany({
    where: {
      sellerId: session.user.id,
      awbNumber: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "RTO"] },
    },
    select: { id: true, awbNumber: true },
  });

  let updated = 0;

  for (const order of orders) {
    if (!order.awbNumber) continue;

    try {
      const res = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${order.awbNumber}&token=${token}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const shipment = data.ShipmentData?.[0]?.Shipment;
      if (!shipment) continue;

      const statusStr = (shipment.Status as { Status?: string } | null)?.Status ?? "";
      const dbStatus = mapDelhiveryStatus(statusStr);

      await prisma.order.update({
        where: { id: order.id },
        data: { status: dbStatus as never },
      });

      updated++;
    } catch {
      // skip
    }
  }

  return NextResponse.json({ updated });
}
