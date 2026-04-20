import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "shop parameter required" }, { status: 400 });
  }

  // Normalize shop domain
  const shopDomain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;

  const apiKey = process.env.SHOPIFY_API_KEY!;
  const scopes = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory";
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`;
  const state = Buffer.from(JSON.stringify({ sellerId: session.user.id })).toString("base64");

  const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
