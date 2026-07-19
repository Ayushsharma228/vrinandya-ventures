import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.META_ADS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId)
    return NextResponse.json({ error: "META_ADS_TOKEN or META_AD_ACCOUNT_ID not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  if (!from || !to)
    return NextResponse.json({ error: "from and to required" }, { status: 400 });

  const params = new URLSearchParams({
    fields:     "campaign_name,campaign_id,spend",
    time_range: JSON.stringify({ since: from, until: to }),
    level:      "campaign",
    access_token: token,
  });

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/insights?${params}`,
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err?.error?.message ?? "Meta API error" }, { status: 502 });
  }

  const data = await res.json();
  const campaigns = (data.data ?? []).map((c: { campaign_id: string; campaign_name: string; spend: string }) => ({
    id:    c.campaign_id,
    name:  c.campaign_name,
    spend: parseFloat(c.spend ?? "0"),
  }));

  return NextResponse.json({ campaigns, dateRange: { from, to } });
}
