import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, parseInt(searchParams.get("page")     ?? "1"));
  const limit     = Math.min(100, parseInt(searchParams.get("limit")  ?? "20"));
  const status    = searchParams.get("status")    ?? "";
  const supplierId= searchParams.get("supplierId") ?? "";

  const where = {
    ...(status     ? { status: status as never }  : {}),
    ...(supplierId ? { supplierId }               : {}),
  };

  const [payments, total, pendingAgg, paidAgg] = await Promise.all([
    prisma.supplierPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        order: {
          select: {
            id: true, externalOrderId: true, customerName: true,
            source: true, createdAt: true, status: true,
          },
        },
        supplier: {
          select: { id: true, name: true, email: true, brandName: true },
        },
      },
    }),
    prisma.supplierPayment.count({ where }),
    prisma.supplierPayment.aggregate({
      where: { ...where, status: "PENDING" },
      _sum:  { amount: true },
      _count: { id: true },
    }),
    prisma.supplierPayment.aggregate({
      where: { ...where, status: "PAID" },
      _sum:  { amount: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    payments,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: {
      pendingAmount: pendingAgg._sum.amount ?? 0,
      pendingCount:  pendingAgg._count.id,
      paidAmount:    paidAgg._sum.amount    ?? 0,
      paidCount:     paidAgg._count.id,
    },
  });
}
