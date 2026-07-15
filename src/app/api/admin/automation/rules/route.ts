import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.automationRule.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ rules });
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  const rule = await prisma.automationRule.findUnique({ where: { id: body.id } });
  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  const updated = await prisma.automationRule.update({
    where: { id: body.id },
    data:  {
      enabled:     body.enabled     !== undefined ? Boolean(body.enabled) : undefined,
      description: body.description ?? undefined,
    },
  });

  return NextResponse.json({ rule: updated });
}
