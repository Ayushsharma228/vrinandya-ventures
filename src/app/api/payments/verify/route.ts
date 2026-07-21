import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      paymentConfirmed:  true,
      paymentReference:  razorpay_payment_id,
    },
  });

  // Notify admin
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    await prisma.notification.create({
      data: {
        userId:  admin.id,
        type:    "GENERAL",
        title:   "New Plan Payment",
        message: `${session.user.name ?? session.user.email} completed plan payment. Ref: ${razorpay_payment_id}`,
        data:    { sellerId: session.user.id, paymentId: razorpay_payment_id, orderId: razorpay_order_id },
      },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
