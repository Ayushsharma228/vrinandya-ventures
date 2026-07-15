import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    statusCounts,
    avgOptScore,
    avgListingTime,
    totalRejections,
    platformBreakdown,
    recentListings,
  ] = await Promise.all([
    prisma.marketplaceListing.groupBy({
      by:    ["status"],
      _count: { id: true },
    }),

    prisma.listingAnalytics.aggregate({
      _avg: { optimizationScore: true },
    }),

    prisma.listingAnalytics.aggregate({
      _avg:   { listingTimeHours: true },
      where:  { listingTimeHours: { not: null } },
    }),

    prisma.listingAnalytics.aggregate({
      _sum: { rejectionCount: true },
    }),

    prisma.marketplaceListing.groupBy({
      by:    ["platform", "status"],
      _count: { id: true },
    }),

    prisma.marketplaceListing.findMany({
      where:   { status: { in: ["LIVE", "APPROVED"] } },
      include: {
        listingContent: {
          select: { product: { select: { name: true } } },
        },
        analytics: true,
      },
      orderBy: { liveAt: "desc" },
      take:    20,
    }),
  ]);

  const total = statusCounts.reduce((s, g) => s + g._count.id, 0);
  const liveCount = statusCounts.find(g => g.status === "LIVE")?._count.id ?? 0;
  const approvalRate = total > 0 ? Math.round((liveCount / total) * 100) : 0;

  return NextResponse.json({
    kpis: {
      totalListings:       total,
      liveListings:        liveCount,
      approvalRate,
      avgOptimizationScore: Math.round(avgOptScore._avg.optimizationScore ?? 0),
      avgListingTimeHours:  Math.round((avgListingTime._avg.listingTimeHours ?? 0) * 10) / 10,
      totalRejections:     totalRejections._sum.rejectionCount ?? 0,
    },
    statusBreakdown: statusCounts,
    platformBreakdown,
    recentListings,
  });
}
