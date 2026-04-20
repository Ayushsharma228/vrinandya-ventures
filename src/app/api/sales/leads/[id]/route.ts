import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, assignedToId: session.user.id },
    include: {
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { stage, followUpDate, isNI, notes } = body;

  const existing = await prisma.lead.findFirst({ where: { id, assignedToId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (stage        !== undefined) data.stage = stage;
  if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
  if (isNI         !== undefined) data.isNI = isNI;
  if (notes        !== undefined) data.notes = notes;

  if (stage && stage !== existing.stage) {
    await prisma.leadActivity.create({
      data: { leadId: id, userId: session.user.id, type: "STAGE_CHANGE", content: `Stage changed to ${stage}` },
    });
  }

  const lead = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ lead });
}
