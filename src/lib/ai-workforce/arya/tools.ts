import { prisma } from "@/lib/prisma";
import type { LLMTool } from "../llm/types";
import { AIMemoryType, Prisma } from "@prisma/client";

// ── Tool Schemas (sent to Claude) ──────────────────────────────────────────

export const ARYA_CLAUDE_TOOLS: LLMTool[] = [
  {
    name: "get_lead_details",
    description: "Get full details of a CRM lead including all form data, business info, current stage, temperature, score, and metadata. Call this first.",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "The lead ID to fetch" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "get_lead_activity",
    description: "Get the activity history for a lead — previous notes, stage changes, follow-ups, and AI actions.",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "The lead ID" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "update_lead_score",
    description: "Update the lead's AI score, temperature classification, pipeline stage, qualification summary, and recommended plan. Call after analysis.",
    input_schema: {
      type: "object",
      properties: {
        leadId:               { type: "string" },
        score:                { type: "number", minimum: 0, maximum: 100, description: "Lead score 0-100" },
        temperature:          { type: "string", enum: ["HOT", "WARM", "COLD"], description: "Lead temperature" },
        pipelineStage:        { type: "string", enum: ["QUALIFICATION_COMPLETED", "HOT_LEAD", "WARM_LEAD", "COLD_LEAD", "SALES_CALL_SCHEDULED"] },
        qualificationSummary: { type: "string", description: "1-2 sentence summary of the lead for the sales team" },
        recommendedPlan:      { type: "string", enum: ["DROPSHIPPING", "MARKETPLACE", "UNDECIDED"], description: "Most likely plan fit" },
      },
      required: ["leadId", "score", "temperature"],
    },
  },
  {
    name: "create_lead_note",
    description: "Create an internal note on the lead that the sales team will see. Keep it brief, specific, and actionable.",
    input_schema: {
      type: "object",
      properties: {
        leadId:  { type: "string" },
        content: { type: "string", description: "The note content (max 300 chars, direct and specific)" },
        type:    { type: "string", enum: ["QUALIFICATION", "STRATEGY", "RISK", "FOLLOW_UP", "DUPLICATE_FLAG"], description: "Note category" },
      },
      required: ["leadId", "content"],
    },
  },
  {
    name: "schedule_followup",
    description: "Set a follow-up date for a lead. Only call if no follow-up is scheduled or if the existing one needs updating.",
    input_schema: {
      type: "object",
      properties: {
        leadId:       { type: "string" },
        followUpDate: { type: "string", description: "ISO date string, e.g. 2025-07-16T10:00:00.000Z" },
        note:         { type: "string", description: "Brief note about what to discuss in the follow-up" },
      },
      required: ["leadId", "followUpDate"],
    },
  },
  {
    name: "save_memory",
    description: "Save important facts about this lead to Arya's memory for future reference. Use for key business signals, objections, goals, and preferences.",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string" },
        key:    { type: "string", description: "Memory key, e.g. budget_mentioned, marketplace_interest, main_objection" },
        value:  { type: "string", description: "The value to remember" },
        type:   { type: "string", enum: ["SELLER", "CONVERSATION", "PREFERENCE", "NOTE"], description: "Memory category" },
      },
      required: ["leadId", "key", "value"],
    },
  },
  {
    name: "complete_analysis",
    description: "Mark this lead analysis as complete. MUST be your final tool call. Provide the complete structured analysis.",
    input_schema: {
      type: "object",
      properties: {
        leadScore:           { type: "number", minimum: 0, maximum: 100 },
        priority:            { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
        summary:             { type: "string", description: "2-3 sentence lead summary for the sales executive" },
        salesStrategy:       { type: "string", description: "Specific recommended approach for this lead" },
        riskFactors:         { type: "array", items: { type: "string" }, description: "List of specific risk factors" },
        closingProbability:  { type: "number", minimum: 0, maximum: 100, description: "Estimated closing probability %" },
        nextAction:          { type: "string", description: "Exact next step the sales executive should take" },
        estimatedValue:      { type: "string", description: "Estimated deal value (e.g. ₹49,999 one-time)" },
        isDuplicate:         { type: "boolean", description: "True if this appears to be a duplicate lead" },
        duplicateNote:       { type: "string", description: "If duplicate, describe which lead it duplicates" },
      },
      required: ["leadScore", "priority", "summary", "salesStrategy", "nextAction"],
    },
  },
];

