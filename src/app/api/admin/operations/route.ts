import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkSlaBreaches } from "@/lib/automation/sla";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run breach check on each poll (lightweight)
  checkSlaBreaches().catch(() => {});

  const now = new Date();
  const sixHoursAgo        = new Date(now.getTime() - 6  * 3600000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3600000);

  // Get order IDs that already have settlements
  const settledOrderIds = await prisma.settlement.findMany({
    select: { orderId: true },
  }).then(rows => rows.map(r => r.orderId));

  const [
    awaitingAssignment,
    nonRespondingSuppliers,
    lowInventoryItems,
    delayedOrders,
    pendingSettlements,
    pendingWithdrawals,
    highRtoSellers,
    highRtoSuppliers,
    slaBreaches,
  ] = await Promise.all([
    // Orders not assigned after 6 hours
    prisma.order.findMany({
      where: {
        supplierId: null,
        status:     { notIn: ["DELIVERED", "CANCELLED", "RTO"] },
        createdAt:  { lt: sixHoursAgo },
      },
      select: { id: true, externalOrderId: true, createdAt: true,
                seller: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),

    // Suppliers assigned but not accepted after 24h
    prisma.order.findMany({
      where: {
        supplierId:     { not: null },
        supplierStatus: "ASSIGNED",
        updatedAt:      { lt: twentyFourHoursAgo },
      },
      select: { id: true, externalOrderId: true, updatedAt: true,
                supplierId: true,
                supplier: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),

    // Inventory items below 5 units
    prisma.inventoryItem.findMany({
      where: { availableQty: { lte: 5 } },
      select: { id: true, availableQty: true,
                product:  { select: { name: true } },
                supplier: { select: { name: true, email: true } } },
      orderBy: { availableQty: "asc" },
      take: 50,
    }),

    // Orders with breached SLA
    prisma.orderSla.findMany({
      where: {
        OR: [
          { assignmentBreached: true },
          { acceptanceBreached: true },
          { packingBreached:    true },
          { dispatchBreached:   true },
        ],
      },
      include: {
        order: {
          select: { id: true, externalOrderId: true, status: true,
                    seller: { select: { name: true } } },
        },
      },
      take: 50,
    }),

    // Delivered orders without settlement
    prisma.order.findMany({
      where: {
        status: "DELIVERED",
        id:     { notIn: settledOrderIds },
      },
      select: { id: true, externalOrderId: true, updatedAt: true,
                seller: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),

    // Pending withdrawals
    prisma.withdrawalRequest.findMany({
      where:   { status: "PENDING" },
      select:  { id: true, amount: true, createdAt: true,
                 seller: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take:    50,
    }),

    // Sellers with >20% RTO rate (min 10 orders)
    prisma.$queryRaw<{ seller_id: string; name: string; total: number; rto: number; rto_rate: number }[]>`
      SELECT u.id AS seller_id, u.name,
             COUNT(o.id)::int AS total,
             COUNT(CASE WHEN o.status = 'RTO' THEN 1 END)::int AS rto,
             ROUND(COUNT(CASE WHEN o.status = 'RTO' THEN 1 END) * 100.0 / COUNT(o.id), 1) AS rto_rate
      FROM users u
      JOIN orders o ON o.seller_id = u.id
      WHERE u.role = 'SELLER'
      GROUP BY u.id, u.name
      HAVING COUNT(o.id) >= 10
         AND COUNT(CASE WHEN o.status = 'RTO' THEN 1 END) * 100.0 / COUNT(o.id) > 20
      ORDER BY rto_rate DESC
      LIMIT 20
    `,

    // Suppliers with >20% RTO rate (min 10 orders)
    prisma.$queryRaw<{ supplier_id: string; name: string; total: number; rto: number; rto_rate: number }[]>`
      SELECT u.id AS supplier_id, u.name,
             COUNT(o.id)::int AS total,
             COUNT(CASE WHEN o.status = 'RTO' THEN 1 END)::int AS rto,
             ROUND(COUNT(CASE WHEN o.status = 'RTO' THEN 1 END) * 100.0 / COUNT(o.id), 1) AS rto_rate
      FROM users u
      JOIN orders o ON o.supplier_id = u.id
      WHERE u.role = 'SUPPLIER'
      GROUP BY u.id, u.name
      HAVING COUNT(o.id) >= 10
         AND COUNT(CASE WHEN o.status = 'RTO' THEN 1 END) * 100.0 / COUNT(o.id) > 20
      ORDER BY rto_rate DESC
      LIMIT 20
    `,

    // SLA breach count
    prisma.orderSla.count({
      where: {
        OR: [
          { assignmentBreached: true },
          { acceptanceBreached: true },
          { packingBreached:    true },
          { dispatchBreached:   true },
        ],
      },
    }),
  ]);

  return NextResponse.json({
    summary: {
      awaitingAssignment:     awaitingAssignment.length,
      nonRespondingSuppliers: new Set(nonRespondingSuppliers.map(o => o.supplierId)).size,
      inventoryAlerts:        lowInventoryItems.length,
      delayedOrders:          delayedOrders.length,
      pendingSettlements:     pendingSettlements.length,
      pendingWithdrawals:     pendingWithdrawals.length,
      highRtoSellers:         highRtoSellers.length,
      highRtoSuppliers:       highRtoSuppliers.length,
      slaBreaches,
    },
    awaitingAssignment,
    nonRespondingSuppliers,
    lowInventoryItems,
    delayedOrders,
    pendingSettlements,
    pendingWithdrawals,
    highRtoSellers,
    highRtoSuppliers,
  });
}
