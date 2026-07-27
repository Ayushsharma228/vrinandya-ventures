import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.wAConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      lead: { select: { id: true, name: true, phone: true, stage: true, city: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ conversations });
}
