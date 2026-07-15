import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, adminNote, bankTxId } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(action))
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 });

  const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!withdrawal)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (withdrawal.status !== "PENDING")
    return NextResponse.json({ error: "Already processed" }, { status: 400 });

  if (action === "APPROVED") {
    // Create DEBIT wallet transaction to reduce seller balance
    const walletTx = await prisma.walletTransaction.create({
      data: {
        sellerId:  withdrawal.sellerId,
        type:      "DEBIT",
        amount:    withdrawal.amount,
        note:      `Payout withdrawal — ₹${withdrawal.amount.toFixed(2)}`,
        bankTxId:  bankTxId ?? `WD-${id.slice(-8).toUpperCase()}`,
      },
    });

    await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status:      "APPROVED",
        adminNote:   adminNote ?? null,
        walletTxId:  walletTx.id,
        processedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId:  withdrawal.sellerId,
        type:    "GENERAL",
        title:   "Withdrawal Approved ✓",
        message: `Your withdrawal of ₹${withdrawal.amount.toFixed(2)} has been approved and will be transferred to your bank account ${withdrawal.bankAccount.slice(-4).padStart(withdrawal.bankAccount.length, "*")}.`,
        data:    { withdrawalId: id, amount: withdrawal.amount },
      },
    });
  } else {
    await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status:      "REJECTED",
        adminNote:   adminNote ?? null,
        processedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId:  withdrawal.sellerId,
        type:    "GENERAL",
        title:   "Withdrawal Request Rejected",
        message: `Your withdrawal request of ₹${withdrawal.amount.toFixed(2)} was rejected. ${adminNote ? `Reason: ${adminNote}` : "Please contact support for more information."}`,
        data:    { withdrawalId: id },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
