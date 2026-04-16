import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyHmac(searchParams: URLSearchParams, secret: string): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  // Build the message: all params except hmac, sorted, joined as key=value pairs
  const params: string[] = [];
  searchParams.forEach((value, key) => {
    if (key !== "hmac") params.push(`${key}=${value}`);
  });
  params.sort();
  const message = params.join("&");

  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  if (!code || !shop || !state) {
    return NextResponse.redirect(new URL("/seller/shopify?error=missing_params", req.url));
  }

  // Verify Shopify HMAC signature (required for App Store)
  const secret = process.env.SHOPIFY_API_SECRET;
  if (secret && !verifyHmac(searchParams, secret)) {
    return NextResponse.redirect(new URL("/seller/shopify?error=invalid_hmac", req.url));
  }

  let sellerId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    sellerId = decoded.sellerId;
  } catch {
    return NextResponse.redirect(new URL("/seller/shopify?error=invalid_state", req.url));
  }

  // Use per-seller credentials if available, fall back to env vars
  const store = await prisma.shopifyStore.findUnique({ where: { sellerId } });
  const clientId = store?.clientId || process.env.SHOPIFY_API_KEY!;
  const clientSecret = store?.clientSecret || process.env.SHOPIFY_API_SECRET!;

  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/seller/shopify?error=token_exchange_failed", req.url));
  }

  const { access_token } = await tokenRes.json();

  // Get shop info
  const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: { "X-Shopify-Access-Token": access_token },
  });
  const shopData = await shopRes.json();
  const storeName = shopData.shop?.name ?? shop;

  // Save to DB
  await prisma.shopifyStore.upsert({
    where: { sellerId },
    update: { storeUrl: shop, storeName, accessToken: access_token },
    create: { sellerId, storeUrl: shop, storeName, accessToken: access_token },
  });

  return NextResponse.redirect(new URL("/seller/shopify?success=true", req.url));
}
