import { prisma } from "@/lib/prisma";

export type AssignmentStrategy =
  | "preferred"
  | "lowest_cost"
  | "fastest_dispatch"
  | "best_performance"
  | "lowest_rto"
  | "inventory";

interface SupplierScore {
  supplierId:     string;
  name:           string | null;
  email:          string;
  score:          number;
  reason:         string;
  totalOrders:    number;
  rtoRate:        number;
  acceptanceRate: number;
  hasInventory:   boolean;
}

export async function rankSuppliers(
  orderId: string,
  strategy: AssignmentStrategy
): Promise<SupplierScore[]> {
  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { items: { select: { name: true, sku: true } } },
  });
  if (!order) return [];

  const suppliers = await prisma.user.findMany({
    where:  { role: "SUPPLIER", accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
  });
  if (suppliers.length === 0) return [];

  const supplierIds = suppliers.map(s => s.id);

  // Get order stats per supplier
  const [orderGroups, rtoGroups, acceptedGroups] = await Promise.all([
    prisma.order.groupBy({
      by:    ["supplierId"],
      where: { supplierId: { in: supplierIds } },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by:    ["supplierId"],
      where: { supplierId: { in: supplierIds }, status: "RTO" },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by:    ["supplierId"],
      where: { supplierId: { in: supplierIds }, supplierStatus: "ACCEPTED" },
      _count: { id: true },
    }),
  ]);

  // Get dispatch speed (avg hours from createdAt to dispatchedAt)
  const avgDispatch = await prisma.$queryRaw<{ supplier_id: string; avg_hours: number }[]>`
    SELECT supplier_id,
           AVG(EXTRACT(EPOCH FROM (dispatched_at - created_at)) / 3600) AS avg_hours
    FROM orders
    WHERE supplier_id = ANY(${supplierIds}::text[])
      AND dispatched_at IS NOT NULL
    GROUP BY supplier_id
  `;

  // Inventory availability
  const skuNames = order.items.map(i => i.name);
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      supplierId: { in: supplierIds },
      availableQty: { gt: 0 },
      product: { name: { in: skuNames } },
    },
    select: { supplierId: true },
  });
  const suppliersWithStock = new Set(inventoryItems.map(i => i.supplierId));

  const orderMap       = Object.fromEntries(orderGroups.map(g => [g.supplierId, g._count.id]));
  const rtoMap         = Object.fromEntries(rtoGroups.map(g => [g.supplierId, g._count.id]));
  const acceptedMap    = Object.fromEntries(acceptedGroups.map(g => [g.supplierId, g._count.id]));
  const dispatchMap    = Object.fromEntries(avgDispatch.map(g => [g.supplier_id, g.avg_hours]));

  const scored: SupplierScore[] = suppliers.map(s => {
    const total      = orderMap[s.id]    ?? 0;
    const rto        = rtoMap[s.id]      ?? 0;
    const accepted   = acceptedMap[s.id] ?? 0;
    const rtoRate    = total > 0 ? rto / total : 0;
    const acceptRate = total > 0 ? accepted / total : 1;
    const avgHours   = dispatchMap[s.id] ?? 999;
    const hasInv     = suppliersWithStock.has(s.id);

    let score = 50; // base
    let reason = "";

    if (strategy === "lowest_rto") {
      score  = 100 - (rtoRate * 100);
      reason = `RTO rate: ${(rtoRate * 100).toFixed(1)}%`;
    } else if (strategy === "fastest_dispatch") {
      score  = Math.max(0, 100 - avgHours);
      reason = avgHours < 999 ? `Avg dispatch: ${avgHours.toFixed(1)}h` : "No dispatch data";
    } else if (strategy === "best_performance") {
      score  = (acceptRate * 50) + ((1 - rtoRate) * 50);
      reason = `Acceptance: ${(acceptRate * 100).toFixed(0)}%, RTO: ${(rtoRate * 100).toFixed(1)}%`;
    } else if (strategy === "inventory") {
      score  = hasInv ? 100 : 0;
      reason = hasInv ? "Has inventory" : "No inventory";
    } else {
      // Default balanced scoring
      score  = (acceptRate * 40) + ((1 - rtoRate) * 40) + (hasInv ? 20 : 0);
      reason = `Score: ${score.toFixed(0)}/100`;
    }

    return { supplierId: s.id, name: s.name, email: s.email, score, reason,
             totalOrders: total, rtoRate, acceptanceRate: acceptRate, hasInventory: hasInv };
  });

  return scored.sort((a, b) => b.score - a.score);
}
