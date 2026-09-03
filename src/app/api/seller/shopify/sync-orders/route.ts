import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { decrypt } from "@/lib/encrypt";

function extractUtm(landingSite: string | null | undefined) {
  if (!landingSite) return { utmSource: null, utmMedium: null, utmCampaign: null };
  try {
    const url = new URL(landingSite.startsWith("http") ? landingSite : `https://x.com${landingSite}`);
    return {
      utmSource:   url.searchParams.get("utm_source"),
      utmMedium:   url.searchParams.get("utm_medium"),
      utmCampaign: url.searchParams.get("utm_campaign"),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}

function mapShopifyStatus(financial: string, fulfillment: string | null): OrderStatus {
  if (financial === "refunded" || financial === "voided") return OrderStatus.CANCELLED;
  if (fulfillment === "fulfilled") return OrderStatus.DELIVERED;
  if (fulfillment === "partial") return OrderStatus.SHIPPED;
  if (financial === "paid") return OrderStatus.PROCESSING;
  return OrderStatus.NEW;
}

export async function syncShopifyOrders(sellerId: string): Promise<number> {
  const store = await prisma.shopifyStore.findUnique({ where: { sellerId } });
  if (!store) return 0;

  const shopifyRes = await fetch(
    `https://${store.storeUrl}/admin/api/2025-01/orders.json?status=any&limit=250`,
    { headers: { "X-Shopify-Access-Token": decrypt(store.accessToken) } }
  );
  if (!shopifyRes.ok) throw new Error(`Shopify ${shopifyRes.status}: ${await shopifyRes.text()}`);

  const { orders: shopifyOrders } = await shopifyRes.json();

  const existingOrders = await prisma.order.findMany({
    where: { sellerId, source: "SHOPIFY" },
    select: { id: true, externalOrderId: true, status: true, awbNumber: true, courier: true },
  });
  const existingMap = new Map(existingOrders.map((o) => [o.externalOrderId, o]));
  const LOCKED_STATUSES: OrderStatus[] = ["PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

  type OrderCreateInput = {
    sellerId: string; externalOrderId: string; source: "SHOPIFY"; status: OrderStatus;
    customerName: string | null; customerEmail: string | null;
    customerAddress: Prisma.InputJsonValue | undefined;
    totalAmount: number; currency: string; rawData: Prisma.InputJsonValue;
  };
  const toCreate: OrderCreateInput[] = [];
  const toUpdate: { id: string; status: OrderStatus; customerName: string | null; customerEmail: string | null; customerAddress: Prisma.InputJsonValue | undefined; totalAmount: number; rawData: Prisma.InputJsonValue; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null }[] = [];

  for (const so of shopifyOrders) {
    const externalId = so.name ?? String(so.id);
    const status = mapShopifyStatus(so.financial_status, so.fulfillment_status);
    const customerAddress: Prisma.InputJsonValue | undefined = so.shipping_address
      ? { address: so.shipping_address.address1 ?? "", city: so.shipping_address.city ?? "", state: so.shipping_address.province ?? "", pincode: so.shipping_address.zip ?? "", phone: so.shipping_address.phone || so.customer?.phone || "" }
      : undefined;
    const customerName = so.customer ? `${so.customer.first_name ?? ""} ${so.customer.last_name ?? ""}`.trim() || null : null;
    const utm = extractUtm(so.landing_site);
    const existing = existingMap.get(externalId);
    if (existing) {
      const isLocked = existing.awbNumber || existing.courier || LOCKED_STATUSES.includes(existing.status);
      toUpdate.push({ id: existing.id, status: isLocked ? existing.status : status, customerName, customerEmail: so.email || so.customer?.email || null, customerAddress, totalAmount: parseFloat(so.total_price), rawData: so, ...utm });
    } else {
      toCreate.push({ sellerId, externalOrderId: externalId, source: "SHOPIFY", status, customerName, customerEmail: so.email || so.customer?.email || null, customerAddress, totalAmount: parseFloat(so.total_price), currency: so.currency, rawData: so, ...utm, ...(so.created_at ? { createdAt: new Date(so.created_at) } : {}) });
    }
  }

  if (toCreate.length > 0) await prisma.order.createMany({ data: toCreate, skipDuplicates: true });
  if (toUpdate.length > 0) {
    await Promise.all(toUpdate.map((u) => prisma.order.update({ where: { id: u.id }, data: { status: u.status, customerName: u.customerName, customerEmail: u.customerEmail, customerAddress: u.customerAddress, totalAmount: u.totalAmount, rawData: u.rawData, utmSource: u.utmSource, utmMedium: u.utmMedium, utmCampaign: u.utmCampaign } })));
  }

  const allOrders = await prisma.order.findMany({ where: { sellerId, source: "SHOPIFY" }, select: { id: true, externalOrderId: true } });
  const orderIdMap = new Map(allOrders.map((o) => [o.externalOrderId, o.id]));
  const allOrderIds = allOrders.map((o) => o.id);
  if (allOrderIds.length > 0) await prisma.orderItem.deleteMany({ where: { orderId: { in: allOrderIds } } });

  type ItemCreateInput = { orderId: string; name: string; sku: string | null; quantity: number; price: number };
  const allItems: ItemCreateInput[] = [];
  for (const so of shopifyOrders) {
    const externalId = so.name ?? String(so.id);
    const orderId = orderIdMap.get(externalId);
    if (orderId && so.line_items?.length) {
      for (const item of so.line_items as { title: string; sku?: string; quantity: number; price: string }[]) {
        allItems.push({ orderId, name: item.title, sku: item.sku || null, quantity: item.quantity, price: parseFloat(item.price) });
      }
    }
  }
  if (allItems.length > 0) await prisma.orderItem.createMany({ data: allItems });

  return toCreate.length + toUpdate.length;
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const synced = await syncShopifyOrders(session.user.id);
    return NextResponse.json({ synced });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    const status = msg.startsWith("Shopify 401") || msg.startsWith("Shopify 403") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
