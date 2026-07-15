import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateSettlement } from "@/lib/settlement-service";
import { reverseSettlement } from "@/lib/rto-service";
import {
  emailOrderShipped, emailOrderDelivered,
  emailOrderRto, emailOrderCancelled,
  emailSettlementProcessed,
} from "@/lib/email";

const VALID_STATUSES = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status, orderDate } = await req.json();
  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as never,
      ...(orderDate ? { createdAt: new Date(orderDate) } : {}),
    },
  });

  // Fetch order + seller for downstream hooks
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      externalOrderId: true, totalAmount: true, awbNumber: true, courier: true,
      seller: { select: { name: true, email: true } },
    },
  });

  if (status === "DELIVERED") {
    let settlementId: string | null = null;
    try {
      const result = await generateSettlement(orderId);
      settlementId = result?.settlementId ?? null;
    } catch (err) {
      console.error(`Settlement generation failed for ${orderId}:`, err);
    }
    if (order?.seller.email) {
      emailOrderDelivered({
        to: order.seller.email,
        name: order.seller.name ?? "Seller",
        externalOrderId: order.externalOrderId,
        amount: order.totalAmount,
      }).catch(() => {});
    }
    if (settlementId && order?.seller.email) {
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
        select: { netPayable: true, status: true },
      });
      if (settlement) {
        emailSettlementProcessed({
          to: order.seller.email,
          name: order.seller.name ?? "Seller",
          externalOrderId: order.externalOrderId,
          netPayable: settlement.netPayable,
          status: settlement.status,
        }).catch(() => {});
      }
    }
  }

  if (status === "RTO") {
    try {
      await reverseSettlement(orderId);
    } catch (err) {
      console.error(`RTO reversal failed for ${orderId}:`, err);
    }
    if (order?.seller.email) {
      emailOrderRto({
        to: order.seller.email,
        name: order.seller.name ?? "Seller",
        externalOrderId: order.externalOrderId,
      }).catch(() => {});
    }
  }

  if (status === "SHIPPED" && order?.seller.email) {
    emailOrderShipped({
      to: order.seller.email,
      name: order.seller.name ?? "Seller",
      externalOrderId: order.externalOrderId,
      awb: order.awbNumber,
      courier: order.courier,
    }).catch(() => {});
  }

  if (status === "CANCELLED" && order?.seller.email) {
    emailOrderCancelled({
      to: order.seller.email,
      name: order.seller.name ?? "Seller",
      externalOrderId: order.externalOrderId,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
