import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: unremitted orders OR history
export async function GET(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

  const mode = searchParams.get("mode");

  if (mode === "history") {
    const transactions = await prisma.walletTransaction.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });

    const history = await Promise.all(
      transactions.map(async (tx) => {
        const orders = await prisma.order.findMany({
          where: { sellerId, remittanceTxId: tx.id },
          select: {
            id: true,
            externalOrderId: true,
            customerName: true,
            status: true,
            courier: true,
            totalAmount: true,
            productCost: true,
            shippingCharge: true,
            packingCharge: true,
            rtoCharge: true,
          },
        });
        return { transaction: tx, orders };
      })
    );

    return NextResponse.json({ history });
  }

  // Default: pending unremitted orders
  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      remittedAt: null,
      OR: [
        { status: "DELIVERED" },
        { status: "RTO" },
      ],
    },
    include: { items: { select: { name: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

// POST: create remittance (upcoming — not yet paid)
export async function POST(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId, orders, remittanceDate, note, bankTxId } = await req.json();

  if (!sellerId || !orders?.length) {
    return NextResponse.json({ error: "sellerId and orders required" }, { status: 400 });
  }

  const includedOrders = orders.filter((o: { include: boolean }) => o.include);
  if (!includedOrders.length) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  let totalRemittance = 0;
  const now = new Date();

  for (const o of includedOrders) {
    const isRTO = o.isRTO as boolean;
    const productCost = parseFloat(o.productCost) || 0;
    const shippingCharge = parseFloat(o.shippingCharge) || 0;
    const packingCharge = parseFloat(o.packingCharge) || 0;
    const rtoCharge = parseFloat(o.rtoCharge) || 0;
    const net = isRTO
      ? -(productCost + rtoCharge + packingCharge)
      : o.orderAmount - productCost - shippingCharge - packingCharge;
    totalRemittance += net;
  }

  const txType = totalRemittance >= 0 ? "CREDIT" : "DEBIT";
  const txNote = note || `Remittance for ${includedOrders.length} order(s)`;

  const tx = await prisma.walletTransaction.create({
    data: {
      sellerId,
      type: txType,
      amount: Math.abs(totalRemittance),
      note: txNote,
      remittanceDate: remittanceDate ? new Date(remittanceDate) : null,
      bankTxId: bankTxId?.trim() || null,
    },
  });

  for (const o of includedOrders) {
    await prisma.order.update({
      where: { id: o.id },
      data: {
        productCost: parseFloat(o.productCost) || 0,
        shippingCharge: parseFloat(o.shippingCharge) || 0,
        packingCharge: parseFloat(o.packingCharge) || 0,
        rtoCharge: parseFloat(o.rtoCharge) || 0,
        remittedAt: now,
        remittanceTxId: tx.id,
      },
    });
  }

  return NextResponse.json({ success: true, transaction: tx, totalRemittance });
}

// PATCH: mark remittance as paid with bank transaction ID
export async function PATCH(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { txId, bankTxId } = await req.json();
  if (!txId || !bankTxId?.trim()) {
    return NextResponse.json({ error: "txId and bankTxId required" }, { status: 400 });
  }

  const tx = await prisma.walletTransaction.update({
    where: { id: txId },
    data: { bankTxId: bankTxId.trim() },
  });

  return NextResponse.json({ success: true, transaction: tx });
}
