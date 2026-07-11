import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = 25;

  const [transactions, total] = await Promise.all([
    prisma.supplierTransaction.findMany({
      where: { supplierId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplierTransaction.count({ where: { supplierId: session.user.id } }),
  ]);

  // Compute running balance
  const allTx = await prisma.supplierTransaction.findMany({
    where: { supplierId: session.user.id },
    select: { type: true, amount: true },
  });

  const balance = allTx.reduce((acc, tx) => {
    if (tx.type === "CREDIT") return acc + tx.amount;
    if (tx.type === "DEBIT") return acc - tx.amount;
    return acc;
  }, 0);

  const pending = allTx
    .filter((t) => t.type === "HOLD")
    .reduce((acc, t) => acc + t.amount, 0);

  return NextResponse.json({
    transactions,
    total,
    page,
    pages: Math.ceil(total / limit),
    balance,
    pending,
  });
}
