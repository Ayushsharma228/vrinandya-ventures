import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { AIMemoryType } from "@prisma/client";
import { getMemory, setMemory, listMemories, deleteMemory } from "@/lib/ai-workforce/memory";

const VALID_TYPES = Object.values(AIMemoryType);

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const type       = searchParams.get("type") as AIMemoryType | null;
  const key        = searchParams.get("key");

  if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });

  if (type && key) {
    const value = await getMemory(employeeId, type, key);
    return NextResponse.json({ value });
  }

  const memories = await listMemories(employeeId, type ?? undefined);
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.employeeId || !body?.type || !body?.key || body.value === undefined) {
    return NextResponse.json({ error: "employeeId, type, key, and value are required" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
  }

  await setMemory(
    body.employeeId,
    body.type as AIMemoryType,
    body.key,
    body.value,
    body.expiresAt ? new Date(body.expiresAt) : undefined,
  );

  return NextResponse.json({ message: "Memory saved" });
}

export async function DELETE(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const type       = searchParams.get("type") as AIMemoryType | null;
  const key        = searchParams.get("key");

  if (!employeeId || !type || !key) {
    return NextResponse.json({ error: "employeeId, type, and key required" }, { status: 400 });
  }

  await deleteMemory(employeeId, type, key);
  return NextResponse.json({ message: "Memory deleted" });
}
