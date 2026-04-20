import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId: session.user.id },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.awbNumber) return NextResponse.json({ error: "Order already shipped" }, { status: 400 });
  if (order.status === "CANCELLED") return NextResponse.json({ error: "Cannot ship cancelled order" }, { status: 400 });

  const token = process.env.DELHIVERY_API_TOKEN;
  const pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION;

  if (!token || !pickupLocation) {
    return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });
  }

  const addr = order.customerAddress as {
    address?: string; city?: string; state?: string; pincode?: string; phone?: string;
  } | null;

  const productDesc = order.items.map((i) => `${i.name} x${i.quantity}`).join(", ");
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

  const shipmentData = {
    shipments: [
      {
        name: order.customerName || "Customer",
        add: addr?.address || "",
        pin: addr?.pincode || "",
        city: addr?.city || "",
        state: addr?.state || "",
        country: "India",
        phone: addr?.phone || "",
        order: order.externalOrderId,
        payment_mode: "Prepaid",
        return_pin: "",
        return_city: "",
        return_phone: "",
        return_add: "",
        return_state: "",
        return_country: "",
        products_desc: productDesc,
        hsn_code: "",
        cod_amount: 0,
        order_date: new Date(order.createdAt).toISOString().replace("T", " ").split(".")[0],
        total_amount: order.totalAmount,
        seller_add: "",
        seller_name: "Vrinandya Ventures",
        seller_inv: "",
        quantity: totalQty,
        waybill: "",
        shipment_width: 10,
        shipment_height: 10,
        weight: 0.5,
        seller_gst_tin: "",
        shipping_mode: "Surface",
        address_type: "home",
      },
    ],
    pickup_location: { name: pickupLocation },
  };

  const delhiveryRes = await fetch("https://track.delhivery.com/api/cmu/create.json", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ format: "json", data: JSON.stringify(shipmentData) }),
  });

  const result = await delhiveryRes.json();

  if (!delhiveryRes.ok || result.packages?.[0]?.status === "Error") {
    const errMsg = result.packages?.[0]?.remarks || result.error || "Failed to create shipment";
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }

  const awbNumber = result.packages?.[0]?.waybill;
  if (!awbNumber) {
    return NextResponse.json({ error: "No AWB returned from Delhivery" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      awbNumber,
      status: "SHIPPED",
      courier: "Delhivery",
      trackingUrl: `https://www.delhivery.com/track/package/${awbNumber}`,
    },
  });

  return NextResponse.json({ awbNumber, trackingUrl: `https://www.delhivery.com/track/package/${awbNumber}` });
}
