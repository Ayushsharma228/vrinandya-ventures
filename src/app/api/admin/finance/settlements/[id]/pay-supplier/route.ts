import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ledgerService } from "@/lib/ledger-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { referenceNo, bankTxId, notes } = await req.json() as {
    referenceNo: string;
    bankTxId?: string;
    notes?: string;
  };
  if (!referenceNo) return NextResponse.json({ error: "referenceNo required" }, { status: 400 });

  const payment = await prisma.supplierPayment.findUnique({
    where: { id },
    include: { order: { select: { id: true } } },
  });
  if (!payment) return NextResponse.json({ error: "Supplier payment not found" }, { status: 404 });
  if (payment.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 });

  await prisma.supplierPayment.update({
    where: { id },
    data:  {
      status:      "PAID",
      paidAt:      new Date(),
      referenceNo,
      bankTxId:    bankTxId ?? null,
      notes:       notes    ?? null,
    },
  });

  // Record in SupplierTransaction
  await prisma.supplierTransaction.create({
    data: {
      supplierId: payment.supplierId,
      type:       "CREDIT",
      amount:     payment.amount,
      note:       `Payment for order. Ref: ${referenceNo}`,
      orderId:    payment.orderId,
      settledAt:  new Date(),
    },
  });

  // Immutable ledger entry
  await ledgerService.recordSupplierPaid({
    supplierId:  payment.supplierId,
    orderId:     payment.orderId,
    amount:      payment.amount,
    referenceNo,
  });

  // Notify supplier
  await prisma.notification.create({
    data: {
      userId:  payment.supplierId,
      type:    "GENERAL",
      title:   "Payment Received",
      message: `₹${payment.amount.toLocaleString("en-IN")} credited for your order. Ref: ${referenceNo}`,
      data:    { orderId: payment.orderId, referenceNo },
    },
  });

  return NextResponse.json({ success: true });
}
