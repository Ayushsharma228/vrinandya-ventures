import { prisma } from "@/lib/prisma";
import type { ParsedRow } from "./parsers";

export type MatchedEntry = ParsedRow & {
  orderId:         string | null;
  sellerId:        string | null;
  ourNetPayable:   number | null;
  discrepancyAmount: number | null;
  discrepancyReason: string | null;
  status: "MATCHED" | "UNMATCHED" | "DISCREPANCY";
};

const DISCREPANCY_THRESHOLD = 5; // ₹5 tolerance

export async function matchRows(
  rows: ParsedRow[],
  marketplace: string
): Promise<MatchedEntry[]> {
  // Batch load all orders matching any of these externalOrderIds for this marketplace
  const orderIds = [...new Set(rows.map(r => r.marketplaceOrderId).filter(Boolean))];
  const source = marketplace.toUpperCase() as "AMAZON" | "FLIPKART" | "MEESHO";

  const orders = await prisma.order.findMany({
    where: {
      externalOrderId: { in: orderIds },
      source,
    },
    select: {
      id: true,
      externalOrderId: true,
      sellerId: true,
      totalAmount: true,
    },
  });

  // Also try to find existing Settlements for those orders
  const orderIdList = orders.map(o => o.id);
  const settlements = orderIdList.length > 0
    ? await prisma.settlement.findMany({
        where: { orderId: { in: orderIdList } },
        select: { orderId: true, netPayable: true, id: true },
      })
    : [];

  const orderMap  = Object.fromEntries(orders.map(o => [o.externalOrderId, o]));
  const settlementMap = Object.fromEntries(settlements.map(s => [s.orderId, s]));

  return rows.map(row => {
    const order = orderMap[row.marketplaceOrderId] ?? null;

    if (!order) {
      return {
        ...row,
        orderId: null,
        sellerId: null,
        ourNetPayable: null,
        discrepancyAmount: null,
        discrepancyReason: "Order not found in AXQEN",
        status: "UNMATCHED" as const,
      };
    }

    const settlement  = settlementMap[order.id] ?? null;
    const ourNet      = settlement?.netPayable ?? null;
    const diff        = ourNet !== null ? Math.abs(row.netAmount - ourNet) : null;

    if (diff !== null && diff > DISCREPANCY_THRESHOLD) {
      return {
        ...row,
        orderId: order.id,
        sellerId: order.sellerId,
        ourNetPayable: ourNet,
        discrepancyAmount: row.netAmount - (ourNet ?? 0),
        discrepancyReason: `Marketplace paid ₹${row.netAmount.toFixed(2)}, we calculated ₹${ourNet!.toFixed(2)} (diff ₹${diff.toFixed(2)})`,
        status: "DISCREPANCY" as const,
      };
    }

    return {
      ...row,
      orderId: order.id,
      sellerId: order.sellerId,
      ourNetPayable: ourNet,
      discrepancyAmount: null,
      discrepancyReason: null,
      status: "MATCHED" as const,
    };
  });
}
