import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stage   = searchParams.get("stage") || undefined;
  const search  = searchParams.get("search") || undefined;
  const ni      = searchParams.get("ni") === "true";
  const overdue = searchParams.get("overdue") === "true";
  const sort    = searchParams.get("sort") || "followUp";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: session.user.id,
      ...(stage   ? { stage: stage as never } : {}),
      ...(ni      ? { isNI: true } : { isNI: false }),
      ...(overdue ? { followUpDate: { lt: todayStart } } : {}),
      ...(search  ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
          { city:  { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: sort === "added"
      ? [{ createdAt: "desc" as const }]
      : sort === "updated"
        ? [{ updatedAt: "desc" as const }]
        : [{ followUpDate: "asc" as const }, { updatedAt: "desc" as const }],
    include: {
      _count: { select: { activities: true } },
      activities: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
    },
  });

  // For "stale" sort: re-sort by last activity ascending (least recently contacted first)
  const result = sort === "stale"
    ? [...leads].sort((a, b) => {
        const aT = a.activities[0]?.createdAt?.getTime() ?? 0;
        const bT = b.activities[0]?.createdAt?.getTime() ?? 0;
        return aT - bT;
      })
    : leads;

  // Always return total overdue count regardless of current filters
  const overdueCount = await prisma.lead.count({
    where: { assignedToId: session.user.id, isNI: false, followUpDate: { lt: todayStart } },
  });

  return NextResponse.json({ leads: result, overdueCount });
}
