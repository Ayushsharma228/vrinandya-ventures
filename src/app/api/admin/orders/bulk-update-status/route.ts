import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dispatchEvent } from "@/lib/automation/engine";
import { generateSettlement } from "@/lib/settlement-service";
import { ensureSellerActivation, updateActivation } from "@/lib/activation/engine";
import { reverseSettlement } from "@/lib/rto-service";
import {
  emailOrderShipped, emailOrderDelivered, emailOrderRto,
  emailOrderCancelled, emailSettlementProcessed,
} from "@/lib/email";

const VALID = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderIds, status } = await req.json();

  if (!Array.isArray(orderIds) || orderIds.length === 0)
    return NextResponse.json({ error: "orderIds required" }, { status: 400 });
  if (!VALID.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  // Update all orders
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data:  { status: status as never },
  });

  // Fetch orders with seller info for side-effects
  const orders = await prisma.order.findMany({
    where:  { id: { in: orderIds } },
    select: {
      id: true, externalOrderId: true, totalAmount: true,
      awbNumber: true, courier: true, sellerId: true,
      seller: { select: { name: true, email: true } },
    },
  });

  // Fire side-effects per order (non-blocking)
  const sideEffects = orders.map(async (order) => {
    try {
      if (status === "DELIVERED") {
        const result = await generateSettlement(order.id);
        if (order.seller.email) {
          await emailOrderDelivered({
            to: order.seller.email, name: order.seller.name ?? "Seller",
            externalOrderId: order.externalOrderId, amount: order.totalAmount,
          });
          if (result?.settlementId) {
            const s = await prisma.settlement.findUnique({
              where: { id: result.settlementId }, select: { netPayable: true, status: true },
            });
            if (s) await emailSettlementProcessed({
              to: order.seller.email, name: order.seller.name ?? "Seller",
              externalOrderId: order.externalOrderId,
              netPayable: s.netPayable, status: s.status,
            });
          }
        }
      }
      if (status === "RTO") {
        await reverseSettlement(order.id);
        if (order.seller.email) await emailOrderRto({
          to: order.seller.email, name: order.seller.name ?? "Seller",
          externalOrderId: order.externalOrderId,
        });
      }
      if (status === "SHIPPED" && order.seller.email) {
        await emailOrderShipped({
          to: order.seller.email, name: order.seller.name ?? "Seller",
          externalOrderId: order.externalOrderId,
          awb: order.awbNumber, courier: order.courier,
        });
      }
      if (status === "CANCELLED" && order.seller.email) {
        await emailOrderCancelled({
          to: order.seller.email, name: order.seller.name ?? "Seller",
          externalOrderId: order.externalOrderId,
        });
      }
    } catch (err) {
      console.error(`[bulk-update] side-effect failed for ${order.id}:`, err);
    }
  });

  await Promise.allSettled(sideEffects);

  // Trigger activation update for sellers with DELIVERED orders
  if (status === "DELIVERED") {
    const sellerIds = [...new Set(orders.map(o => o.sellerId).filter(Boolean))] as string[];
    for (const sid of sellerIds) {
      setImmediate(async () => {
        try {
          await ensureSellerActivation(sid);
          await updateActivation(sid);
        } catch {}
      });
    }
  }

  // Dispatch automation events (fire-and-forget)
  for (const oid of orderIds) {
    dispatchEvent({ type: "ORDER_STATUS_CHANGED", entityId: oid, entityType: "ORDER",
                    payload: { status }, actorId: session.user.id });
  }

  return NextResponse.json({ ok: true, updated: orderIds.length });
}
