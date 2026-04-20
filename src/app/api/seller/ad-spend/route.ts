import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { sellerId: string; date?: { gte?: Date; lte?: Date } } = {
    sellerId: session.user.id,
  };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59");
  }

  const entries = await prisma.adSpend.findMany({ where, orderBy: { date: "desc" } });
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ total, entries });
}
