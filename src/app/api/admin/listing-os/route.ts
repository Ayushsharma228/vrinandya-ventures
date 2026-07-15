import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureTemplates } from "@/lib/listing/templates";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureTemplates().catch(() => {});

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const platform = searchParams.get("platform") ?? "";

  const where = {
    ...(platform ? { platform: platform as never } : {}),
    ...(search ? {
      listingContent: {
        product: { name: { contains: search, mode: "insensitive" as const } },
      },
    } : {}),
  };

  const [
    listings,
    pendingProducts,
    approvedProducts,
    stats,
  ] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: {
        listingContent: {
          include: { product: { select: { id: true, name: true, sku: true, images: true, supplierId: true } } },
        },
        analytics: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),

    // Products approved by admin but without ListingContent yet
    prisma.product.findMany({
      where:   { status: "APPROVED", listingContent: null },
      select:  { id: true, name: true, sku: true, images: true, category: true, supplierId: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),

    // Products with content — pipeline summary
    prisma.listingContent.count(),

    prisma.marketplaceListing.groupBy({
      by:    ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(stats.map(s => [s.status, s._count.id]));

  return NextResponse.json({
    listings,
    pendingProducts,
    approvedProductsWithContent: approvedProducts,
    summary: {
      totalContent:          await prisma.listingContent.count(),
      draft:                 statusCounts["DRAFT"]                ?? 0,
      contentPending:        statusCounts["CONTENT_PENDING"]      ?? 0,
      inReview:              statusCounts["IN_REVIEW"]            ?? 0,
      awaitingSeller:        statusCounts["AWAITING_SELLER"]      ?? 0,
      awaitingMarketplace:   statusCounts["AWAITING_MARKETPLACE"] ?? 0,
      approved:              statusCounts["APPROVED"]             ?? 0,
      live:                  statusCounts["LIVE"]                 ?? 0,
      rejected:              statusCounts["REJECTED"]             ?? 0,
      optimizationRequired:  statusCounts["OPTIMIZATION_REQUIRED"] ?? 0,
      noContent:             pendingProducts.length,
    },
  });
}
