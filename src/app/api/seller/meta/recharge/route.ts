import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recharges = await prisma.metaRecharge.findMany({
    where: { sellerId: session.user.id },
    orderBy: { date: "desc" },
  });

  const totalRecharged = recharges.reduce((s, r) => s + r.amount, 0);
  return NextResponse.json({ recharges, totalRecharged });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, note, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!amount || isNaN(Number(amount)))
    return NextResponse.json({ error: "amount required" }, { status: 400 });

  // Verify Razorpay signature
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Payment verification data missing" }, { status: 400 });
  }
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: "Payment signature invalid" }, { status: 400 });
  }

  const recharge = await prisma.metaRecharge.create({
    data: {
      sellerId:          session.user.id,
      date:              new Date(),
      amount:            Number(amount),
      note:              note || null,
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    },
  });
  return NextResponse.json({ recharge });
}

export async function DELETE(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.metaRecharge.deleteMany({ where: { id, sellerId: session.user.id } });
  return NextResponse.json({ success: true });
}
