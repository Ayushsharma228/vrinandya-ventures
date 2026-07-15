import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cancelTask, retryTask } from "@/lib/ai-workforce/task-queue";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const task = await prisma.aITask.findUnique({
    where:   { id },
    include: {
      employee: { select: { name: true, avatar: true, slug: true } },
      history:  { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ task });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === "cancel") {
      await cancelTask(id);
      return NextResponse.json({ message: "Task cancelled" });
    }
    if (body.action === "retry") {
      await retryTask(id);
      return NextResponse.json({ message: "Task queued for retry" });
    }
    return NextResponse.json({ error: "action must be cancel or retry" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
