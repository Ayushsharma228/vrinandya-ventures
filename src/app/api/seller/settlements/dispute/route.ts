import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const DISPUTABLE = ["PENDING", "PROCESSING", "SETTLED", "PAID"];

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { settlementId, reason, description } = await req.json();
  if (!settlementId || !reason)
    return NextResponse.json({ error: "settlementId and reason are required" }, { status: 400 });

  const settlement = await prisma.settlement.findFirst({
    where: { id: settlementId, sellerId: session.user.id },
  });

  if (!settlement)
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });

  if (!DISPUTABLE.includes(settlement.status))
    return NextResponse.json({ error: `Cannot dispute a settlement with status ${settlement.status}` }, { status: 400 });

  const noteText = description?.trim()
    ? `[DISPUTE] ${reason}: ${description.trim()}`
    : `[DISPUTE] ${reason}`;

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data:  { status: "DISPUTED" as never, notes: noteText },
  });

  return NextResponse.json({ settlement: updated });
}
