import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || isNaN(Number(amount)) || Number(amount) < 100)
    return NextResponse.json({ error: "Minimum recharge is ₹100" }, { status: 400 });

  const order = await razorpay.orders.create({
    amount:   Math.round(Number(amount) * 100), // paise
    currency: "INR",
    notes:    { sellerId: session.user.id, purpose: "meta_ad_recharge" },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
