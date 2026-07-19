import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankSuppliers } from "@/lib/automation/supplier-assignment";
import crypto from "crypto";

// Verify Shopify HMAC signature
function verifyHmac(body: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

function generatePoNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${datePart}-${rand}`;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const topic = req.headers.get("x-shopify-topic");

  // Verify authenticity
  if (!verifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only handle order paid/created
  if (topic !== "orders/paid" && topic !== "orders/created") {
    return NextResponse.json({ ok: true });
  }

  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  let shopifyOrder: Record<string, unknown>;
  try {
    shopifyOrder = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Find the store and seller
  const store = await prisma.shopifyStore.findFirst({
    where: { storeUrl: shopDomain },
    include: { seller: { select: { id: true, name: true } } },
  });

  if (!store) {
    console.error(`[Shopify Webhook] Store not found for domain: ${shopDomain}`);
    return NextResponse.json({ ok: true }); // Always 200 to Shopify
  }

  const sellerId = store.sellerId;
  const externalOrderId = (shopifyOrder.name as string) ?? String(shopifyOrder.id);

  // Idempotency — skip if already exists
  const existing = await prisma.order.findUnique({
    where: { sellerId_externalOrderId_source: { sellerId, externalOrderId, source: "SHOPIFY" } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Parse customer and address
  const customer = shopifyOrder.customer as Record<string, unknown> | null;
  const shippingAddress = shopifyOrder.shipping_address as Record<string, unknown> | null;
  const customerName = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || null
    : null;
  const customerEmail = (shopifyOrder.email as string) || (customer?.email as string) || null;
  const customerAddress = shippingAddress
    ? {
        address: shippingAddress.address1 ?? "",
        city: shippingAddress.city ?? "",
        state: shippingAddress.province ?? "",
        pincode: shippingAddress.zip ?? "",
        phone: (shippingAddress.phone as string) || (customer?.phone as string) || "",
      }
    : undefined;

  const totalAmount = parseFloat((shopifyOrder.total_price as string) ?? "0");
  const lineItems = (shopifyOrder.line_items as Array<Record<string, unknown>>) ?? [];

  // Create order + items in one transaction
  const order = await prisma.order.create({
    data: {
      sellerId,
      externalOrderId,
      source: "SHOPIFY",
      status: "NEW",
      customerName,
      customerEmail,
      customerAddress: customerAddress ?? undefined,
      totalAmount,
      currency: (shopifyOrder.currency as string) ?? "INR",
      rawData: shopifyOrder as never,
      items: {
        create: lineItems.map(item => ({
          name: (item.title as string) ?? "Unknown",
          sku: (item.sku as string) || null,
          quantity: (item.quantity as number) ?? 1,
          price: parseFloat((item.price as string) ?? "0"),
        })),
      },
    },
  });

  // Timeline: order received
  await prisma.orderTimeline.create({
    data: {
      orderId: order.id,
      event: "ORDER_RECEIVED",
      details: `Order ${externalOrderId} received from Shopify automatically`,
      actorRole: "SYSTEM",
    },
  });

  // Auto-assign best supplier
  let supplierId: string | null = null;
  try {
    const ranked = await rankSuppliers(order.id, "best_performance");
    if (ranked.length > 0) {
      supplierId = ranked[0].supplierId;

      await prisma.order.update({
        where: { id: order.id },
        data: { supplierId, supplierStatus: "ASSIGNED" },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          event: "SUPPLIER_ASSIGNED",
          details: `Auto-assigned to supplier. Score: ${ranked[0].score.toFixed(0)}/100`,
          actorRole: "SYSTEM",
        },
      });

      // Create Purchase Order
      const poNumber = generatePoNumber();
      await prisma.purchaseOrder.create({
        data: {
          poNumber,
          orderId: order.id,
          supplierId,
          sellerId,
          status: "SENT",
          sellingPrice: totalAmount,
          supplierCost: 0, // supplier will update
          items: {
            create: lineItems.map(item => ({
              name: (item.title as string) ?? "Unknown",
              sku: (item.sku as string) || null,
              quantity: (item.quantity as number) ?? 1,
              unitCost: 0,
            })),
          },
        },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          event: "PURCHASE_ORDER_CREATED",
          details: `Purchase order ${poNumber} sent to supplier automatically`,
          actorRole: "SYSTEM",
        },
      });

      // Notify supplier
      await prisma.notification.create({
        data: {
          userId: supplierId,
          type: "ORDER_UPDATE",
          title: "New Order Assigned",
          message: `Order ${externalOrderId} has been assigned to you. PO: ${poNumber}. Please confirm and dispatch.`,
          data: { orderId: order.id, poNumber, externalOrderId },
        },
      });
    }
  } catch (err) {
    console.error("[Shopify Webhook] Auto-assign failed:", err);
    // Order is still created — admin can manually assign
  }

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: "ORDER_UPDATE",
          title: supplierId ? "✅ New Order — Auto-processed" : "⚠️ New Order — Needs Supplier",
          message: supplierId
            ? `Order ${externalOrderId} from ${store.storeName} received and auto-assigned. ₹${totalAmount}`
            : `Order ${externalOrderId} from ${store.storeName} received but no supplier matched. Manual assignment needed.`,
          data: { orderId: order.id, externalOrderId, sellerId },
        },
      })
    )
  );

  return NextResponse.json({ ok: true, orderId: order.id });
}
