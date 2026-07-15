import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sellerId = searchParams.get("sellerId") || undefined;
  const tab      = searchParams.get("tab") || "pending"; // pending | actioned | all

  const base = {
    ndrStatus: { not: null as never },
    ...(sellerId ? { sellerId } : {}),
  };

  const where =
    tab === "pending"  ? { ...base, ndrActionTaken: null }         :
    tab === "actioned" ? { ...base, ndrActionTaken: { not: null } } :
    base;

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true, externalOrderId: true, status: true,
        customerName: true, totalAmount: true,
        awbNumber: true, courier: true,
        ndrReason: true, ndrStatus: true, ndrAttempts: true,
        ndrActionTaken: true, updatedAt: true, createdAt: true,
        seller: { select: { id: true, name: true, brandName: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.order.groupBy({
      by: ["ndrActionTaken"],
      where: { ndrStatus: { not: null }, ...(sellerId ? { sellerId } : {}) },
      _count: { id: true },
    }),
  ]);

  const pendingCount  = counts.find(c => c.ndrActionTaken === null)?._count.id  ?? 0;
  const actionedCount = counts.filter(c => c.ndrActionTaken !== null).reduce((s, c) => s + c._count.id, 0);
  const rtoCount      = counts.find(c => c.ndrActionTaken === "RTO")?._count.id ?? 0;
  const reattemptCount = counts.find(c => c.ndrActionTaken === "REATTEMPT")?._count.id ?? 0;

  return NextResponse.json({
    orders,
    stats: { pendingCount, actionedCount, rtoCount, reattemptCount },
  });
}
