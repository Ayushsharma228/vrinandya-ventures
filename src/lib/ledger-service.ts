import { prisma } from "@/lib/prisma";
import type { SettlementBreakdown } from "@/lib/settlement-service";

export const ledgerService = {
  async record(entry: {
    entryType:     string;
    direction:     "CREDIT" | "DEBIT";
    entityId:      string;
    entityType:    "SELLER" | "SUPPLIER" | "PLATFORM";
    amount:        number;
    referenceId?:  string;
    referenceType?:string;
    description:   string;
    metadata?:     Record<string, unknown>;
  }) {
    if (entry.amount <= 0) return null;
    return prisma.ledgerEntry.create({
      data: {
        entryType:     entry.entryType as never,
        direction:     entry.direction as never,
        entityId:      entry.entityId,
        entityType:    entry.entityType,
        amount:        entry.amount,
        referenceId:   entry.referenceId   ?? null,
        referenceType: entry.referenceType ?? null,
        description:   entry.description,
        metadata:      entry.metadata ? (entry.metadata as object) : undefined,
      },
    });
  },

  async recordSettlement(params: {
    orderId:      string;
    settlementId: string;
    sellerId:     string;
    supplierId?:  string;
    breakdown:    SettlementBreakdown;
  }) {
    const { orderId, settlementId, sellerId, supplierId, breakdown } = params;
    const entries = [];

    // Seller: gross sale received
    entries.push(this.record({
      entryType:     "SETTLEMENT_GENERATED",
      direction:     "CREDIT",
      entityId:      sellerId,
      entityType:    "SELLER",
      amount:        breakdown.sellingPrice,
      referenceId:   settlementId,
      referenceType: "SETTLEMENT",
      description:   `Gross sale for order ${orderId}`,
      metadata:      { orderId },
    }));

    // Seller: platform fee deducted
    if (breakdown.platformFee > 0) {
      entries.push(this.record({
        entryType:     "PLATFORM_FEE",
        direction:     "DEBIT",
        entityId:      sellerId,
        entityType:    "SELLER",
        amount:        breakdown.platformFee,
        referenceId:   settlementId,
        referenceType: "SETTLEMENT",
        description:   `Platform commission for order ${orderId}`,
        metadata:      { orderId },
      }));
    }

    // Platform earns commission
    if (breakdown.platformEarnings > 0) {
      entries.push(this.record({
        entryType:     "PLATFORM_FEE",
        direction:     "CREDIT",
        entityId:      "PLATFORM",
        entityType:    "PLATFORM",
        amount:        breakdown.platformEarnings,
        referenceId:   settlementId,
        referenceType: "SETTLEMENT",
        description:   `Commission earned for order ${orderId}`,
        metadata:      { orderId },
      }));
    }

    // Seller wallet credited
    if (breakdown.netPayable > 0) {
      entries.push(this.record({
        entryType:     "WALLET_CREDITED",
        direction:     "CREDIT",
        entityId:      sellerId,
        entityType:    "SELLER",
        amount:        breakdown.netPayable,
        referenceId:   settlementId,
        referenceType: "SETTLEMENT",
        description:   `Wallet credit for order ${orderId}`,
        metadata:      { orderId },
      }));
    }

    // Supplier: payment pending
    if (supplierId && breakdown.supplierPayable > 0) {
      entries.push(this.record({
        entryType:     "SUPPLIER_PAYMENT_PENDING",
        direction:     "DEBIT",
        entityId:      "PLATFORM",
        entityType:    "PLATFORM",
        amount:        breakdown.supplierPayable,
        referenceId:   orderId,
        referenceType: "ORDER",
        description:   `Supplier payable for order ${orderId}`,
        metadata:      { orderId, supplierId },
      }));
      entries.push(this.record({
        entryType:     "SUPPLIER_PAYMENT_PENDING",
        direction:     "CREDIT",
        entityId:      supplierId,
        entityType:    "SUPPLIER",
        amount:        breakdown.supplierPayable,
        referenceId:   orderId,
        referenceType: "ORDER",
        description:   `Earnings pending for order ${orderId}`,
        metadata:      { orderId },
      }));
    }

    await Promise.all(entries);
  },

  async recordSupplierPaid(params: {
    supplierId: string;
    orderId:    string;
    amount:     number;
    referenceNo:string;
  }) {
    await Promise.all([
      this.record({
        entryType:     "SUPPLIER_PAYMENT_PAID",
        direction:     "DEBIT",
        entityId:      "PLATFORM",
        entityType:    "PLATFORM",
        amount:        params.amount,
        referenceId:   params.orderId,
        referenceType: "ORDER",
        description:   `Supplier paid for order ${params.orderId}. Ref: ${params.referenceNo}`,
        metadata:      { referenceNo: params.referenceNo },
      }),
      this.record({
        entryType:     "SUPPLIER_PAYMENT_PAID",
        direction:     "DEBIT",
        entityId:      params.supplierId,
        entityType:    "SUPPLIER",
        amount:        params.amount,
        referenceId:   params.orderId,
        referenceType: "ORDER",
        description:   `Payment received for order ${params.orderId}. Ref: ${params.referenceNo}`,
        metadata:      { referenceNo: params.referenceNo },
      }),
    ]);
  },
};
