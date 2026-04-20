import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { salesTarget: true, salesTitle: true, name: true },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86400000);

  const [totalLeads, paidThisMonth, followUpsToday, stageBreakdown] = await Promise.all([
    prisma.lead.count({ where: { assignedToId: session.user.id, isNI: false } }),
    prisma.lead.count({ where: { assignedToId: session.user.id, stage: "PAID", updatedAt: { gte: monthStart } } }),
    prisma.lead.findMany({
      where: { assignedToId: session.user.id, isNI: false, followUpDate: { gte: todayStart, lt: todayEnd } },
      orderBy: { followUpDate: "asc" },
      select: { id: true, name: true, phone: true, stage: true, followUpDate: true, city: true },
    }),
    prisma.lead.groupBy({
      by: ["stage"],
      where: { assignedToId: session.user.id, isNI: false },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    name: me?.name,
    salesTitle: me?.salesTitle,
    salesTarget: me?.salesTarget ?? 0,
    paidThisMonth,
    totalLeads,
    followUpsToday,
    stageBreakdown,
  });
}
