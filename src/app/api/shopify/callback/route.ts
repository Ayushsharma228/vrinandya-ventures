import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const shop  = searchParams.get("shop");
  const state = searchParams.get("state");
  const hmac  = searchParams.get("hmac");

  if (!code || !shop || !state || !hmac) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=denied`);
  }

  // Verify HMAC
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { if (k !== "hmac") params[k] = v; });
  const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  const digest = createHmac("sha256", process.env.SHOPIFY_API_SECRET!).update(message).digest("hex");

  if (digest !== hmac) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=error`);
  }

  let sellerId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    sellerId = decoded.sellerId;
  } catch {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=error`);
  }

  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: process.env.SHOPIFY_API_KEY, client_secret: process.env.SHOPIFY_API_SECRET, code }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=error`);
  }

  // Fetch shop name
  const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: { "X-Shopify-Access-Token": tokenData.access_token },
  });
  const shopData = await shopRes.json();
  const storeName = shopData.shop?.name ?? shop;

  await prisma.shopifyStore.upsert({
    where: { sellerId },
    create: { sellerId, storeName, storeUrl: shop, accessToken: tokenData.access_token },
    update: { storeName, storeUrl: shop, accessToken: tokenData.access_token },
  });

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=connected`);
}
