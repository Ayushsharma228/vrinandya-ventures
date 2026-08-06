import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getLWAAccessToken, spApiRequest, SP_API_BASE } from "@/lib/amazon-sp";

async function getAccount(sellerId: string) {
  const account = await prisma.marketplaceAccount.findUnique({
    where: { sellerId_platform: { sellerId, platform: "AMAZON" } },
  });
  if (!account || !account.isActive) throw new Error("Amazon account not connected");
  const creds = account.credentials as {
    sellerId: string; marketplaceId: string; region: string; refreshToken: string;
  };
  const region      = (creds.region ?? "eu") as keyof typeof SP_API_BASE;
  const accessToken = await getLWAAccessToken(decrypt(creds.refreshToken));
  return { creds, region, accessToken };
}

// POST — request a new listings report, return reportId immediately
export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const urlSellerId = (await req.json().catch(() => ({}) as Record<string, string>)) as Record<string, string>;
    const ownerId = session.user.role === "ADMIN" && urlSellerId.sellerId ? urlSellerId.sellerId : session.user.id;
    const { creds, region, accessToken } = await getAccount(ownerId);

    const res = await spApiRequest<{ reportId: string }>({
      method: "POST",
      path:   "/reports/2021-06-30/reports",
      body:   { reportType: "GET_FLAT_FILE_OPEN_LISTINGS_DATA", marketplaceIds: [creds.marketplaceId] },
      accessToken,
      region,
    });
    return NextResponse.json({ reportId: res.reportId });
  } catch (err) {
    console.error("[amazon/listings POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET — check report status; if DONE download + parse + return listings
export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const reportId    = searchParams.get("reportId");
    const urlSellerId = searchParams.get("sellerId");
    const ownerId     = session.user.role === "ADMIN" && urlSellerId ? urlSellerId : session.user.id;
    const { creds, region, accessToken } = await getAccount(ownerId);

    // No reportId yet — just confirm account is connected
    if (!reportId) {
      return NextResponse.json({ connected: true, sellerId: creds.sellerId });
    }

    // Check report status
    const status = await spApiRequest<{ processingStatus: string; reportDocumentId?: string }>({
      path: `/reports/2021-06-30/reports/${reportId}`,
      accessToken,
      region,
    });

    if (status.processingStatus === "FATAL" || status.processingStatus === "CANCELLED") {
      return NextResponse.json({ status: status.processingStatus, error: "Report failed on Amazon side" });
    }

    if (status.processingStatus !== "DONE" || !status.reportDocumentId) {
      return NextResponse.json({ status: status.processingStatus });
    }

    // Download and parse
    const docRes = await spApiRequest<{ url: string }>({
      path: `/reports/2021-06-30/documents/${status.reportDocumentId}`,
      accessToken,
      region,
    });
    const tsvText = await fetch(docRes.url).then(r => r.text());
    const lines   = tsvText.trim().split("\n");
    if (lines.length < 2) return NextResponse.json({ status: "DONE", listings: [] });

    const headers = lines[0].split("\t").map(h => h.trim().toLowerCase());
    const col     = (name: string) => headers.indexOf(name);

    const listings = lines.slice(1).map((line) => {
      const cells = line.split("\t");
      const get   = (...names: string[]) => names.map(n => cells[col(n)]?.trim()).find(v => v && v !== "") ?? "";
      const price = parseFloat(get("price", "standard-price") || "0");
      const qty   = parseInt(get("quantity", "fulfillment-channel-units") || "0", 10);
      const rawStatus = get("status") || "active";
      return {
        sku:      get("seller-sku", "listing-id"),
        asin:     get("asin1", "asin") || undefined,
        title:    get("item-name") || undefined,
        status:   [rawStatus.toLowerCase() === "active" ? "BUYABLE" : rawStatus.toUpperCase()],
        price:    isNaN(price) ? undefined : price,
        quantity: isNaN(qty) ? undefined : qty,
        image:    get("image-url") || undefined,
      };
    }).filter(l => l.sku);

    return NextResponse.json({ status: "DONE", listings });
  } catch (err) {
    console.error("[amazon/listings GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
