import { prisma } from "@/lib/prisma";
import { walletService } from "@/lib/wallet-service";
import { ledgerService } from "@/lib/ledger-service";

export async function reverseSettlement(orderId: string): Promise<void> {
  const settlement = await prisma.settlement.findUnique({ where: { orderId } });

  // No settlement = RTO before delivery, nothing financial to reverse
  if (!settlement) return;

  // Already reversed = idempotent
  if (settlement.status === "REVERSED") return;

  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { externalOrderId: true, sellerId: true, supplierId: true },
  });
  if (!order) return;

  // Already paid out to seller → flag DISPUTED for manual recovery
  if (settlement.status === "SETTLED") {
    await prisma.$transaction([
      prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: "DISPUTED",
          notes:  [settlement.notes, "RTO received after settlement processed — manual debit required."]
                    .filter(Boolean).join("\n"),
        },
      }),
      prisma.orderTimeline.create({
        data: {
          orderId,
          actorRole: "PLATFORM",
          event:     "RTO_DISPUTED",
          details:   `RTO received after settlement was already processed. ₹${settlement.netPayable.toFixed(0)} flagged for manual recovery.`,
          metadata:  { settlementId: settlement.id },
        },
      }),
    ]);

    await ledgerService.record({
      entryType:     "RTO_CHARGE",
      direction:     "DEBIT",
      entityId:      order.sellerId,
      entityType:    "SELLER",
      amount:        settlement.netPayable,
      referenceId:   settlement.id,
      referenceType: "SETTLEMENT",
      description:   `RTO disputed — manual recovery needed for order ${order.externalOrderId}`,
      metadata:      { orderId, status: "DISPUTED" },
    });

    await prisma.notification.create({
      data: {
        userId:  order.sellerId,
        type:    "ORDER_UPDATE",
        title:   "Order Returned (RTO) — Action Required",
        message: `Order ${order.externalOrderId} was returned after your settlement was already processed. Our team will contact you regarding ₹${settlement.netPayable.toFixed(0)}.`,
        data:    { orderId, settlementId: settlement.id, amount: settlement.netPayable },
      },
    });
    return;
  }

  // PENDING or PROCESSING → auto-reverse cleanly
  await prisma.$transaction([
    prisma.settlement.update({
      where: { id: settlement.id },
      data: {
        status: "REVERSED",
        notes:  [settlement.notes, "Auto-reversed on RTO."].filter(Boolean).join("\n"),
      },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId,
        actorRole: "PLATFORM",
        event:     "SETTLEMENT_REVERSED",
        details:   `Settlement reversed due to RTO. ₹${settlement.netPayable.toFixed(0)} wallet credit cancelled.`,
        metadata:  { settlementId: settlement.id },
      },
    }),
  ]);

  // Cancel supplier payment if not yet paid
  const supplierPayment = await prisma.supplierPayment.findUnique({ where: { orderId } });
  if (supplierPayment && supplierPayment.status !== "PAID") {
    await prisma.supplierPayment.update({
      where: { orderId },
      data: {
        status: "CANCELLED",
        notes:  [supplierPayment.notes, "Cancelled due to RTO."].filter(Boolean).join("\n"),
      },
    });
  }

  // Reverse the seller wallet credit
  if (settlement.netPayable > 0) {
    await walletService.debitSeller({
      sellerId: order.sellerId,
      amount:   settlement.netPayable,
      orderId,
      note:     `RTO reversal for order ${order.externalOrderId}`,
    });
  }

  // Immutable ledger entries for the reversal
  const ledgerOps: Promise<unknown>[] = [
    ledgerService.record({
      entryType:     "RTO_CHARGE",
      direction:     "DEBIT",
      entityId:      order.sellerId,
      entityType:    "SELLER",
      amount:        settlement.netPayable,
      referenceId:   settlement.id,
      referenceType: "SETTLEMENT",
      description:   `RTO reversal — order ${order.externalOrderId}`,
      metadata:      { orderId },
    }),
  ];

  if (settlement.platformEarnings && settlement.platformEarnings > 0) {
    ledgerOps.push(
      ledgerService.record({
        entryType:     "ADJUSTMENT",
        direction:     "DEBIT",
        entityId:      "PLATFORM",
        entityType:    "PLATFORM",
        amount:        settlement.platformEarnings,
        referenceId:   settlement.id,
        referenceType: "SETTLEMENT",
        description:   `Commission reversed (RTO) — order ${order.externalOrderId}`,
        metadata:      { orderId },
      })
    );
  }

  await Promise.all(ledgerOps);

  await prisma.notification.create({
    data: {
      userId:  order.sellerId,
      type:    "ORDER_UPDATE",
      title:   "Order Returned (RTO)",
      message: `Order ${order.externalOrderId} was returned. Settlement of ₹${settlement.netPayable.toFixed(0)} has been reversed from your wallet.`,
      data:    { orderId, settlementId: settlement.id, amount: settlement.netPayable },
    },
  });
}
