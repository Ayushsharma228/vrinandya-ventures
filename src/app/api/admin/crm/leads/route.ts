import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { onNewLead } from "@/lib/ai-workforce/arya/hooks";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assignedToId = searchParams.get("assignedToId") || undefined;
  const stage        = searchParams.get("stage") || undefined;
  const source       = searchParams.get("source") || undefined;
  const search       = searchParams.get("search") || undefined;
  const page         = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit        = 50;

  const where: Prisma.LeadWhereInput = {
    ...(assignedToId ? { assignedToId } : {}),
    ...(stage        ? { stage: stage as never } : {}),
    ...(source       ? { source: source as never } : {}),
    ...(search       ? {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { city:  { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo:  { select: { id: true, name: true } },
        scoreDetail: true,
        _count:      { select: { activities: true, aiConversations: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

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

  // Stage counts from ALL leads (unfiltered) for the dashboard header
  const allLeadGroups = await prisma.lead.groupBy({
    by: ["stage"],
    _count: { stage: true },
  });
  const stageCounts: Record<string, number> = {};
  for (const g of allLeadGroups) stageCounts[g.stage] = g._count.stage;

  // "Not Updated" = still in LEAD stage (never called/moved)
  const notUpdated = stageCounts["LEAD"] ?? 0;

  return NextResponse.json({
    leads, salesTeam, perfStats, stageCounts, notUpdated,
    total, page, pages: Math.ceil(total / limit), limit,
  });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
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

  // Fire-and-forget: Arya qualifies every new lead automatically
  setImmediate(() => { onNewLead(lead.id, lead.name).catch(() => {}); });

  return NextResponse.json({ lead });
}
