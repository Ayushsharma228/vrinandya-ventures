import { prisma } from "@/lib/prisma";

export const walletService = {
  async creditSeller(params: {
    sellerId:       string;
    amount:         number;
    orderId?:       string;
    settlementId?:  string;
    note:           string;
    remittanceDate: Date;
  }) {
    if (params.amount <= 0) return null;
    return prisma.walletTransaction.create({
      data: {
        sellerId:      params.sellerId,
        type:          "CREDIT",
        amount:        params.amount,
        note:          params.note,
        orderId:       params.orderId   ?? null,
        settlementId:  params.settlementId ?? null,
        remittanceDate: params.remittanceDate,
        bankTxId:      null, // null = upcoming (not yet paid)
      },
    });
  },

  async debitSeller(params: {
    sellerId:  string;
    amount:    number;
    orderId?:  string;
    note:      string;
  }) {
    if (params.amount <= 0) return null;
    return prisma.walletTransaction.create({
      data: {
        sellerId: params.sellerId,
        type:     "DEBIT",
        amount:   params.amount,
        note:     params.note,
        orderId:  params.orderId ?? null,
      },
    });
  },

  // Mark a pending wallet transaction as paid (sets bankTxId)
  async markPaid(walletTxId: string, bankTxId: string) {
    return prisma.walletTransaction.update({
      where: { id: walletTxId },
      data:  { bankTxId },
    });
  },

  // Get seller balance summary
  async getBalance(sellerId: string) {
    const txs = await prisma.walletTransaction.findMany({
      where: { sellerId },
      select: { type: true, amount: true, bankTxId: true, remittanceDate: true },
    });

    const paid      = txs.filter((t) => t.bankTxId !== null || t.remittanceDate === null);
    const upcoming  = txs.filter((t) => t.remittanceDate !== null && t.bankTxId === null);

    const balance         = paid.reduce((a, t) => t.type === "CREDIT" ? a + t.amount : a - t.amount, 0);
    const totalCredit     = paid.filter((t) => t.type === "CREDIT").reduce((a, t) => a + t.amount, 0);
    const totalDebit      = paid.filter((t) => t.type === "DEBIT").reduce((a, t) => a + t.amount, 0);
    const pendingAmount   = upcoming.filter((t) => t.type === "CREDIT").reduce((a, t) => a + t.amount, 0);

    return { balance, totalCredit, totalDebit, pendingAmount };
  },
};
