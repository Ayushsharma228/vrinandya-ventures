import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all leads grouped by phone
  const allLeads = await prisma.lead.findMany({
    select: { id: true, name: true, phone: true, metaLeadId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by normalised phone
  const byPhone: Record<string, typeof allLeads> = {};
  for (const lead of allLeads) {
    const key = lead.phone.replace(/\D/g, "").slice(-10); // last 10 digits
    if (!byPhone[key]) byPhone[key] = [];
    byPhone[key].push(lead);
  }

  const duplicates = Object.entries(byPhone)
    .filter(([, group]) => group.length > 1)
    .map(([phone, group]) => ({ phone, count: group.length, leads: group }));

  return NextResponse.json({ duplicates, totalDuplicateGroups: duplicates.length });
}

export async function DELETE(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allLeads = await prisma.lead.findMany({
    select: { id: true, phone: true, metaLeadId: true, createdAt: true, assignedToId: true, stage: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by normalised phone
  const byPhone: Record<string, typeof allLeads> = {};
  for (const lead of allLeads) {
    const key = lead.phone.replace(/\D/g, "").slice(-10);
    if (!byPhone[key]) byPhone[key] = [];
    byPhone[key].push(lead);
  }

  const toDelete: string[] = [];

  for (const group of Object.values(byPhone)) {
    if (group.length <= 1) continue;

    // Keep the best one:
    // Priority: 1) has metaLeadId, 2) has assignedTo, 3) most recent
    const sorted = [...group].sort((a, b) => {
      // Prefer one with metaLeadId
      if (a.metaLeadId && !b.metaLeadId) return -1;
      if (!a.metaLeadId && b.metaLeadId) return 1;
      // Prefer one that's assigned
      if (a.assignedToId && !b.assignedToId) return -1;
      if (!a.assignedToId && b.assignedToId) return 1;
      // Keep most recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Delete all except the first (best) one
    toDelete.push(...sorted.slice(1).map(l => l.id));
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No duplicates found" });
  }

  await prisma.lead.deleteMany({ where: { id: { in: toDelete } } });

  return NextResponse.json({ deleted: toDelete.length });
}
