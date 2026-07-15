import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { rankSuppliers, AssignmentStrategy } from "@/lib/automation/supplier-assignment";
import { dispatchEvent } from "@/lib/automation/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));
  const strategy: AssignmentStrategy = body.strategy ?? "best_performance";

  const order = await prisma.order.findUnique({
    where:  { id },
    select: { id: true, status: true, supplierId: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.supplierId) {
    return NextResponse.json({ error: "Order already has a supplier assigned" }, { status: 400 });
  }

  const ranked = await rankSuppliers(id, strategy);
  if (ranked.length === 0) {
    return NextResponse.json({ error: "No active suppliers available" }, { status: 422 });
  }

  const best = ranked[0];

  await prisma.order.update({
    where: { id },
    data:  { supplierId: best.supplierId, supplierStatus: "ASSIGNED" },
  });

  dispatchEvent({
    type:       "SUPPLIER_ASSIGNED",
    entityId:   id,
    entityType: "ORDER",
    payload:    { supplierId: best.supplierId, strategy, score: best.score, reason: best.reason },
    actorId:    session.user.id,
  });

  return NextResponse.json({
    assigned: true,
    supplier: { id: best.supplierId, name: best.name, email: best.email },
    strategy,
    score:  best.score,
    reason: best.reason,
    allCandidates: ranked.slice(0, 5),
  });
}
