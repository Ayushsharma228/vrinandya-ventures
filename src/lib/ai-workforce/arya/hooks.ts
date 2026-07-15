import { prisma } from "@/lib/prisma";
import { AITaskStatus, AITaskSource, Prisma } from "@prisma/client";
import { ensureEmployees } from "../registry";
import { processAryaTask } from "./executor";

async function getAryaEmployee() {
  await ensureEmployees();
  return prisma.aIEmployee.findUnique({ where: { slug: "arya" } });
}

async function createAndRunTask(
  employeeId: string,
  type: string,
  title: string,
  leadId: string,
  input?: unknown,
): Promise<void> {
  const task = await prisma.aITask.create({
    data: {
      employeeId,
      type,
      title,
      status:   AITaskStatus.PENDING,
      priority: 7,
      source:   AITaskSource.AUTOMATION_ENGINE,
      sourceId: leadId,
      input:    (input ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  await prisma.aITaskHistory.create({
    data: { taskId: task.id, fromStatus: AITaskStatus.PENDING, toStatus: AITaskStatus.PENDING, note: "Task created by hook" },
  });

  // Mark lead as AI processing
  await prisma.lead.update({
    where: { id: leadId },
    data:  { aiStatus: "ACTIVE" },
  }).catch(() => {});

  // Process immediately (fire-and-forget)
  setImmediate(() => {
    processAryaTask(task.id).catch(async (err) => {
      await prisma.aITask.update({
        where: { id: task.id },
        data:  { status: AITaskStatus.FAILED, error: String(err).slice(0, 500) },
      }).catch(() => {});
    });
  });
}

export async function onNewLead(leadId: string, leadName: string): Promise<void> {
  try {
    const arya = await getAryaEmployee();
    if (!arya || !arya.isActive) return;

    await createAndRunTask(
      arya.id,
      "lead.qualify",
      `Qualify new lead: ${leadName}`,
      leadId,
      { trigger: "new_lead" },
    );
  } catch {
    // Never block the main request
  }
}

export async function onLeadUpdated(leadId: string, leadName: string, changedFields: string[]): Promise<void> {
  // Only reanalyze if meaningful fields changed
  const MEANINGFUL = ["stage", "notes", "pipelineStage", "budget", "marketplace", "timeline", "businessStage"];
  const hasSignificantChange = changedFields.some((f) => MEANINGFUL.includes(f));
  if (!hasSignificantChange) return;

  try {
    const arya = await getAryaEmployee();
    if (!arya || !arya.isActive) return;

    // Don't queue if there's already a pending/processing task for this lead
    const existing = await prisma.aITask.findFirst({
      where: {
        employeeId: arya.id,
        sourceId:   leadId,
        status:     { in: [AITaskStatus.PENDING, AITaskStatus.PROCESSING] },
      },
    });
    if (existing) return;

    await createAndRunTask(
      arya.id,
      "lead.reanalyze",
      `Re-analyse updated lead: ${leadName}`,
      leadId,
      { trigger: "lead_updated", changedFields },
    );
  } catch {
    // Never block the main request
  }
}

export async function onBulkLeadsImported(leadIds: string[]): Promise<void> {
  if (leadIds.length === 0) return;
  try {
    const arya = await getAryaEmployee();
    if (!arya || !arya.isActive) return;

    // Queue tasks for each lead, staggered slightly to avoid hammering the API
    for (let i = 0; i < leadIds.length; i++) {
      const leadId = leadIds[i];
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { name: true } });
      if (!lead) continue;

      const task = await prisma.aITask.create({
        data: {
          employeeId: arya.id,
          type:       "lead.qualify",
          title:      `Qualify imported lead: ${lead.name}`,
          status:     AITaskStatus.PENDING,
          priority:   5,
          source:     AITaskSource.AUTOMATION_ENGINE,
          sourceId:   leadId,
          input:      { trigger: "bulk_import", batchIndex: i } as Prisma.InputJsonValue,
        },
      });

      // Stagger by 2s per lead to stay within rate limits
      const delay = i * 2000;
      setTimeout(() => {
        processAryaTask(task.id).catch(() => {});
      }, delay);
    }
  } catch {
    // Never block
  }
}
