import { prisma } from "@/lib/prisma";
import { AITaskStatus, AITaskSource, Prisma } from "@prisma/client";
import type { TaskInput } from "./types";
import { getEmployeeBySlug } from "./registry";

async function recordHistory(
  taskId: string,
  fromStatus: AITaskStatus,
  toStatus: AITaskStatus,
  note?: string,
): Promise<void> {
  await prisma.aITaskHistory.create({ data: { taskId, fromStatus, toStatus, note } });
}

async function logActivity(
  employeeId: string,
  taskId: string,
  action: string,
  result?: unknown,
  error?: string,
): Promise<void> {
  await prisma.aIActivity.create({
    data: {
      employeeId,
      taskId,
      action,
      result: (result as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      error: error ?? null,
    },
  });
}

export async function enqueueTask(input: TaskInput) {
  const employee = await getEmployeeBySlug(input.employeeSlug);
  if (!employee) throw new Error(`No employee registered with slug "${input.employeeSlug}"`);
  if (!employee.isActive) throw new Error(`Employee "${input.employeeSlug}" is inactive`);

  const source = (input.source as AITaskSource) ?? AITaskSource.ADMIN;

  const task = await prisma.aITask.create({
    data: {
      employeeId:  employee.id,
      type:        input.type,
      title:       input.title,
      description: input.description ?? null,
      status:      AITaskStatus.PENDING,
      priority:    input.priority ?? 5,
      input:       (input.input as Prisma.InputJsonValue) ?? undefined,
      source,
      sourceId:    input.sourceId ?? null,
      scheduledAt: input.scheduledAt ?? null,
    },
  });

  await logActivity(employee.id, task.id, `Task enqueued: ${input.title}`);

  // Fire-and-forget processing (no LLM — just transitions to PROCESSING then WAITING)
  setImmediate(() => {
    processTask(task.id, employee.id).catch(() => {});
  });

  return task;
}

export async function processTask(taskId: string, employeeId: string): Promise<void> {
  const task = await prisma.aITask.findUnique({ where: { id: taskId } });
  if (!task || task.status !== AITaskStatus.PENDING) return;

  // PENDING → PROCESSING
  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: AITaskStatus.PROCESSING, startedAt: new Date() },
  });
  await recordHistory(taskId, AITaskStatus.PENDING, AITaskStatus.PROCESSING, "Task picked up for processing");

  // Stub execution — transition to WAITING (awaiting LLM / tool calls)
  // When a real LLM provider is connected, this is where the agentic loop runs.
  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: AITaskStatus.WAITING },
  });
  await recordHistory(taskId, AITaskStatus.PROCESSING, AITaskStatus.WAITING, "Awaiting LLM provider — stub execution");
  await logActivity(employeeId, taskId, "Task is waiting for AI execution (LLM not yet wired)");
}

export async function completeTask(taskId: string, output: unknown): Promise<void> {
  const task = await prisma.aITask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  const prev = task.status;

  await prisma.aITask.update({
    where: { id: taskId },
    data: {
      status:      AITaskStatus.COMPLETED,
      completedAt: new Date(),
      output:      output as Prisma.InputJsonValue,
    },
  });
  await recordHistory(taskId, prev, AITaskStatus.COMPLETED, "Task completed");
  await logActivity(task.employeeId, taskId, "Task completed", output);
}

export async function failTask(taskId: string, error: string): Promise<void> {
  const task = await prisma.aITask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  const prev = task.status;

  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: AITaskStatus.FAILED, error, completedAt: new Date() },
  });
  await recordHistory(taskId, prev, AITaskStatus.FAILED, error);
  await logActivity(task.employeeId, taskId, "Task failed", undefined, error);
}

export async function cancelTask(taskId: string): Promise<void> {
  const task = await prisma.aITask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (task.status === AITaskStatus.COMPLETED || task.status === AITaskStatus.CANCELLED) {
    throw new Error("Task cannot be cancelled in its current state");
  }
  const prev = task.status;

  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: AITaskStatus.CANCELLED },
  });
  await recordHistory(taskId, prev, AITaskStatus.CANCELLED, "Cancelled by admin");
  await logActivity(task.employeeId, taskId, "Task cancelled");
}

export async function retryTask(taskId: string): Promise<void> {
  const task = await prisma.aITask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (task.status !== AITaskStatus.FAILED) throw new Error("Only FAILED tasks can be retried");

  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: AITaskStatus.PENDING, error: null, startedAt: null, completedAt: null },
  });
  await recordHistory(taskId, AITaskStatus.FAILED, AITaskStatus.PENDING, "Retried by admin");
  await logActivity(task.employeeId, taskId, "Task retried");

  setImmediate(() => {
    processTask(taskId, task.employeeId).catch(() => {});
  });
}
