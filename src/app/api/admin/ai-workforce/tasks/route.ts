import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { enqueueTask } from "@/lib/ai-workforce/task-queue";
import { ensureEmployees } from "@/lib/ai-workforce/registry";
import type { EmployeeSlug } from "@/lib/ai-workforce/types";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status     = searchParams.get("status");
  const source     = searchParams.get("source");
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit      = 25;

  const where = {
    ...(employeeId ? { employeeId } : {}),
    ...(status     ? { status: status as never } : {}),
    ...(source     ? { source: source as never } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.aITask.findMany({
      where,
      include: { employee: { select: { name: true, avatar: true, slug: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.aITask.count({ where }),
  ]);

  return NextResponse.json({ tasks, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.employeeSlug || !body?.type || !body?.title) {
    return NextResponse.json({ error: "employeeSlug, type, and title are required" }, { status: 400 });
  }

  await ensureEmployees();

  try {
    const task = await enqueueTask({
      employeeSlug: body.employeeSlug as EmployeeSlug,
      type:         body.type,
      title:        body.title,
      description:  body.description,
      input:        body.input,
      priority:     body.priority ?? 5,
      source:       body.source ?? "ADMIN",
      sourceId:     body.sourceId,
      scheduledAt:  body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
