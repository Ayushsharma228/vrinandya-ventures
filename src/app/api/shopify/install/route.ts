import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop      = searchParams.get("shop");
  const hmac      = searchParams.get("hmac");
  const timestamp = searchParams.get("timestamp");

  if (!shop || !hmac || !timestamp) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
  }

  // Verify HMAC
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { if (k !== "hmac") params[k] = v; });
  const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  const digest = createHmac("sha256", process.env.SHOPIFY_API_SECRET!).update(message).digest("hex");

  if (digest !== hmac) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
  }

  // Reject stale requests (older than 10 minutes)
  if (Date.now() / 1000 - parseInt(timestamp) > 600) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
  }

  // Seller must log in first — preserve shop in URL so login can auto-connect after
  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/auth/signin?shopify_install=${encodeURIComponent(shop)}`
  );
}
