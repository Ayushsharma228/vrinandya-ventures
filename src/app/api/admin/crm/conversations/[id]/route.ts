import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const conv = await prisma.wAConversation.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, phone: true, stage: true, city: true, source: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ conversation: conv });
}
