import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: all sellers with their wallet balance
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    select: {
      id: true,
      name: true,
      email: true,
      walletTransactions: {
        select: { type: true, amount: true },
      },
    },
  });

  const result = sellers.map((s) => {
    const balance = s.walletTransactions.reduce((acc, t) =>
      t.type === "CREDIT" ? acc + t.amount : acc - t.amount, 0
    );
    return { id: s.id, name: s.name, email: s.email, balance };
  });

  return NextResponse.json({ sellers: result });
}

// POST: add transaction for a seller
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId, type, amount, note, orderId, remittanceDate } = await req.json();
  if (!sellerId || !type || !amount) {
    return NextResponse.json({ error: "sellerId, type and amount are required" }, { status: 400 });
  }

  const tx = await prisma.walletTransaction.create({
    data: {
      sellerId,
      type,
      amount: parseFloat(amount),
      note: note || null,
      orderId: orderId || null,
      remittanceDate: remittanceDate ? new Date(remittanceDate) : null,
    },
  });

  return NextResponse.json({ transaction: tx });
}
