import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_RANK: Record<string, number> = {
  NEW: 0, PROCESSING: 1, SHIPPED: 2, IN_TRANSIT: 3,
  DELIVERED: 4, RTO: 4, CANCELLED: 4,
};

const isRTO = (s: string) => s.includes("rto") || s.includes("reverse");

function mapDelhiveryStatus(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (isRTO(s))                                                   return "RTO";
  if (s.includes("delivered"))                                    return "DELIVERED";
  if (s.includes("transit") || s.includes("out for delivery"))   return "IN_TRANSIT";
  if (s.includes("dispatch") || s.includes("picked"))            return "SHIPPED";
  if (s.includes("cancel"))                                       return "CANCELLED";
  return "";
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  // Fetch all active orders with AWB across all sellers
  const orders = await prisma.order.findMany({
    where: {
      awbNumber: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "RTO"] },
    },
    select: { id: true, awbNumber: true, status: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    if (!order.awbNumber) continue;

    try {
      const res = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${order.awbNumber}&token=${token}`,
        { headers: { Authorization: `Token ${token}`, Accept: "application/json" } }
      );

      if (!res.ok) { skipped++; continue; }

      const data = await res.json();
      const shipment = data.ShipmentData?.[0]?.Shipment;
      if (!shipment) { skipped++; continue; }

      const statusStr = (shipment.Status as { Status?: string } | null)?.Status ?? "";
      const dbStatus = mapDelhiveryStatus(statusStr);
      if (!dbStatus) { skipped++; continue; }

      const currentRank = STATUS_RANK[order.status] ?? 0;
      const newRank     = STATUS_RANK[dbStatus] ?? 0;
      if (dbStatus !== "RTO" && dbStatus !== "CANCELLED" && newRank <= currentRank) {
        skipped++; continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: dbStatus as never },
      });

      updated++;
    } catch {
      skipped++;
    }
  }

  console.log(`[cron] refresh-tracking: updated=${updated} skipped=${skipped} total=${orders.length}`);
  return NextResponse.json({ updated, skipped, total: orders.length });
}
