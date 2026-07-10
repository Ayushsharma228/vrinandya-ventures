import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LeadTemperature, PipelineStage } from "@prisma/client";

interface QualificationAnswers {
  budget?: string;
  timeline?: string;
  experience?: string;
  isDecisionMaker?: boolean;
  marketplace?: string;
  goal?: string;
  urgency?: string;
  buyingIntent?: string;
}

export function calculateLeadScore(answers: QualificationAnswers) {
  let budgetScore = 0;
  let timelineScore = 0;
  let experienceScore = 0;
  let decisionMakerScore = 0;
  let marketplaceScore = 0;
  let goalScore = 0;
  let urgencyScore = 0;
  let buyingIntentScore = 0;

  // Budget (0–20)
  const budget = (answers.budget ?? "").toLowerCase();
  if (budget.includes("40000") || budget.includes("40,000") || budget.includes("enterprise")) budgetScore = 20;
  else if (budget.includes("25000") || budget.includes("25,000") || budget.includes("growth"))  budgetScore = 15;
  else if (budget.includes("10000") || budget.includes("10,000") || budget.includes("starter")) budgetScore = 10;
  else if (budget.includes("50000") || budget.includes("1 lakh") || budget.includes("100000"))  budgetScore = 20;
  else if (budget.includes("less") || budget.includes("5000") || budget.includes("tight"))      budgetScore = 3;
  else budgetScore = 5;

  // Timeline (0–15)
  const timeline = (answers.timeline ?? "").toLowerCase();
  if (timeline.includes("immediate") || timeline.includes("now") || timeline.includes("asap") || timeline.includes("today")) timelineScore = 15;
  else if (timeline.includes("week") || timeline.includes("soon"))                                                            timelineScore = 12;
  else if (timeline.includes("month"))                                                                                        timelineScore = 8;
  else if (timeline.includes("3 month") || timeline.includes("quarter"))                                                     timelineScore = 5;
  else timelineScore = 3;

  // Experience (0–15)
  const exp = (answers.experience ?? "").toLowerCase();
  if (exp.includes("intermediate") || exp.includes("some") || exp.includes("experience"))       experienceScore = 15;
  else if (exp.includes("advanced") || exp.includes("expert") || exp.includes("running"))       experienceScore = 12;
  else if (exp.includes("new") || exp.includes("beginner") || exp.includes("fresh"))            experienceScore = 10;
  else experienceScore = 8;

  // Decision maker (0–15)
  decisionMakerScore = answers.isDecisionMaker === true ? 15 : 5;

  // Marketplace (0–10)
  const mp = (answers.marketplace ?? "").toLowerCase();
  if (mp.includes("shopify") || mp.includes("amazon") || mp.includes("flipkart"))               marketplaceScore = 10;
  else if (mp.includes("meesho") || mp.includes("glowroad") || mp.includes("marketplace"))      marketplaceScore = 7;
  else marketplaceScore = 4;

  // Goal clarity (0–10)
  const goal = (answers.goal ?? "").toLowerCase();
  if (goal.length > 30) goalScore = 10;
  else if (goal.length > 10) goalScore = 7;
  else goalScore = 3;

  // Urgency (0–10)
  const urgency = (answers.urgency ?? "").toLowerCase();
  if (urgency.includes("high") || urgency.includes("urgent") || urgency.includes("asap"))       urgencyScore = 10;
  else if (urgency.includes("medium") || urgency.includes("moderate"))                          urgencyScore = 6;
  else urgencyScore = 3;

  // Buying intent (0–5)
  const intent = (answers.buyingIntent ?? "").toLowerCase();
  if (intent.includes("yes") || intent.includes("ready") || intent.includes("confirm"))         buyingIntentScore = 5;
  else if (intent.includes("maybe") || intent.includes("considering"))                          buyingIntentScore = 3;
  else buyingIntentScore = 1;

  const totalScore = budgetScore + timelineScore + experienceScore + decisionMakerScore +
    marketplaceScore + goalScore + urgencyScore + buyingIntentScore;

  const temperature: LeadTemperature =
    totalScore >= 70 ? "HOT" :
    totalScore >= 40 ? "WARM" : "COLD";

  const pipelineStage: PipelineStage =
    temperature === "HOT" ? "HOT_LEAD" :
    temperature === "WARM" ? "WARM_LEAD" : "COLD_LEAD";

  const recommendedPlan =
    budgetScore >= 20 ? "Enterprise (₹40,000 + GST)" :
    budgetScore >= 15 ? "Growth (₹25,000 + GST)" : "Starter (₹10,000 + GST)";

  return {
    totalScore, budgetScore, timelineScore, experienceScore, decisionMakerScore,
    marketplaceScore, goalScore, urgencyScore, buyingIntentScore,
    temperature, pipelineStage, recommendedPlan,
  };
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId, answers } = await req.json() as { leadId: string; answers: QualificationAnswers };
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const scored = calculateLeadScore(answers ?? {});

  await prisma.$transaction([
    prisma.leadScoreDetail.upsert({
      where: { leadId },
      create: { leadId, ...scored },
      update: { ...scored, updatedAt: new Date() },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        leadScore:    scored.totalScore,
        temperature:  scored.temperature,
        pipelineStage: scored.pipelineStage,
        recommendedPlan: scored.recommendedPlan,
        aiStatus:     "COMPLETED",
      },
    }),
  ]);

  return NextResponse.json({ success: true, ...scored });
}
