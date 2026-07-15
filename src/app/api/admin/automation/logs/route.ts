import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize  = 50;
  const eventType = searchParams.get("event") ?? undefined;
  const result    = searchParams.get("result") ?? undefined;

  const where = {
    ...(eventType ? { event: eventType } : {}),
    ...(result    ? { result }           : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.automationLog.findMany({
      where,
      include: { rule: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.automationLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}
