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
  const isExport     = searchParams.get("export") === "true";
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

  // CSV export — return all matching leads as a downloadable file
  if (isExport) {
    const allLeads = await prisma.lead.findMany({
      where,
      select: {
        name: true, phone: true, email: true, city: true,
        investment: true, stage: true, source: true, isNI: true,
        notes: true, followUpDate: true, createdAt: true,
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const header = ["Name","Phone","Email","City","Investment","Stage","Source","NI","Assigned To","Follow-up Date","Notes","Added"];
    const rows = allLeads.map(l => [
      l.name, l.phone, l.email, l.city,
      l.investment ?? "",
      l.stage,
      l.source === "META_ADS" ? "Meta Ads" : l.source === "WEBSITE" ? "Website Form" : l.source,
      l.isNI ? "Yes" : "No",
      l.assignedTo?.name ?? "Unassigned",
      l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-IN") : "",
      l.notes ?? "",
      new Date(l.createdAt).toLocaleDateString("en-IN"),
    ].map(escape).join(","));

    const csv = [header.join(","), ...rows].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

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
