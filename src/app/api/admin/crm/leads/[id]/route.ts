import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { assignedToId, stage, isNI } = body;

  const data: Record<string, unknown> = {};
  if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
  if (stage        !== undefined) data.stage = stage;
  if (isNI         !== undefined) data.isNI = isNI;

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ lead });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
