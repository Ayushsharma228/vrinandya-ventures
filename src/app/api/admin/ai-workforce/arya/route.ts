import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureEmployees } from "@/lib/ai-workforce/registry";
import { processAryaTask } from "@/lib/ai-workforce/arya/executor";
import { onNewLead } from "@/lib/ai-workforce/arya/hooks";
import { isLLMReady } from "@/lib/ai-workforce/llm/providers";
import { AITaskStatus, AITaskSource, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureEmployees();
  const arya = await prisma.aIEmployee.findUnique({ where: { slug: "arya" } });
  if (!arya) return NextResponse.json({ error: "Arya not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tasksByStatus, recentTasks, recentActivity, memories, totalLeadsProcessed] = await Promise.all([
    prisma.aITask.groupBy({ by: ["status"], where: { employeeId: arya.id }, _count: true }),
    prisma.aITask.findMany({
      where:   { employeeId: arya.id },
      orderBy: { createdAt: "desc" },
      take:    20,
      include: { history: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
    prisma.aIActivity.findMany({
      where:   { employeeId: arya.id },
      orderBy: { createdAt: "desc" },
      take:    30,
    }),
    prisma.aIMemory.findMany({
      where:   { employeeId: arya.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { updatedAt: "desc" },
      take:    50,
    }),
    prisma.aITask.count({
      where: { employeeId: arya.id, status: AITaskStatus.COMPLETED },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of tasksByStatus) statusMap[row.status] = row._count;

  const completedToday = await prisma.aITask.count({
    where: { employeeId: arya.id, status: AITaskStatus.COMPLETED, completedAt: { gte: today } },
  });
  const failedToday = await prisma.aITask.count({
    where: { employeeId: arya.id, status: AITaskStatus.FAILED, completedAt: { gte: today } },
  });

  return NextResponse.json({
    employee:           arya,
    tasksByStatus:      statusMap,
    recentTasks,
    recentActivity,
    memories,
    totalLeadsProcessed,
    completedToday,
    failedToday,
    llmReady:           isLLMReady(),
  });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "action is required" }, { status: 400 });

  await ensureEmployees();
  const arya = await prisma.aIEmployee.findUnique({ where: { slug: "arya" } });
  if (!arya) return NextResponse.json({ error: "Arya not found" }, { status: 404 });

  // Manually trigger Arya on a specific lead
  if (body.action === "qualify_lead") {
    if (!body.leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

    const lead = await prisma.lead.findUnique({
      where: { id: body.leadId },
      select: { id: true, name: true },
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    setImmediate(() => { onNewLead(lead.id, lead.name).catch(() => {}); });
    return NextResponse.json({ message: `Arya is now qualifying lead: ${lead.name}` });
  }

  // Retry a failed task
  if (body.action === "retry_task") {
    if (!body.taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const task = await prisma.aITask.findUnique({ where: { id: body.taskId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (task.status !== AITaskStatus.FAILED && task.status !== AITaskStatus.WAITING) {
      return NextResponse.json({ error: "Only FAILED or WAITING tasks can be retried" }, { status: 400 });
    }

    await prisma.aITask.update({
      where: { id: body.taskId },
      data:  { status: AITaskStatus.PENDING, error: null, startedAt: null, completedAt: null },
    });
    await prisma.aITaskHistory.create({
      data: { taskId: body.taskId, fromStatus: task.status, toStatus: AITaskStatus.PENDING, note: "Manually retried by admin" },
    });

    setImmediate(() => { processAryaTask(body.taskId).catch(() => {}); });
    return NextResponse.json({ message: "Task queued for retry" });
  }

  // Process all unqualified leads (aiStatus = PENDING)
  if (body.action === "process_backlog") {
    const unqualified = await prisma.lead.findMany({
      where:   { aiStatus: "PENDING" },
      select:  { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take:    50,
    });

    let queued = 0;
    for (let i = 0; i < unqualified.length; i++) {
      const lead = unqualified[i];
      const task = await prisma.aITask.create({
        data: {
          employeeId: arya.id,
          type:       "lead.qualify",
          title:      `Qualify backlog lead: ${lead.name}`,
          status:     AITaskStatus.PENDING,
          priority:   4,
          source:     AITaskSource.ADMIN,
          sourceId:   lead.id,
          input:      { trigger: "backlog_process" } as Prisma.InputJsonValue,
        },
      });
      const delay = i * 3000; // 3s apart
      setTimeout(() => { processAryaTask(task.id).catch(() => {}); }, delay);
      queued++;
    }

    return NextResponse.json({ message: `Queued ${queued} leads for Arya to process` });
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}
