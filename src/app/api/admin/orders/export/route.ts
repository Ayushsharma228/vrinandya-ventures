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
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) }                   : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: {
      seller:   { select: { name: true, email: true, brandName: true } },
      supplier: { select: { name: true, email: true } },
      items:    { select: { name: true, sku: true, quantity: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = buildCsv(
    ["Date","Order ID","External Order ID","Source","Status","Customer",
     "Total Amount (₹)","Product Cost (₹)","Shipping (₹)","RTO Charge (₹)",
     "Seller","Brand","Supplier","AWB","Courier",
     "Dispatched At","Items"],
    orders.map((o) => [
      d(o.createdAt),
      o.id,
      o.externalOrderId,
      o.source,
      o.status,
      o.customerName ?? "",
      o.totalAmount,
      o.productCost ?? "",
      o.shippingCharge ?? "",
      o.rtoCharge ?? "",
      o.seller?.name ?? o.seller?.email ?? "",
      o.seller?.brandName ?? "",
      o.supplier?.name ?? o.supplier?.email ?? "",
      o.awbNumber ?? "",
      o.courier ?? "",
      d(o.dispatchedAt),
      o.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
    ]),
  );

  const tag = from && to ? `_${from}_to_${to}` : status ? `_${status}` : "";
  return csvResponse(csv, `orders${tag}.csv`);
}
