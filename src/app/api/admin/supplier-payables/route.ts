import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: list supplier payables grouped by supplier
export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter   = searchParams.get("status");   // PENDING | PAID | all
  const supplierFilter = searchParams.get("supplierId");

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "all") where.status = statusFilter;
  if (supplierFilter) where.supplierId = supplierFilter;

  const payments = await prisma.supplierPayment.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true, email: true, businessName: true, phone: true } },
      order:    { select: { externalOrderId: true, totalAmount: true, status: true, createdAt: true, customerName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by supplier
  const supplierMap: Record<string, {
    supplier: { id: string; name: string | null; email: string; businessName: string | null; phone: string | null };
    totalPending: number;
    totalPaid:    number;
    payments:     typeof payments;
  }> = {};

  for (const p of payments) {
    const sid = p.supplierId;
    if (!supplierMap[sid]) {
      supplierMap[sid] = {
        supplier:     p.supplier,
        totalPending: 0,
        totalPaid:    0,
        payments:     [],
      };
    }
    supplierMap[sid].payments.push(p);
    if (p.status === "PENDING" || p.status === "APPROVED") {
      supplierMap[sid].totalPending += p.amount;
    } else if (p.status === "PAID") {
      supplierMap[sid].totalPaid += p.amount;
    }
  }

  const suppliers = Object.values(supplierMap).sort(
    (a, b) => b.totalPending - a.totalPending
  );

  // Summary totals
  const grandPending = suppliers.reduce((s, x) => s + x.totalPending, 0);
  const grandPaid    = suppliers.reduce((s, x) => s + x.totalPaid,    0);

  return NextResponse.json({ suppliers, grandPending, grandPaid });
}

// PATCH: mark one or more payments as PAID
export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentIds, bankTxId, referenceNo, notes } = await req.json();

  if (!paymentIds?.length) {
    return NextResponse.json({ error: "paymentIds required" }, { status: 400 });
  }
  if (!bankTxId?.trim() && !referenceNo?.trim()) {
    return NextResponse.json({ error: "bankTxId or referenceNo required" }, { status: 400 });
  }

  await prisma.supplierPayment.updateMany({
    where: { id: { in: paymentIds } },
    data: {
      status:      "PAID",
      paidAt:      new Date(),
      bankTxId:    bankTxId?.trim()    || null,
      referenceNo: referenceNo?.trim() || null,
      notes:       notes?.trim()       || null,
    },
  });

  return NextResponse.json({ success: true, updated: paymentIds.length });
}
