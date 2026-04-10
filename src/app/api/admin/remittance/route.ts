import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: unremitted delivered/RTO orders for a seller
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      remittedAt: null,
      OR: [
        { status: "DELIVERED" },
        { status: "SHIPPED", courier: { contains: "RTO" } },
        { status: "CANCELLED", courier: { contains: "RTO" } },
      ],
    },
    include: { items: { select: { name: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

// POST: save charges + create remittance wallet transaction
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId, orders, remittanceDate, note } = await req.json();
  // orders: Array<{ id, productCost, shippingCharge, packingCharge, rtoCharge, include }>

  if (!sellerId || !orders?.length) {
    return NextResponse.json({ error: "sellerId and orders required" }, { status: 400 });
  }

  const includedOrders = orders.filter((o: { include: boolean }) => o.include);
  if (!includedOrders.length) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  // Save charges + mark remitted for each included order
  let totalRemittance = 0;
  const orderIds: string[] = [];
  const now = new Date();

  for (const o of includedOrders) {
    const isRTO = o.isRTO as boolean;
    const productCost = parseFloat(o.productCost) || 0;
    const shippingCharge = parseFloat(o.shippingCharge) || 0;
    const packingCharge = parseFloat(o.packingCharge) || 0;
    const rtoCharge = parseFloat(o.rtoCharge) || 0;

    let net: number;
    if (isRTO) {
      net = -(productCost + rtoCharge + packingCharge);
    } else {
      net = o.orderAmount - productCost - shippingCharge - packingCharge;
    }
    totalRemittance += net;

    await prisma.order.update({
      where: { id: o.id },
      data: {
        productCost,
        shippingCharge,
        packingCharge,
        rtoCharge,
        remittedAt: now,
      },
    });

    orderIds.push(o.id);
  }

  // Create wallet transaction
  const txType = totalRemittance >= 0 ? "CREDIT" : "DEBIT";
  const txNote = note || `Remittance for ${includedOrders.length} order(s)`;

  const tx = await prisma.walletTransaction.create({
    data: {
      sellerId,
      type: txType,
      amount: Math.abs(totalRemittance),
      note: txNote,
      remittanceDate: remittanceDate ? new Date(remittanceDate) : null,
    },
  });

  return NextResponse.json({ success: true, transaction: tx, totalRemittance });
}
