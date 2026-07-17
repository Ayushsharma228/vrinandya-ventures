import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Support lookup by slug or by id
  const employee = await prisma.aIEmployee.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tasks, memories, recentActivity, tasksByStatus] = await Promise.all([
    prisma.aITask.findMany({
      where:   { employeeId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { history: { orderBy: { createdAt: "desc" }, take: 5 } },
    }),
    prisma.aIMemory.findMany({
      where:   { employeeId: id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.aIActivity.findMany({
      where:   { employeeId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.aITask.groupBy({
      by:    ["status"],
      where: { employeeId: id },
      _count: true,
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of tasksByStatus) statusMap[row.status] = row._count;

  return NextResponse.json({ employee, tasks, memories, recentActivity, tasksByStatus: statusMap });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const target = await prisma.aIEmployee.findFirst({ where: { OR: [{ id }, { slug: id }] }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed: Record<string, unknown> = {};
  if (typeof body.isActive  === "boolean") allowed.isActive  = body.isActive;
  if (typeof body.status    === "string")  allowed.status    = body.status;

  const employee = await prisma.aIEmployee.update({ where: { id: target.id }, data: allowed });
  return NextResponse.json({ employee });
}