// ── Tool Execution Context ──────────────────────────────────────────────────

interface AryaToolContext {
  employeeId: string;
  taskId: string;
}

type ToolInput = Record<string, unknown>;

// ── Real Tool Handlers ──────────────────────────────────────────────────────

async function getSystemAdminId(): Promise<string> {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No ADMIN user found in database");
  return admin.id;
}

async function handleGetLeadDetails(input: ToolInput): Promise<unknown> {
  const { leadId } = input;
  if (!leadId) return { error: "leadId is required" };

  const lead = await prisma.lead.findUnique({
    where: { id: leadId as string },
    include: {
      assignedTo:  { select: { id: true, name: true, salesTitle: true } },
      scoreDetail: true,
      activities:  { orderBy: { createdAt: "desc" }, take: 10 },
      _count:      { select: { activities: true, aiConversations: true } },
    },
  });

  if (!lead) return { error: `Lead ${leadId} not found` };

  return {
    id:                lead.id,
    name:              lead.name,
    phone:             lead.phone,
    email:             lead.email,
    city:              lead.city,
    investment:        lead.investment,
    source:            lead.source,
    stage:             lead.stage,
    pipelineStage:     lead.pipelineStage,
    temperature:       lead.temperature,
    leadScore:         lead.leadScore,
    isNI:              lead.isNI,
    notes:             lead.notes,
    followUpDate:      lead.followUpDate,
    salesCallBookedAt: lead.salesCallBookedAt,
    salesCallNotes:    lead.salesCallNotes,
    qualificationSummary: lead.qualificationSummary,
    recommendedPlan:   lead.recommendedPlan,
    aiStatus:          lead.aiStatus,
    businessStage:     lead.businessStage,
    budget:            lead.budget,
    timeline:          lead.timeline,
    marketplace:       lead.marketplace,
    biggestChallenge:  lead.biggestChallenge,
    campaign:          lead.campaign,
    adSet:             lead.adSet,
    assignedTo:        lead.assignedTo,
    scoreDetail:       lead.scoreDetail,
    recentActivities:  lead.activities.slice(0, 5).map(a => ({
      type: a.type, content: a.content, createdAt: a.createdAt,
    })),
    activityCount:     lead._count.activities,
    createdAt:         lead.createdAt,
    updatedAt:         lead.updatedAt,
  };
}

