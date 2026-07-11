import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const supplierId = req.nextUrl.searchParams.get("supplierId");
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = 30;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const [pos, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true } },
        seller: { select: { id: true, name: true, email: true } },
        order: {
          select: {
            id: true, externalOrderId: true, source: true, status: true,
            totalAmount: true, customerName: true, createdAt: true,
          },
        },
        items: true,
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return NextResponse.json({ pos, total, page, pages: Math.ceil(total / limit) });
}
