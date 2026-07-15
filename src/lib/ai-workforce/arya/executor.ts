import { prisma } from "@/lib/prisma";
import { AITaskStatus, Prisma } from "@prisma/client";
import { getLLMProvider, isLLMReady } from "../llm/providers";
import { buildSystemPrompt, buildLeadQualificationPrompt, PROMPT_VERSION } from "./prompts";
import { ARYA_CLAUDE_TOOLS, executeAryaTool } from "./tools";
import { listMemories } from "../memory";
import type { LLMMessage, LLMToolUseBlock } from "../llm/types";

const MAX_ITERATIONS = 10;

interface ExecutionAudit {
  promptVersion: string;
  toolsUsed: string[];
  inputTokens: number;
  outputTokens: number;
  iterations: number;
  memoriesLoaded: number;
  finalDecision: unknown;
  errors: string[];
  durationMs: number;
}

async function recordHistory(taskId: string, from: AITaskStatus, to: AITaskStatus, note: string) {
  await prisma.aITaskHistory.create({ data: { taskId, fromStatus: from, toStatus: to, note } });
}

async function notifyAdminsOfFailure(taskId: string, leadId: string | null, error: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId:  admin.id,
        type:    "GENERAL",
        title:   "Arya: Task Failed",
        message: `Arya failed to process lead${leadId ? ` (${leadId})` : ""}. Error: ${error.slice(0, 150)}`,
        data:    { taskId, leadId } as Prisma.InputJsonValue,
      },
    });
  }
}

export async function processAryaTask(taskId: string): Promise<void> {
  const startTime = Date.now();
  const audit: ExecutionAudit = {
    promptVersion: PROMPT_VERSION,
    toolsUsed:     [],
    inputTokens:   0,
    outputTokens:  0,
    iterations:    0,
    memoriesLoaded: 0,
    finalDecision: null,
    errors:        [],
    durationMs:    0,
  };

  // ── Load task ────────────────────────────────────────────────────────────
  const task = await prisma.aITask.findUnique({
    where:   { id: taskId },
    include: { employee: true },
  });
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status === AITaskStatus.COMPLETED || task.status === AITaskStatus.CANCELLED) return;

  const employeeId = task.employeeId;
  const leadId     = task.sourceId ?? null;

  // ── Check LLM availability ───────────────────────────────────────────────
  if (!isLLMReady()) {
    await prisma.aITask.update({
      where: { id: taskId },
      data:  { status: AITaskStatus.WAITING, error: "ANTHROPIC_API_KEY not configured" },
    });
    await recordHistory(taskId, AITaskStatus.PROCESSING, AITaskStatus.WAITING, "LLM not configured — task is waiting");
    return;
  }

  // ── PENDING → PROCESSING ─────────────────────────────────────────────────
  await prisma.aITask.update({
    where: { id: taskId },
    data:  { status: AITaskStatus.PROCESSING, startedAt: new Date(), aiStatus: "ACTIVE" } as never,
  });
  await recordHistory(taskId, AITaskStatus.PENDING, AITaskStatus.PROCESSING, "Arya executor started");

  // ── Load memories for context ─────────────────────────────────────────────
  const memories = await listMemories(employeeId);
  audit.memoriesLoaded = memories.length;

  // Relevant memories for this lead
  const leadMemories = leadId
    ? memories.filter((m) => m.key.startsWith(leadId))
    : [];

  let memoryContext = "";
  if (leadMemories.length > 0) {
    memoryContext = "\n\nArya's memory about this lead:\n" +
      leadMemories.map((m) => `- ${m.key.split(":")[1]}: ${JSON.stringify(m.value)}`).join("\n");
  }

  // ── Build initial prompt ─────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(new Date().toISOString().split("T")[0]) + memoryContext;
  const userMessage  = buildLeadQualificationPrompt(task.type, task.input);

  const messages: LLMMessage[] = [
    { role: "user", content: userMessage },
  ];

  const ctx = { employeeId, taskId };
  let finalAnalysis: unknown = null;
  let iterationError: string | null = null;

  // ── Agentic Loop (with one retry on failure) ─────────────────────────────
  async function runLoop(retryCount = 0): Promise<void> {
    const provider = getLLMProvider("claude");
    let loopMessages = [...messages];
    let analysisComplete = false;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      audit.iterations++;

      let response;
      try {
        response = await provider.complete(loopMessages, ARYA_CLAUDE_TOOLS, systemPrompt);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        audit.errors.push(`LLM call failed (iteration ${i + 1}): ${msg}`);

        if (retryCount < 1) {
          // Wait 2 seconds then retry the whole loop
          await new Promise((r) => setTimeout(r, 2000));
          return runLoop(retryCount + 1);
        }
        throw new Error(`LLM failed after retry: ${msg}`);
      }

      audit.inputTokens  += response.inputTokens;
      audit.outputTokens += response.outputTokens;

      // Add Claude's response to messages
      loopMessages.push({ role: "assistant", content: response.content });

      if (response.stopReason === "end_turn") break;

      if (response.stopReason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is LLMToolUseBlock => b.type === "tool_use"
        );

        const toolResults: Array<{
          type: "tool_result";
          tool_use_id: string;
          content: string;
          is_error?: boolean;
        }> = [];

        for (const block of toolUseBlocks) {
          audit.toolsUsed.push(block.name);

          let result: unknown;
          let isError = false;

          try {
            result = await executeAryaTool(block.name, block.input, ctx);
          } catch (err) {
            result = { error: err instanceof Error ? err.message : String(err) };
            isError = true;
            audit.errors.push(`Tool ${block.name} error: ${String(err)}`);
          }

          // If complete_analysis was called, capture the final output
          if (block.name === "complete_analysis" && !isError) {
            finalAnalysis = block.input;
            audit.finalDecision = block.input;
            analysisComplete = true;
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
            ...(isError ? { is_error: true } : {}),
          });
        }

        loopMessages.push({ role: "user", content: toolResults });

        if (analysisComplete) break;
      }
    }
  }

  // ── Execute with error handling ──────────────────────────────────────────
  try {
    await runLoop();
  } catch (err) {
    iterationError = err instanceof Error ? err.message : String(err);
    audit.errors.push(iterationError);
  }

  audit.durationMs = Date.now() - startTime;

  // ── Complete or fail task ─────────────────────────────────────────────────
  if (iterationError && !finalAnalysis) {
    await prisma.aITask.update({
      where: { id: taskId },
      data: {
        status:      AITaskStatus.FAILED,
        error:       iterationError.slice(0, 500),
        completedAt: new Date(),
        output:      audit as unknown as Prisma.InputJsonValue,
      },
    });
    await recordHistory(taskId, AITaskStatus.PROCESSING, AITaskStatus.FAILED, `Error: ${iterationError.slice(0, 200)}`);
    await notifyAdminsOfFailure(taskId, leadId, iterationError);
    return;
  }

  await prisma.aITask.update({
    where: { id: taskId },
    data: {
      status:      AITaskStatus.COMPLETED,
      completedAt: new Date(),
      output:      { analysis: finalAnalysis, audit } as unknown as Prisma.InputJsonValue,
    },
  });
  await recordHistory(taskId, AITaskStatus.PROCESSING, AITaskStatus.COMPLETED, "Analysis complete");
}
