import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.shopifyStore.findUnique({
    where: { sellerId: session.user.id },
  });

  if (!store) {
    return NextResponse.json({ error: "No Shopify store connected" }, { status: 400 });
  }

  const shopifyRes = await fetch(
    `https://${store.storeUrl}/admin/api/2024-01/orders.json?status=any&limit=250`,
    { headers: { "X-Shopify-Access-Token": store.accessToken } }
  );

  if (!shopifyRes.ok) {
    return NextResponse.json({ error: "Failed to fetch orders from Shopify" }, { status: 400 });
  }

  const { orders: shopifyOrders } = await shopifyRes.json();

  let synced = 0;
  for (const so of shopifyOrders) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addrJson = customerAddress as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawJson = so as any;

    const order = await prisma.order.upsert({
      where: {
        sellerId_externalOrderId_source: {
          sellerId: session.user.id,
          externalOrderId: so.name ?? String(so.id),
          source: "SHOPIFY",
        },
      },
      update: {
        status,
        customerName,
        customerEmail: so.email || so.customer?.email || null,
        customerAddress: addrJson,
        totalAmount: parseFloat(so.total_price),
        currency: so.currency,
        rawData: rawJson,
      },
      create: {
        sellerId: session.user.id,
        externalOrderId: so.name ?? String(so.id),
        source: "SHOPIFY",
        status,
        customerName,
        customerEmail: so.email || so.customer?.email || null,
        customerAddress: addrJson,
        totalAmount: parseFloat(so.total_price),
        currency: so.currency,
        rawData: rawJson,
      },
    });

    // Recreate order items on each sync
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    if (so.line_items?.length) {
      await prisma.orderItem.createMany({
        data: so.line_items.map((item: { title: string; sku?: string; quantity: number; price: string }) => ({
          orderId: order.id,
          name: item.title,
          sku: item.sku || null,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
      });
    }

    synced++;
  }

  return NextResponse.json({ synced });
}
