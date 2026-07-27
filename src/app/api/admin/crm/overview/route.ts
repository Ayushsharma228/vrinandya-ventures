import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SalesStage } from "@prisma/client";

const CONVERTED: SalesStage[] = ["PAID", "ONBOARDED", "WEBSITE_DONE", "ENGAGEMENT_LIVE", "ADS_LIVE"] as SalesStage[];
const QUALIFIED: SalesStage[] = ["WILL_PAY", "PAID", "ONBOARDED", "WEBSITE_DONE", "ENGAGEMENT_LIVE", "ADS_LIVE", "PROSPECT", "INTERESTED"] as SalesStage[];
const LOST: SalesStage[] = ["NOT_INTERESTED"] as SalesStage[];

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now      = new Date();
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const heatmapStart   = new Date(todayStart);
  heatmapStart.setDate(heatmapStart.getDate() - 83); // 84 days incl. today

  const [
    totalLeads,
    thisMonthLeads,
    lastMonthLeads,
    qualifiedLeads,
    convertedLeads,
    overdueFollowUps,
    byStageRaw,
    bySourceRaw,
    recentLeadsRaw,
    repGroupRaw,
    activityRaw,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.lead.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.lead.count({ where: { stage: { in: QUALIFIED } } }),
    prisma.lead.count({ where: { stage: { in: CONVERTED } } }),
    prisma.lead.count({ where: {
      followUpDate: { lt: todayStart },
      stage: { notIn: [...CONVERTED, ...LOST] },
    }}),
    prisma.lead.groupBy({ by: ["stage"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.lead.groupBy({ by: ["source"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, name: true, stage: true, source: true, createdAt: true,
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.lead.groupBy({
      by: ["assignedToId"],
      where: { assignedToId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: heatmapStart } },
      select: { createdAt: true },
    }),
  ]);

  // ── Activity heatmap (84 day cells) ─────────────────────────────────────
  const activityMap = new Map<string, number>();
  for (const l of activityRaw) {
    const date = l.createdAt.toISOString().slice(0, 10);
    activityMap.set(date, (activityMap.get(date) ?? 0) + 1);
  }
  const activityCells: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    activityCells.push({ date, count: activityMap.get(date) ?? 0 });
  }

  // ── Top reps (enrich with names + won counts) ────────────────────────────
  const repIds = repGroupRaw.map(r => r.assignedToId!);
  const [repUsers, repWon] = repIds.length > 0
    ? await Promise.all([
        prisma.user.findMany({
          where: { id: { in: repIds } },
          select: { id: true, name: true, salesTitle: true },
        }),
        prisma.lead.groupBy({
          by: ["assignedToId"],
          where: { assignedToId: { in: repIds }, stage: { in: CONVERTED } },
          _count: { id: true },
        }),
      ])
    : [[], [] as { assignedToId: string | null; _count: { id: number } }[]];

  const repUserMap = Object.fromEntries(repUsers.map(u => [u.id, u]));
  const repWonMap  = Object.fromEntries(repWon.map(r => [r.assignedToId!, r._count.id]));

  const topReps = repGroupRaw.map(r => {
    const id   = r.assignedToId!;
    const total = r._count.id;
    const won   = repWonMap[id] ?? 0;
    return {
      id,
      name:  repUserMap[id]?.name  ?? "Unknown",
      title: repUserMap[id]?.salesTitle ?? null,
      total,
      won,
      rate:  total > 0 ? Math.round((won / total) * 100) : 0,
    };
  }).sort((a, b) => b.won - a.won);

  return NextResponse.json({
    totalLeads,
    thisMonthLeads,
    lastMonthLeads,
    qualifiedLeads,
    convertedLeads,
    overdueFollowUps,
    byStage:     byStageRaw.map(r => ({ stage: r.stage as string, count: r._count.id })),
    bySource:    bySourceRaw.map(r => ({ source: r.source, count: r._count.id })),
    activityCells,
    topReps,
    recentLeads: recentLeadsRaw.map(l => ({
      id:         l.id,
      name:       l.name,
      stage:      l.stage as string,
      source:     l.source,
      createdAt:  l.createdAt.toISOString(),
      assignedTo: l.assignedTo?.name ?? null,
    })),
  });
}
