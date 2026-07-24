import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

function verifyWebhook(body: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const digest = createHmac("sha256", process.env.SHOPIFY_API_SECRET!).update(body).digest("base64");
  return digest === hmacHeader;
}

export async function POST(req: NextRequest) {
  const body  = await req.text();
  const hmac  = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic");
  const shop  = req.headers.get("x-shopify-shop-domain");

  if (!verifyWebhook(body, hmac)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (topic === "app/uninstalled" && shop) {
    await prisma.shopifyStore.deleteMany({ where: { storeUrl: shop } });
  }

  // GDPR webhooks — acknowledge immediately.
  // customers/data_request, customers/redact, shop/redact
  // Customer data in orders is retained per our privacy policy.
  // Implement data export/deletion here if storing additional PII.

  return NextResponse.json({ ok: true });
}
