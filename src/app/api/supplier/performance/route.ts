import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supplierId = session.user.id;

  const orders = await prisma.order.findMany({
    where: { supplierId },
    select: {
      id: true,
      status: true,
      supplierStatus: true,
      totalAmount: true,
      createdAt: true,
      dispatchedAt: true,
      updatedAt: true,
    },
  });

  const total = orders.length;
  const assigned = orders.filter((o) =>
    o.supplierStatus && o.supplierStatus !== "PENDING_ASSIGNMENT"
  ).length;
  const accepted = orders.filter(
    (o) => o.supplierStatus === "ACCEPTED" || o.supplierStatus === "PROCESSING" ||
           o.supplierStatus === "PACKED" || o.supplierStatus === "READY_TO_SHIP" ||
           o.supplierStatus === "DISPATCHED"
  ).length;
  const rejected = orders.filter((o) => o.supplierStatus === "REJECTED").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const rto = orders.filter((o) => o.status === "RTO").length;
  const dispatched = orders.filter((o) => o.supplierStatus === "DISPATCHED").length;

  const acceptanceRate = assigned > 0 ? Math.round((accepted / assigned) * 100) : 0;
  const cancellationRate = accepted > 0 ? Math.round((cancelled / accepted) * 100) : 0;
  const rtoRate = delivered + rto > 0 ? Math.round((rto / (delivered + rto)) * 100) : 0;

  // Average dispatch time (hours from createdAt to dispatchedAt)
  const dispatchedOrders = orders.filter((o) => o.dispatchedAt);
  const avgDispatchHours =
    dispatchedOrders.length > 0
      ? Math.round(
          dispatchedOrders.reduce((acc, o) => {
            const hrs =
              (new Date(o.dispatchedAt!).getTime() - new Date(o.createdAt).getTime()) /
              3600000;
            return acc + hrs;
          }, 0) / dispatchedOrders.length
        )
      : null;

  const revenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Quality score: simple composite (acceptance rate * 0.3 + 1-rto * 0.3 + 1-cancel * 0.2 + dispatch speed * 0.2)
  const dispatchScore =
    avgDispatchHours !== null
      ? Math.max(0, 100 - Math.min(100, avgDispatchHours / 0.48))
      : 50;
  const qualityScore = Math.round(
    acceptanceRate * 0.3 +
    (100 - rtoRate) * 0.3 +
    (100 - cancellationRate) * 0.2 +
    dispatchScore * 0.2
  );

  return NextResponse.json({
    total,
    accepted,
    rejected,
    dispatched,
    delivered,
    cancelled,
    rto,
    acceptanceRate,
    cancellationRate,
    rtoRate,
    avgDispatchHours,
    revenue,
    qualityScore,
    preferredBadge: qualityScore >= 85 && total >= 10,
  });
}
