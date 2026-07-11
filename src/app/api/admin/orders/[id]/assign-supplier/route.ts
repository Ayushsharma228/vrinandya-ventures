import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function generatePONumber(): string {
  const date = new Date();
  const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `PO-${yyyymm}-${rand}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { supplierId, expectedDispatchDate, expectedDeliveryDate, notes } = body;

  if (!supplierId) {
    return NextResponse.json({ error: "supplierId is required" }, { status: 400 });
  }

  const [order, supplier] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    }),
    prisma.user.findUnique({ where: { id: supplierId, role: "SUPPLIER" } }),
  ]);

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  // Check if PO already exists
  const existingPO = await prisma.purchaseOrder.findUnique({ where: { orderId: id } });
  if (existingPO) {
    return NextResponse.json({ error: "This order already has a Purchase Order" }, { status: 409 });
  }

  const supplierCost = order.productCost ?? 0;
  const poNumber = generatePONumber();

  const [updatedOrder, po] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        supplierId,
        supplierStatus: "ASSIGNED",
        expectedDispatchDate: expectedDispatchDate ? new Date(expectedDispatchDate) : null,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      },
    }),
    prisma.purchaseOrder.create({
      data: {
        poNumber,
        orderId: id,
        supplierId,
        sellerId: order.sellerId,
        status: "SENT",
        supplierCost,
        sellingPrice: order.totalAmount,
        expectedDispatchDate: expectedDispatchDate ? new Date(expectedDispatchDate) : null,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        notes,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId ?? undefined,
            name: item.name,
            sku: item.sku ?? undefined,
            quantity: item.quantity,
            unitCost: item.price,
          })),
        },
      },
      include: { items: true },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId: id,
        actorId: session.user.id,
        actorRole: "ADMIN",
        event: "SUPPLIER_ASSIGNED",
        details: `Supplier ${supplier.name ?? supplier.email} assigned. PO ${poNumber} created.`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: supplierId,
        type: "ORDER_UPDATE",
        title: "New Purchase Order",
        message: `PO ${poNumber} assigned to you. Please accept or reject.`,
        data: { orderId: id, poNumber },
      },
    }),
  ]);

  return NextResponse.json({ success: true, order: updatedOrder, po });
}
