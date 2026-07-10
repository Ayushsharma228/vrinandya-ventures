import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { assignedToId, stage, isNI, pipelineStage, notes, followUpDate, salesCallBookedAt, salesCallNotes } = body;

  const data: Record<string, unknown> = {};
  if (assignedToId     !== undefined) data.assignedToId = assignedToId || null;
  if (stage            !== undefined) data.stage = stage;
  if (isNI             !== undefined) data.isNI = isNI;
  if (pipelineStage    !== undefined) data.pipelineStage = pipelineStage;
  if (notes            !== undefined) data.notes = notes;
  if (followUpDate     !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
  if (salesCallBookedAt !== undefined) data.salesCallBookedAt = salesCallBookedAt ? new Date(salesCallBookedAt) : null;
  if (salesCallNotes   !== undefined) data.salesCallNotes = salesCallNotes;

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ lead });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
