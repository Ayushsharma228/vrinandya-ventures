import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId     = process.env.META_APP_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/seller/meta/callback`;
  const scope     = "ads_read,ads_management,business_management";
  const state     = Buffer.from(session.user.id).toString("base64");

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;

  return NextResponse.redirect(url);
}
