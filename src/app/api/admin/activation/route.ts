import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ActivationStage } from "@prisma/client";
import { ensureSellerActivation, updateActivation } from "@/lib/activation/engine";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // "inactive" | "blocked" | "activated"
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit  = 25;

  // Stall threshold: 7 days ago
  const stallDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const where = filter === "inactive"
    ? { lastActivityAt: { lt: stallDate }, currentStage: { not: ActivationStage.ACTIVATED } }
    : filter === "blocked"
    ? { activationPct: { lt: 40 }, currentStage: { not: ActivationStage.ACTIVATED } }
    : filter === "activated"
    ? { currentStage: ActivationStage.ACTIVATED }
    : {};

  const [activations, total] = await Promise.all([
    prisma.sellerActivation.findMany({
      where,
      include: { seller: { select: { id: true, name: true, email: true, createdAt: true, kycStatus: true, accountStatus: true } } },
      orderBy: [{ activationPct: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.sellerActivation.count({ where }),
  ]);

  // Funnel — count by stage
  const funnelRaw = await prisma.sellerActivation.groupBy({
    by: ["currentStage"],
    _count: true,
  });
  const funnel: Record<string, number> = {};
  for (const row of funnelRaw) funnel[row.currentStage] = row._count;

  // Summary KPIs
  const [totalSellers, totalActivated, avgPct, avgActivationHours] = await Promise.all([
    prisma.sellerActivation.count(),
    prisma.sellerActivation.count({ where: { currentStage: ActivationStage.ACTIVATED } }),
    prisma.sellerActivation.aggregate({ _avg: { activationPct: true } }),
    prisma.sellerActivation.findMany({
      where:  { activatedAt: { not: null } },
      select: { createdAt: true, activatedAt: true },
      take:   100,
    }).then((rows) => {
      if (rows.length === 0) return null;
      const avgMs = rows.reduce((sum, r) => sum + (r.activatedAt!.getTime() - r.createdAt.getTime()), 0) / rows.length;
      return Math.round(avgMs / 3600000); // hours
    }),
  ]);

  const inactiveSellers = await prisma.sellerActivation.count({
    where: { lastActivityAt: { lt: stallDate }, currentStage: { not: ActivationStage.ACTIVATED } },
  });

  return NextResponse.json({
    activations,
    total,
    page,
    pages:  Math.ceil(total / limit),
    funnel,
    summary: {
      totalSellers,
      totalActivated,
      activationRate: totalSellers > 0 ? Math.round((totalActivated / totalSellers) * 100) : 0,
      avgActivationPct: Math.round(avgPct._avg.activationPct ?? 0),
      avgActivationHours,
      inactiveSellers,
    },
  });
}

// POST /api/admin/activation — seed activation records for all sellers
export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    select: { id: true },
  });

  let seeded = 0;
  for (const seller of sellers) {
    try {
      await ensureSellerActivation(seller.id);
      await updateActivation(seller.id);
      seeded++;
    } catch {}
  }

  return NextResponse.json({ ok: true, seeded });
}
