import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const leads = await prisma.lead.findMany({
    select: { stage: true, followUpDate: true, createdAt: true, isNI: true },
  });

  // Follow-up status breakdown by stage
  const stageMap: Record<string, { total: number; overdue: number; dueToday: number; upcoming: number; none: number }> = {};

  for (const lead of leads) {
    if (!stageMap[lead.stage]) stageMap[lead.stage] = { total: 0, overdue: 0, dueToday: 0, upcoming: 0, none: 0 };
    stageMap[lead.stage].total++;

    if (!lead.followUpDate) {
      stageMap[lead.stage].none++;
    } else {
      const d = new Date(lead.followUpDate);
      if (d < today)        stageMap[lead.stage].overdue++;
      else if (d < tomorrow) stageMap[lead.stage].dueToday++;
      else                   stageMap[lead.stage].upcoming++;
    }
  }

  const stageAnalysis = Object.entries(stageMap).map(([stage, s]) => ({ stage, ...s }));

  // Overall follow-up health
  const total    = leads.length;
  const overdue  = leads.filter(l => l.followUpDate && new Date(l.followUpDate) < today).length;
  const dueToday = leads.filter(l => l.followUpDate && new Date(l.followUpDate) >= today && new Date(l.followUpDate) < tomorrow).length;
  const noDate   = leads.filter(l => !l.followUpDate).length;

  // Avg days from creation to current stage per stage (proxy for velocity)
  const stageVelocity: Record<string, number[]> = {};
  for (const lead of leads) {
    if (!stageVelocity[lead.stage]) stageVelocity[lead.stage] = [];
    stageVelocity[lead.stage].push(
      Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000),
    );
  }
  const avgDaysInStage = Object.entries(stageVelocity).map(([stage, days]) => ({
    stage,
    avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
  }));

  return NextResponse.json({ stageAnalysis, avgDaysInStage, summary: { total, overdue, dueToday, noDate } });
}
