import { NextRequest } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/csv";

function d(dt: string | Date | null | undefined) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const sellerId = session.user.id;
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const dateWhere = (from || to) ? {
    createdAt: {
      ...(from ? { gte: new Date(from) }                   : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    },
  } : {};

  const settlements = await prisma.settlement.findMany({
    where: { sellerId, ...dateWhere },
    orderBy: { createdAt: "desc" },
  });

  // Batch-fetch orders
  const orderIds = settlements.map((s) => s.orderId).filter(Boolean);
  const orders   = await prisma.order.findMany({
    where:  { id: { in: orderIds } },
    select: { id: true, externalOrderId: true, customerName: true, source: true },
  });
  const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]));

  const csv = buildCsv(
    ["Date","Order ID","Customer","Source","Marketplace","Selling Price",
     "Platform Fee","GST on Fees","Shipping","Packing","COD Fee","Ad Spend",
     "Marketplace Fee","Other Deductions","Net Payable","Net Profit","Status"],
    settlements.map((s) => {
      const order = orderMap[s.orderId];
      return [
        d(s.createdAt),
        order?.externalOrderId ?? s.orderId,
        order?.customerName ?? "",
        order?.source ?? "",
        s.marketplace ?? "",
        s.sellingPrice,
        s.platformFee,
        s.gstOnFees,
        s.shippingCharge,
        s.packingCharge,
        s.codFee,
        s.adSpend,
        s.marketplaceFee,
        s.otherDeductions,
        s.netPayable,
        s.netProfit ?? "",
        s.status,
      ];
    }),
  );

  const tag  = from && to ? `_${from}_to_${to}` : "";
  return csvResponse(csv, `my-settlements${tag}.csv`);
}
