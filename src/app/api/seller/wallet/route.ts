import { NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const balance = paid.reduce(
    (acc, t) => (t.type === "CREDIT" ? acc + t.amount : acc - t.amount), 0
  );
  const totalCredit = paid.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDebit = paid.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
  const upcomingAmount = upcoming.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);

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
    totalDebit,
    upcomingAmount,
    upcoming,
    paid,
    transactions, // full list for any other use
    remittedOrders,
  });
}
