import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = 25;

  const where: Record<string, unknown> = { supplierId: session.user.id };
  if (status) where.status = status;

  const [pos, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        seller: { select: { name: true } },
        order: {
          select: {
            id: true, externalOrderId: true, source: true,
            customerName: true, totalAmount: true, status: true, createdAt: true,
          },
        },
        items: true,
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return NextResponse.json({ pos, total, page, pages: Math.ceil(total / limit) });
}
