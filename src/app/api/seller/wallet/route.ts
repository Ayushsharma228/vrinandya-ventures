import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;

  // Indian fiscal year: April 1 → March 31
  const now = new Date();
  const fyStart = now.getMonth() >= 3
    ? new Date(now.getFullYear(), 3, 1)
    : new Date(now.getFullYear() - 1, 3, 1);
  const fyLabel = `FY ${fyStart.getFullYear()}-${(fyStart.getFullYear() + 1).toString().slice(2)}`;

  const [transactions, seller, settleAgg] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: sellerId },
      select: { bankHolder: true, bankAccount: true, bankIfsc: true },
    }),
    prisma.settlement.aggregate({
      where: { sellerId, createdAt: { gte: fyStart } },
      _sum: { sellingPrice: true, platformFee: true, gstOnFees: true, netPayable: true },
    }),
  ]);

  const upcoming = transactions.filter((t) => t.remittanceDate !== null && t.bankTxId === null);
  const paid     = transactions.filter((t) => t.bankTxId !== null || t.remittanceDate === null);

  const totalCredit     = paid.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDeductions = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
  const balance         = totalCredit - totalDeductions;
  const upcomingAmount  = upcoming.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);

  const grossRevenue = settleAgg._sum.sellingPrice ?? 0;
  const platformFee  = settleAgg._sum.platformFee  ?? 0;
  const gstOnFees    = settleAgg._sum.gstOnFees    ?? 0;
  const netPayable   = settleAgg._sum.netPayable   ?? 0;

  // Section 194O TDS: 1% on gross marketplace sales (applies above ₹5L threshold)
  const tdsEstimate  = grossRevenue >= 500_000 ? grossRevenue * 0.01 : 0;

  return NextResponse.json({
    balance,
    totalCredit,
    totalDebit: totalDeductions,
    totalDeductions,
    upcomingAmount,
    upcoming,
    paid,
    transactions,
    bankDetails: {
      bankHolder:  seller?.bankHolder  ?? null,
      bankAccount: seller?.bankAccount ?? null,
      bankIfsc:    seller?.bankIfsc    ?? null,
    },
    taxSummary: {
      fyLabel,
      grossRevenue,
      platformFee,
      gstOnFees,
      tdsEstimate,
      netPayable,
    },
  });
}
