import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.adSpend.findMany({
    orderBy: { date: "desc" },
    include: { seller: { select: { id: true, name: true, email: true, brandName: true } } },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId, date, amount, note } = await req.json();
  if (!sellerId || !date || !amount) {
    return NextResponse.json({ error: "sellerId, date and amount are required" }, { status: 400 });
  }

  const entry = await prisma.adSpend.create({
    data: { sellerId, date: new Date(date), amount: parseFloat(amount), note: note || null },
    include: { seller: { select: { id: true, name: true, email: true, brandName: true } } },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await prisma.adSpend.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
