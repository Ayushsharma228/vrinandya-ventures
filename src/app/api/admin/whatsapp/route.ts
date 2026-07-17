import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit  = 25;

  const where = status ? { status: status as never } : {};

  const [conversations, total] = await Promise.all([
    prisma.wAConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lead: { select: { id: true, name: true, leadScore: true, temperature: true, pipelineStage: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    }),
    prisma.wAConversation.count({ where }),
  ]);

  const summary = await prisma.wAConversation.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusMap: Record<string, number> = {};
  for (const row of summary) statusMap[row.status] = row._count;

  return NextResponse.json({ conversations, total, page, pages: Math.ceil(total / limit), statusMap });
}
