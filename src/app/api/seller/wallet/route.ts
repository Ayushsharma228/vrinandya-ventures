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

  return NextResponse.json({ balance, totalCredit, totalDebit, transactions });
}
