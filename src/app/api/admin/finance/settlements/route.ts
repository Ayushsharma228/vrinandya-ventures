import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get("page")     ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit")  ?? "50"));
  const status     = searchParams.get("status")   ?? "";
  const sellerId   = searchParams.get("sellerId") ?? "";
  const marketplace= searchParams.get("marketplace") ?? "";

  const where = {
    ...(status      ? { status: status as never }         : {}),
    ...(sellerId    ? { sellerId }                         : {}),
    ...(marketplace ? { marketplace }                      : {}),
  };

  const [settlements, total, agg] = await Promise.all([
    prisma.settlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        seller: { select: { id: true, name: true, email: true, brandName: true } },
      },
    }),
    prisma.settlement.count({ where }),
    prisma.settlement.aggregate({
      where,
      _sum: {
        sellingPrice:     true,
        platformFee:      true,
        netPayable:       true,
        supplierPayable:  true,
        platformEarnings: true,
        gstOnFees:        true,
      },
    }),
  ]);

  return NextResponse.json({
    settlements,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: {
      grossRevenue:     agg._sum.sellingPrice     ?? 0,
      totalPlatformFee: agg._sum.platformFee      ?? 0,
      totalNetPayable:  agg._sum.netPayable       ?? 0,
      totalSupplierPayable: agg._sum.supplierPayable ?? 0,
      platformEarnings: agg._sum.platformEarnings ?? 0,
      totalGst:         agg._sum.gstOnFees        ?? 0,
    },
  });
}
