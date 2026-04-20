import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

function mapShopifyStatus(financial: string, fulfillment: string | null): OrderStatus {
  if (financial === "refunded" || financial === "voided") return OrderStatus.CANCELLED;
  if (fulfillment === "fulfilled") return OrderStatus.DELIVERED;
  if (fulfillment === "partial") return OrderStatus.SHIPPED;
  if (financial === "paid") return OrderStatus.PROCESSING;
  return OrderStatus.NEW;
}

export async function POST() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.shopifyStore.findUnique({
    where: { sellerId: session.user.id },
  });

  if (!store) {
    return NextResponse.json({ error: "No Shopify store connected" }, { status: 400 });
  }

  // Fetch all orders from Shopify (up to 250)
  const shopifyRes = await fetch(
    `https://${store.storeUrl}/admin/api/2025-01/orders.json?status=any&limit=250`,
    { headers: { "X-Shopify-Access-Token": store.accessToken } }
  );

  if (!shopifyRes.ok) {
    const statusCode = shopifyRes.status;
    if (statusCode === 401 || statusCode === 403) {
      return NextResponse.json(
        { error: "Access token is invalid or expired. Please reconnect your Shopify store." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Shopify returned error ${statusCode}. Please check your store connection.` },
      { status: 400 }
    );
  }

  const { orders: shopifyOrders } = await shopifyRes.json();

  // Get all existing orders for this seller in one query
  const existingOrders = await prisma.order.findMany({
    where: { sellerId: session.user.id, source: "SHOPIFY" },
    select: { id: true, externalOrderId: true, status: true, awbNumber: true, courier: true },
  });
  const existingMap = new Map(existingOrders.map((o) => [o.externalOrderId, o]));

  // Statuses that have been manually set — don't overwrite from Shopify
  const LOCKED_STATUSES: OrderStatus[] = ["SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

  // Build data for new orders and updates
  type OrderCreateInput = {
    sellerId: string;
    externalOrderId: string;
    source: "SHOPIFY";
    status: OrderStatus;
    customerName: string | null;
    customerEmail: string | null;
    customerAddress: Prisma.InputJsonValue | undefined;
    totalAmount: number;
    currency: string;
    rawData: Prisma.InputJsonValue;
  };

  const toCreate: OrderCreateInput[] = [];
  const toUpdate: { id: string; status: OrderStatus; customerName: string | null; customerEmail: string | null; customerAddress: Prisma.InputJsonValue | undefined; totalAmount: number; rawData: Prisma.InputJsonValue }[] = [];

  for (const so of shopifyOrders) {
    const externalId = so.name ?? String(so.id);
    const status = mapShopifyStatus(so.financial_status, so.fulfillment_status);
    const customerAddress: Prisma.InputJsonValue | undefined = so.shipping_address
      ? {
          address: so.shipping_address.address1 ?? "",
          city: so.shipping_address.city ?? "",
          state: so.shipping_address.province ?? "",
          pincode: so.shipping_address.zip ?? "",
          phone: so.shipping_address.phone || so.customer?.phone || "",
        }
      : undefined;
    const customerName = so.customer
      ? `${so.customer.first_name ?? ""} ${so.customer.last_name ?? ""}`.trim() || null
      : null;

    const existing = existingMap.get(externalId);
    if (existing) {
      // If order has AWB or is in a manually-set status, don't overwrite status from Shopify
      const isLocked = existing.awbNumber || existing.courier || LOCKED_STATUSES.includes(existing.status);
      toUpdate.push({
        id: existing.id,
        status: isLocked ? existing.status : status,
        customerName,
        customerEmail: so.email || so.customer?.email || null,
        customerAddress,
        totalAmount: parseFloat(so.total_price),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawData: so as any,
      });
    } else {
      toCreate.push({
        sellerId: session.user.id,
        externalOrderId: externalId,
        source: "SHOPIFY",
        status,
        customerName,
        customerEmail: so.email || so.customer?.email || null,
        customerAddress,
        totalAmount: parseFloat(so.total_price),
        currency: so.currency,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawData: so as any,
        // Use the actual Shopify order date so filters work correctly
        ...(so.created_at ? { createdAt: new Date(so.created_at) } : {}),
      });
    }
  }

  // Batch create new orders
  if (toCreate.length > 0) {
    await prisma.order.createMany({ data: toCreate, skipDuplicates: true });
  }

  // Batch update existing orders in parallel (status, amounts)
  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map((u) =>
        prisma.order.update({
          where: { id: u.id },
          data: {
            status: u.status,
            customerName: u.customerName,
            customerEmail: u.customerEmail,
            customerAddress: u.customerAddress,
            totalAmount: u.totalAmount,
            rawData: u.rawData,
          },
        })
      )
    );
  }

  // Re-fetch all orders to get IDs for item sync
  const allOrders = await prisma.order.findMany({
    where: { sellerId: session.user.id, source: "SHOPIFY" },
    select: { id: true, externalOrderId: true },
  });
  const orderIdMap = new Map(allOrders.map((o) => [o.externalOrderId, o.id]));

  // Delete all existing items for this seller's Shopify orders, then recreate
  const allOrderIds = allOrders.map((o) => o.id);
  if (allOrderIds.length > 0) {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: allOrderIds } } });
  }

  // Build all items at once
  type ItemCreateInput = {
    orderId: string;
    name: string;
    sku: string | null;
    quantity: number;
    price: number;
  };

  const allItems: ItemCreateInput[] = [];
  for (const so of shopifyOrders) {
    const externalId = so.name ?? String(so.id);
    const orderId = orderIdMap.get(externalId);
    if (orderId && so.line_items?.length) {
      for (const item of so.line_items as { title: string; sku?: string; quantity: number; price: string }[]) {
        allItems.push({
          orderId,
          name: item.title,
          sku: item.sku || null,
          quantity: item.quantity,
          price: parseFloat(item.price),
        });
      }
    }
  }

  if (allItems.length > 0) {
    await prisma.orderItem.createMany({ data: allItems });
  }

  return NextResponse.json({ synced: toCreate.length + toUpdate.length });
}
