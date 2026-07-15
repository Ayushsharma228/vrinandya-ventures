import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const taskId     = searchParams.get("taskId");
  const toolName   = searchParams.get("toolName");
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit      = 50;

  const where = {
    ...(employeeId ? { employeeId } : {}),
    ...(taskId     ? { taskId }     : {}),
    ...(toolName   ? { toolName }   : {}),
  };

  const [activities, total] = await Promise.all([
    prisma.aIActivity.findMany({
      where,
      include: { employee: { select: { name: true, avatar: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.aIActivity.count({ where }),
  ]);

  return NextResponse.json({ activities, total, page, pages: Math.ceil(total / limit) });
}