async function handleGetLeadActivity(input: ToolInput): Promise<unknown> {
  const { leadId } = input;
  if (!leadId) return { error: "leadId is required" };

  const activities = await prisma.leadActivity.findMany({
    where: { leadId: leadId as string },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return activities.map((a) => ({
    type:      a.type,
    content:   a.content,
    by:        a.user.name,
    createdAt: a.createdAt,
  }));
}

async function handleUpdateLeadScore(input: ToolInput, ctx: AryaToolContext): Promise<unknown> {
  const { leadId, score, temperature, pipelineStage, qualificationSummary, recommendedPlan } = input;
  if (!leadId) return { error: "leadId is required" };

  const data: Record<string, unknown> = {
    leadScore: typeof score === "number" ? Math.round(score) : undefined,
    temperature: temperature ?? undefined,
    pipelineStage: pipelineStage ?? undefined,
    qualificationSummary: qualificationSummary ?? undefined,
    recommendedPlan: recommendedPlan ?? undefined,
    aiStatus: "COMPLETED",
  };

  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const lead = await prisma.lead.update({
    where: { id: leadId as string },
    data: data as never,
  });

  // Upsert LeadScoreDetail based on score
  if (typeof score === "number") {
    const s = Math.round(score);
    await prisma.leadScoreDetail.upsert({
      where:  { leadId: leadId as string },
      create: { leadId: leadId as string, totalScore: s },
      update: { totalScore: s, updatedAt: new Date() },
    });
  }

  await prisma.aIActivity.create({
    data: {
      employeeId: ctx.employeeId,
      taskId:     ctx.taskId,
      toolName:   "update_lead_score",
      action:     `Updated lead score: ${score} (${temperature})`,
      result:     { score, temperature, pipelineStage } as Prisma.InputJsonValue,
    },
  });

  return { success: true, leadId: lead.id, score, temperature, pipelineStage };
}

async function handleCreateLeadNote(input: ToolInput, ctx: AryaToolContext): Promise<unknown> {
  const { leadId, content, type = "QUALIFICATION" } = input;
  if (!leadId || !content) return { error: "leadId and content are required" };

  const adminId = await getSystemAdminId();

  const activity = await prisma.leadActivity.create({
    data: {
      leadId:  leadId as string,
      userId:  adminId,
      type:    `AI_${String(type).toUpperCase()}`,
      content: `🤖 Arya AI: ${content}`,
    },
  });

  await prisma.aIActivity.create({
    data: {
      employeeId: ctx.employeeId,
      taskId:     ctx.taskId,
      toolName:   "create_lead_note",
      action:     `Created ${type} note on lead`,
      result:     { activityId: activity.id, type } as Prisma.InputJsonValue,
    },
  });

  return { success: true, activityId: activity.id };
}

async function handleScheduleFollowup(input: ToolInput, ctx: AryaToolContext): Promise<unknown> {
  const { leadId, followUpDate, note } = input;
  if (!leadId || !followUpDate) return { error: "leadId and followUpDate are required" };

  await prisma.lead.update({
    where: { id: leadId as string },
    data:  { followUpDate: new Date(followUpDate as string) },
  });

  if (note) {
    const adminId = await getSystemAdminId();
    await prisma.leadActivity.create({
      data: {
        leadId:  leadId as string,
        userId:  adminId,
        type:    "AI_FOLLOW_UP",
        content: `🤖 Arya AI scheduled follow-up: ${note}`,
      },
    });
  }

  await prisma.aIActivity.create({
    data: {
      employeeId: ctx.employeeId,
      taskId:     ctx.taskId,
      toolName:   "schedule_followup",
      action:     `Scheduled follow-up for ${followUpDate}`,
    },
  });

  return { success: true, followUpDate };
}

async function handleSaveMemory(input: ToolInput, ctx: AryaToolContext): Promise<unknown> {
  const { leadId, key, value, type = "NOTE" } = input;
  if (!leadId || !key || !value) return { error: "leadId, key, and value are required" };

  const memKey = `${leadId}:${key}`;
  await prisma.aIMemory.upsert({
    where: { employeeId_type_key: { employeeId: ctx.employeeId, type: type as AIMemoryType, key: memKey } },
    create: {
      employeeId: ctx.employeeId,
      type:       type as AIMemoryType,
      key:        memKey,
      value:      value as Prisma.InputJsonValue,
    },
    update: {
      value:     value as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });

  return { success: true, key: memKey, type };
}

async function handleCompleteAnalysis(input: ToolInput, ctx: AryaToolContext): Promise<unknown> {
  // Just return the analysis — executor handles task completion
  await prisma.aIActivity.create({
    data: {
      employeeId: ctx.employeeId,
      taskId:     ctx.taskId,
      toolName:   "complete_analysis",
      action:     "Lead analysis completed",
      result:     input as Prisma.InputJsonValue,
    },
  });
  return { success: true, analysis: input };
}

// ── Dispatcher ─────────────────────────────────────────────────────────────

export async function executeAryaTool(
  name: string,
  input: unknown,
  ctx: AryaToolContext,
): Promise<unknown> {
  const i = (input ?? {}) as ToolInput;

  switch (name) {
    case "get_lead_details":    return handleGetLeadDetails(i);
    case "get_lead_activity":   return handleGetLeadActivity(i);
    case "update_lead_score":   return handleUpdateLeadScore(i, ctx);
    case "create_lead_note":    return handleCreateLeadNote(i, ctx);
    case "schedule_followup":   return handleScheduleFollowup(i, ctx);
    case "save_memory":         return handleSaveMemory(i, ctx);
    case "complete_analysis":   return handleCompleteAnalysis(i, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
