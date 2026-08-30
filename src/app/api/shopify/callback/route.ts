import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const shop  = searchParams.get("shop");
  const state = searchParams.get("state");
  const hmac  = searchParams.get("hmac");

  const fail = (r: string) =>
    NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=${r}`);

  if (!code || !shop || !state || !hmac) return fail("denied");

  // Parse state to get sellerId (needed to look up stored credentials)
  let sellerId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    sellerId = decoded.sellerId;
    if (!sellerId) throw new Error();
  } catch {
    return fail("error");
  }

  // Look up seller's stored credentials (may have their own clientId/Secret)
  const stored = await prisma.shopifyStore.findUnique({ where: { sellerId } });
  const clientId     = stored?.clientId     || process.env.SHOPIFY_API_KEY!;
  const clientSecret = stored?.clientSecret || process.env.SHOPIFY_API_SECRET!;

  // Verify HMAC using the correct secret
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { if (k !== "hmac") params[k] = v; });
  const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  const digest  = createHmac("sha256", clientSecret).update(message).digest("hex");
  if (digest !== hmac) return fail("error");

  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string };
  if (!tokenData.access_token) return fail("error");

  // Fetch shop name
  const shopRes  = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
    headers: { "X-Shopify-Access-Token": tokenData.access_token },
  });
  const shopData = await shopRes.json() as { shop?: { name?: string } };
  const storeName = shopData.shop?.name ?? shop;

  await prisma.shopifyStore.upsert({
    where:  { sellerId },
    create: { sellerId, storeName, storeUrl: shop, accessToken: encrypt(tokenData.access_token), clientId, clientSecret },
    update: { storeName, storeUrl: shop, accessToken: encrypt(tokenData.access_token) },
  });

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/seller/profile?shopify=connected`);
}
