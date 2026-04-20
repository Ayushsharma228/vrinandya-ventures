import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { type, content } = await req.json();
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const lead = await prisma.lead.findFirst({ where: { id, assignedToId: session.user.id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activity = await prisma.leadActivity.create({
    data: { leadId: id, userId: session.user.id, type, content },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ activity });
}
