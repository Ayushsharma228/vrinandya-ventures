import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assignedToId = searchParams.get("assignedToId") || undefined;
  const stage        = searchParams.get("stage") || undefined;
  const search       = searchParams.get("search") || undefined;

  const leads = await prisma.lead.findMany({
    where: {
      ...(assignedToId ? { assignedToId } : {}),
      ...(stage        ? { stage: stage as never } : {}),
      ...(search       ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
          { city:  { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { activities: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const salesTeam = await prisma.user.findMany({
    where: { role: "SALES" },
    select: { id: true, name: true, salesTitle: true, salesTarget: true },
  });

  // Performance stats per rep
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const perfStats = await Promise.all(salesTeam.map(async (rep) => {
    const [total, paid, paidThisMonth, onboarded] = await Promise.all([
      prisma.lead.count({ where: { assignedToId: rep.id } }),
      prisma.lead.count({ where: { assignedToId: rep.id, stage: "PAID" } }),
      prisma.lead.count({ where: { assignedToId: rep.id, stage: "PAID", updatedAt: { gte: monthStart } } }),
      prisma.lead.count({ where: { assignedToId: rep.id, stage: "ONBOARDED" } }),
    ]);
    return { ...rep, total, paid, paidThisMonth, onboarded };
  }));

  return NextResponse.json({ leads, salesTeam, perfStats });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, phone, city, investment, assignedToId } = body;
  if (!name || !phone) return NextResponse.json({ error: "name and phone required" }, { status: 400 });

  const lead = await prisma.lead.create({
    data: {
      name, email, phone, city,
      investment: investment ? parseFloat(investment) : null,
      assignedToId: assignedToId || null,
      createdById: session.user.id,
      source: "META_ADS",
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ lead });
}
