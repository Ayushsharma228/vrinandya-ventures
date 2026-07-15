import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureEmployees } from "@/lib/ai-workforce/registry";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureEmployees().catch(() => {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    employees,
    tasksByStatus,
    activitiesToday,
    completedToday,
    failedToday,
    avgDurationRaw,
    recentActivity,
    tools,
  ] = await Promise.all([
    prisma.aIEmployee.findMany({ orderBy: { name: "asc" } }),
    prisma.aITask.groupBy({ by: ["status"], _count: true }),
    prisma.aIActivity.count({ where: { createdAt: { gte: today } } }),
    prisma.aITask.count({ where: { status: "COMPLETED", completedAt: { gte: today } } }),
    prisma.aITask.count({ where: { status: "FAILED",    completedAt: { gte: today } } }),
    prisma.aIActivity.aggregate({ _avg: { duration: true }, where: { duration: { not: null } } }),
    prisma.aIActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { employee: { select: { name: true, avatar: true, slug: true } } },
    }),
    prisma.aITool.findMany({ where: { isActive: true }, orderBy: { module: "asc" } }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of tasksByStatus) statusMap[row.status] = row._count;

  const total = completedToday + failedToday;
  const successRate = total > 0 ? Math.round((completedToday / total) * 100) : 100;

  // Per-employee stats
  const employeeRows = await Promise.all(
    employees.map(async (emp) => {
      const [pending, processing, compToday, failToday] = await Promise.all([
        prisma.aITask.count({ where: { employeeId: emp.id, status: "PENDING" } }),
        prisma.aITask.count({ where: { employeeId: emp.id, status: "PROCESSING" } }),
        prisma.aITask.count({ where: { employeeId: emp.id, status: "COMPLETED", completedAt: { gte: today } } }),
        prisma.aITask.count({ where: { employeeId: emp.id, status: "FAILED",    completedAt: { gte: today } } }),
      ]);
      return { ...emp, pendingTasks: pending, processingTasks: processing, completedToday: compToday, failedToday: failToday };
    }),
  );

  return NextResponse.json({
    employees: employeeRows,
    tasksByStatus: statusMap,
    activitiesToday,
    completedToday,
    failedToday,
    successRate,
    avgDuration: avgDurationRaw._avg.duration,
    recentActivity,
    tools,
  });
}
