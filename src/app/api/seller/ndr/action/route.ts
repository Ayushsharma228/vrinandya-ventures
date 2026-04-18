import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, action, name, phone, address, city, pincode, state, comments } = await req.json();

  if (!orderId || !action) {
    return NextResponse.json({ error: "orderId and action required" }, { status: 400 });
  }
  if (!["REATTEMPT", "RTO"].includes(action)) {
    return NextResponse.json({ error: "action must be REATTEMPT or RTO" }, { status: 400 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId: session.user.id },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.awbNumber) return NextResponse.json({ error: "No AWB on this order" }, { status: 400 });

  // Submit NDR action to Delhivery
  const payload = {
    waybill: order.awbNumber,
    act: action === "REATTEMPT" ? "Reattempt" : "RTO",
    name: name || order.customerName || "",
    phone: phone || "",
    add: address || "",
    city: city || "",
    pin: pincode || "",
    state: state || "",
    country: "India",
    comments: comments || (action === "REATTEMPT" ? "Re-attempt delivery" : "Return to origin"),
  };

  const delhiveryRes = await fetch("https://track.delhivery.com/api/p/psc/ndr/wbns/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!delhiveryRes.ok) {
    const errText = await delhiveryRes.text();
    return NextResponse.json({ error: `Delhivery error: ${errText}` }, { status: 400 });
  }

  // Update order in DB
  const addr = order.customerAddress as Record<string, string> | null;
  const updatedAddress = action === "REATTEMPT" && address
    ? { ...addr, address, city, pincode, state, phone }
    : addr;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      ndrActionTaken: action,
      customerAddress: updatedAddress ?? undefined,
      ...(action === "RTO" ? { status: "RTO" as never } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
