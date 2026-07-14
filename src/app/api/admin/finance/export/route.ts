import { NextRequest } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/csv";

function dateWhere(from: string | null, to: string | null) {
  if (!from && !to) return {};
  return {
    createdAt: {
      ...(from ? { gte: new Date(from) }                   : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    },
  };
}

function d(dt: string | Date | null | undefined) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "settlements";
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  const dw   = dateWhere(from, to);
  const tag  = from && to ? `_${from}_to_${to}` : "";

  // ── Settlements ────────────────────────────────────────────────────────────
  if (type === "settlements") {
    const rows = await prisma.settlement.findMany({
      where: dw,
      include: { seller: { select: { name: true, email: true, brandName: true } } },
      orderBy: { createdAt: "desc" },
    });

    const csv = buildCsv(
      ["Date","Order ID","Seller","Brand","Marketplace","Selling Price","Product Cost",
       "Shipping","Packing","Platform Fee","GST on Fees","COD Fee","Marketplace Fee",
       "Ad Spend","Other","Gross Profit","Net Payable","Platform Earnings",
       "Supplier Payable","Status"],
      rows.map((s) => [
        d(s.createdAt), s.orderId,
        s.seller?.name ?? "", s.seller?.brandName ?? "", s.marketplace ?? "",
        s.sellingPrice, s.productCost, s.shippingCharge, s.packingCharge,
        s.platformFee, s.gstOnFees, s.codFee, s.marketplaceFee, s.adSpend,
        s.otherDeductions, s.grossProfit ?? "", s.netPayable,
        s.platformEarnings ?? "", s.supplierPayable ?? "", s.status,
      ]),
    );
    return csvResponse(csv, `settlements${tag}.csv`);
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  if (type === "orders") {
    const rows = await prisma.order.findMany({
      where: dw,
      include: {
        seller:   { select: { name: true, email: true, brandName: true } },
        supplier: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const csv = buildCsv(
      ["Date","Order ID","External Order ID","Source","Status","Customer",
       "Total Amount","Seller","Brand","Supplier","AWB","Courier","RTO Charge"],
      rows.map((o) => [
        d(o.createdAt), o.id, o.externalOrderId, o.source, o.status,
        o.customerName ?? "",
        o.totalAmount,
        o.seller?.name ?? o.seller?.email ?? "",
        o.seller?.brandName ?? "",
        o.supplier?.name ?? o.supplier?.email ?? "",
        o.awbNumber ?? "", o.courier ?? "", o.rtoCharge ?? 0,
      ]),
    );
    return csvResponse(csv, `orders${tag}.csv`);
  }

  // ── Supplier Payments ──────────────────────────────────────────────────────
  if (type === "supplier-payments") {
    const rows = await prisma.supplierPayment.findMany({
      where: dw,
      include: {
        supplier: { select: { name: true, email: true } },
        order:    { select: { externalOrderId: true, source: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const csv = buildCsv(
      ["Date","Order","Source","Supplier","Amount","Status",
       "Due Date","Paid At","Reference No","Invoice No"],
      rows.map((p) => [
        d(p.createdAt),
        p.order?.externalOrderId ?? p.orderId,
        p.order?.source ?? "",
        p.supplier?.name ?? p.supplier?.email ?? "",
        p.amount, p.status,
        d(p.dueDate), d(p.paidAt),
        p.referenceNo ?? "", p.invoiceNo ?? "",
      ]),
    );
    return csvResponse(csv, `supplier-payments${tag}.csv`);
  }

  // ── Ledger ─────────────────────────────────────────────────────────────────
  if (type === "ledger") {
    const rows = await prisma.ledgerEntry.findMany({
      where: dw,
      orderBy: { createdAt: "desc" },
    });

    const csv = buildCsv(
      ["Date","Entry Type","Direction","Entity ID","Entity Type",
       "Amount","Reference ID","Reference Type","Description"],
      rows.map((e) => [
        d(e.createdAt), e.entryType, e.direction,
        e.entityId, e.entityType, e.amount,
        e.referenceId ?? "", e.referenceType ?? "", e.description,
      ]),
    );
    return csvResponse(csv, `ledger${tag}.csv`);
  }

  return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });
}
