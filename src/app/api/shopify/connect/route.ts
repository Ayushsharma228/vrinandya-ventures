import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop")?.trim().toLowerCase();

  if (!shop) {
    return NextResponse.json({ error: "shop param required" }, { status: 400 });
  }

  const shopDomain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
  const apiKey = process.env.SHOPIFY_API_KEY!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`;
  const scopes = "read_orders,read_products,read_customers,read_inventory";
  const state = Buffer.from(JSON.stringify({ sellerId: session.user.id, shop: shopDomain })).toString("base64");

  const url = `https://${shopDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(url);
}
