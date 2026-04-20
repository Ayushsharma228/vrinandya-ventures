import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await params;

  const transactions = await prisma.walletTransaction.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });

  const balance = transactions.reduce((acc, t) =>
    t.type === "CREDIT" ? acc + t.amount : acc - t.amount, 0
  );

  return NextResponse.json({ transactions, balance });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await params;
  const url = new URL(_req.url);
  const txId = url.searchParams.get("txId");
  if (!txId) return NextResponse.json({ error: "txId required" }, { status: 400 });

  await prisma.walletTransaction.delete({ where: { id: txId, sellerId } });
  return NextResponse.json({ success: true });
}
