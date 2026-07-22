import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;

  const transactions = await prisma.walletTransaction.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });

  // Upcoming = has remittanceDate but no bankTxId yet (not yet paid)
  const upcoming = transactions.filter((t) => t.remittanceDate !== null && t.bankTxId === null);

  // Paid = has bankTxId, OR old manual entry (no remittanceDate either — pre-existing)
  const paid = transactions.filter((t) => t.bankTxId !== null || t.remittanceDate === null);

  // Settled: credits received minus deductions on settled transactions
  const totalCredit     = paid.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  // Deductions = ALL DEBIT transactions across all states (not just settled bucket)
  const totalDeductions = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
  const balance         = totalCredit - totalDeductions;
  const upcomingAmount  = upcoming.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);

  // Remitted orders for breakdown tab
  const remittedOrders = await prisma.order.findMany({
    where: { sellerId, remittedAt: { not: null } },
    select: {
      id: true,
      externalOrderId: true,
      status: true,
      courier: true,
      customerName: true,
      totalAmount: true,
      productCost: true,
      shippingCharge: true,
      packingCharge: true,
      rtoCharge: true,
      remittedAt: true,
      remittanceTxId: true,
    },
    orderBy: { remittedAt: "desc" },
  });

  return NextResponse.json({
    balance,
    totalCredit,
    totalDebit: totalDeductions,
    totalDeductions,
    upcomingAmount,
    upcoming,
    paid,
    transactions, // full list for any other use
    remittedOrders,
  });
}
