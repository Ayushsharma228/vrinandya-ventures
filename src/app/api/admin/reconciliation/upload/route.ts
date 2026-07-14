import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseMarketplaceCsv } from "@/lib/reconciliation/parsers";
import { matchRows } from "@/lib/reconciliation/matcher";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file        = formData.get("file") as File | null;
  const marketplace = (formData.get("marketplace") as string ?? "").toUpperCase();

  if (!file)        return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!marketplace) return NextResponse.json({ error: "marketplace required" }, { status: 400 });
  if (!["AMAZON", "FLIPKART", "MEESHO"].includes(marketplace))
    return NextResponse.json({ error: "marketplace must be AMAZON, FLIPKART, or MEESHO" }, { status: 400 });

  const text = await file.text();

  // Parse CSV
  let parsed;
  try {
    parsed = parseMarketplaceCsv(marketplace, text);
  } catch (err) {
    return NextResponse.json({ error: `Parse error: ${(err as Error).message}` }, { status: 422 });
  }

  if (parsed.length === 0)
    return NextResponse.json({ error: "CSV contains no valid rows" }, { status: 422 });

  // Create report record
  const report = await prisma.reconciliationReport.create({
    data: {
      uploadedById: session.user.id,
      marketplace,
      filename:    file.name,
      status:      "PROCESSING",
      totalRows:   parsed.length,
    },
  });

  // Match rows against our orders
  const matched = await matchRows(parsed, marketplace);

  // Compute stats
  let matchedRows = 0, unmatchedRows = 0, discrepancyRows = 0;
  for (const m of matched) {
    if (m.status === "MATCHED")     matchedRows++;
    else if (m.status === "UNMATCHED")  unmatchedRows++;
    else if (m.status === "DISCREPANCY") discrepancyRows++;
  }

  // Bulk insert entries
  await prisma.reconciliationEntry.createMany({
    data: matched.map(m => ({
      reportId:          report.id,
      marketplaceOrderId: m.marketplaceOrderId,
      orderId:           m.orderId,
      sellerId:          m.sellerId,
      marketplace,
      grossAmount:       m.grossAmount,
      marketplaceFee:    m.marketplaceFee,
      tds:               m.tds,
      shippingFee:       m.shippingFee,
      netAmount:         m.netAmount,
      ourNetPayable:     m.ourNetPayable,
      discrepancyAmount: m.discrepancyAmount,
      discrepancyReason: m.discrepancyReason,
      status:            m.status,
      rawData:           m.rawData as object,
    })),
  });

  // Update report with final stats
  await prisma.reconciliationReport.update({
    where: { id: report.id },
    data: {
      status:         "COMPLETED",
      matchedRows,
      unmatchedRows,
      discrepancyRows,
    },
  });

  return NextResponse.json({
    reportId:       report.id,
    totalRows:      parsed.length,
    matchedRows,
    unmatchedRows,
    discrepancyRows,
  }, { status: 201 });
}
