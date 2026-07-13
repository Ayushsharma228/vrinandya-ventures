import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  shiprocketCreateShipment,
  delhiveryCreateShipment,
  customCreateShipment,
  ShipmentInput,
} from "@/lib/shipping-adapters";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { providerId } = await req.json();
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });

  // Fetch order (must belong to this supplier)
  const order = await prisma.order.findFirst({
    where: { id, supplierId: session.user.id },
    include: { items: true, purchaseOrder: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.supplierStatus === "DISPATCHED")
    return NextResponse.json({ error: "Order already dispatched" }, { status: 400 });

  // Fetch provider credentials (full, unmasked)
  const provider = await prisma.supplierShippingProvider.findFirst({
    where: { id: providerId, supplierId: session.user.id, isActive: true },
  });
  if (!provider) return NextResponse.json({ error: "Shipping provider not found" }, { status: 404 });

  // Parse customer address
  const addr = (order.customerAddress ?? {}) as Record<string, string>;
  const phone   = (addr.phone   ?? "").replace(/\D/g, "").slice(-10);
  const city    = addr.city    ?? "";
  const state   = addr.state   ?? addr.province ?? "";
  const pincode = addr.pincode ?? addr.zip      ?? "";
  const address = addr.address ?? addr.address1 ?? "";

  if (!phone || !pincode || !city) {
    return NextResponse.json({ error: "Order is missing customer phone, city or pincode" }, { status: 400 });
  }

  const productDesc = order.items.map((i) => `${i.name} x${i.quantity}`).join(", ") || "Product";

  const input: ShipmentInput = {
    externalOrderId: order.externalOrderId,
    customerName:    order.customerName ?? "Customer",
    address, city, state, pincode, phone,
    totalAmount: order.totalAmount,
    productDesc,
    weight: 0.5,
  };

  let result: { awb: string; courier: string; trackingUrl?: string };

  try {
    if (provider.provider === "SHIPROCKET") {
      if (!provider.apiKey || !provider.apiSecret)
        return NextResponse.json({ error: "Shiprocket email/password not configured" }, { status: 400 });
      result = await shiprocketCreateShipment(provider.apiKey, provider.apiSecret, input);
    } else if (provider.provider === "DELHIVERY") {
      if (!provider.apiKey)
        return NextResponse.json({ error: "Delhivery API token not configured" }, { status: 400 });
      result = await delhiveryCreateShipment(provider.apiKey, input);
    } else if (provider.provider === "CUSTOM") {
      if (!provider.apiKey || !provider.baseUrl)
        return NextResponse.json({ error: "Custom provider API key/URL not configured" }, { status: 400 });
      result = await customCreateShipment(provider.apiKey, provider.baseUrl, input);
    } else {
      return NextResponse.json({ error: "Unknown provider type" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Shipment creation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Mark order dispatched
  const ops: any[] = [
    prisma.order.update({
      where: { id },
      data: {
        supplierStatus:    "DISPATCHED",
        status:            "SHIPPED",
        dispatchedAt:      new Date(),
        supplierTrackingNo: result.awb,
        supplierCourier:   result.courier,
      },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId:   id,
        actorId:   session.user.id,
        actorRole: "SUPPLIER",
        event:     "DISPATCHED",
        details:   `Auto-dispatched via ${provider.label}`,
        metadata:  { awb: result.awb, courier: result.courier, provider: provider.provider },
      },
    }),
  ];

  if (order.purchaseOrder) {
    ops.push(prisma.purchaseOrder.update({
      where: { id: order.purchaseOrder.id },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    }));
  }

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  for (const a of admins) {
    ops.push(prisma.notification.create({
      data: {
        userId:  a.id,
        type:    "ORDER_UPDATE",
        title:   "Order Dispatched",
        message: `Order ${order.externalOrderId} dispatched via ${provider.label}. AWB: ${result.awb}`,
        data:    { orderId: id, awb: result.awb },
      },
    }));
  }

  await prisma.$transaction(ops);

  return NextResponse.json({ success: true, awb: result.awb, courier: result.courier, trackingUrl: result.trackingUrl });
}
