import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId: session.user.id },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.awbNumber) return NextResponse.json({ error: "AWB already exists for this order" }, { status: 400 });

  const addr = order.customerAddress as {
    address?: string; city?: string; state?: string;
    pincode?: string; phone?: string;
  } | null;

  if (!addr?.phone || !addr?.pincode || !addr?.city) {
    return NextResponse.json({ error: "Order is missing customer address details" }, { status: 400 });
  }

  const productDesc = order.items.map(i => `${i.name} x${i.quantity}`).join(", ") || "Product";

  const shipmentPayload = {
    shipments: [
      {
        name: order.customerName || "Customer",
        add: addr.address || "",
        city: addr.city,
        state: addr.state || "Uttar Pradesh",
        country: "India",
        pin: addr.pincode,
        phone: addr.phone.replace(/\D/g, "").slice(-10),
        order: order.externalOrderId,
        payment_mode: "COD",
        return_pin: "282004",
        return_city: "Agra",
        return_phone: "8936971337",
        return_add: "4 210 Kacheri Ghat Unt Gali",
        return_state: "Uttar Pradesh",
        return_country: "India",
        products_desc: productDesc,
        hsn_code: "",
        cod_amount: order.totalAmount,
        order_date: new Date(order.createdAt).toISOString(),
        total_amount: order.totalAmount,
        seller_add: "4 210 Kacheri Ghat Unt Gali, Agra",
        seller_name: "Ayush Sharma",
        seller_inv: order.externalOrderId,
        quantity: order.items.reduce((s, i) => s + i.quantity, 0) || 1,
        waybill: "",
        shipment_width: 13,
        shipment_height: 4,
        weight: 0.05,
        shipment_length: 23,
        pickup_location: "SELF",
      },
    ],
    pickup_location: { name: "SELF" },
  };

  const formBody = `format=json&data=${encodeURIComponent(JSON.stringify(shipmentPayload))}`;

  const delhiveryRes = await fetch("https://track.delhivery.com/api/cmu/create.json", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  if (!delhiveryRes.ok) {
    const errText = await delhiveryRes.text();
    return NextResponse.json({ error: `Delhivery error: ${errText}` }, { status: 400 });
  }

  const result = await delhiveryRes.json();

  // Extract AWB from response
  const pkg = result?.packages?.[0];
  const awb = pkg?.waybill ?? pkg?.remark;

  if (!awb || pkg?.status === "Error") {
    const remark = pkg?.remark || result?.rmk || "Unknown error from Delhivery";
    return NextResponse.json({ error: remark }, { status: 400 });
  }

  // Save AWB to order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      awbNumber: awb,
      status: "SHIPPED",
      courier: "Delhivery",
      trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
    },
  });

  return NextResponse.json({ awb, trackingUrl: `https://www.delhivery.com/track/package/${awb}` });
}
