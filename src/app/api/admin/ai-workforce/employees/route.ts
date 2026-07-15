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

  const employees = await prisma.aIEmployee.findMany({
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    employees.map(async (emp) => {
      const [pending, processing, completedToday, failedToday] = await Promise.all([
        prisma.aITask.count({ where: { employeeId: emp.id, status: "PENDING" } }),
        prisma.aITask.count({ where: { employeeId: emp.id, status: "PROCESSING" } }),
        prisma.aITask.count({ where: { employeeId: emp.id, status: "COMPLETED", completedAt: { gte: today } } }),
        prisma.aITask.count({ where: { employeeId: emp.id, status: "FAILED",    completedAt: { gte: today } } }),
      ]);
      return {
        ...emp,
        pendingTasks:    pending,
        processingTasks: processing,
        completedToday,
        failedToday,
      };
    }),
  );

  return NextResponse.json({ employees: rows });
}
