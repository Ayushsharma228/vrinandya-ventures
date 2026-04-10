import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;

  const transactions = await prisma.walletTransaction.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });

  const balance = transactions.reduce((acc, t) =>
    t.type === "CREDIT" ? acc + t.amount : acc - t.amount, 0
  );

  const totalCredit = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);

  // Remitted orders for transparency
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
    },
    orderBy: { remittedAt: "desc" },
  });

  return NextResponse.json({ balance, totalCredit, totalDebit, transactions, remittedOrders });
}
