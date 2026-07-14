import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateSettlement } from "@/lib/settlement-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const report = await prisma.reconciliationReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // Find MATCHED entries that haven't been settled yet
  const entries = await prisma.reconciliationEntry.findMany({
    where: { reportId: id, status: "MATCHED", settlementId: null, orderId: { not: null } },
  });

  let settled = 0, failed = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    if (!entry.orderId) continue;
    try {
      const result = await generateSettlement(entry.orderId);

      await prisma.reconciliationEntry.update({
        where: { id: entry.id },
        data: {
          status:      "SETTLED",
          settlementId: result?.settlementId ?? null,
        },
      });
      settled++;
    } catch (err) {
      failed++;
      errors.push(`${entry.marketplaceOrderId}: ${(err as Error).message}`);
    }
  }

  // Update settled count on report
  await prisma.reconciliationReport.update({
    where: { id },
    data: { settledRows: { increment: settled } },
  });

  return NextResponse.json({
    processed: entries.length,
    settled,
    failed,
    errors: errors.slice(0, 10),
  });
}
