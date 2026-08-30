import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "zlib";
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
    const body = await req.json().catch(() => ({})) as Record<string, string>;
    const ownerId = session.user.role === "ADMIN" && body.sellerId ? body.sellerId : session.user.id;
    const { creds, region, accessToken } = await getAccount(ownerId);

    const res = await spApiRequest<{ reportId: string }>({
      method: "POST",
      path:   "/reports/2021-06-30/reports",
      body:   { reportType: "GET_MERCHANT_LISTINGS_ALL_DATA", marketplaceIds: [creds.marketplaceId] },
      accessToken,
      region,
    });
    return NextResponse.json({ reportId: res.reportId });
  } catch (err) {
    console.error("[amazon/listings POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET — check report status; if DONE download + decompress + parse + return listings
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

    // Get download URL + check compression
    const docRes = await spApiRequest<{ url: string; compressionAlgorithm?: string }>({
      path: `/reports/2021-06-30/documents/${status.reportDocumentId}`,
      accessToken,
      region,
    });

    // Download — handle GZIP compression
    const raw = await fetch(docRes.url).then(r => r.arrayBuffer());
    let tsvText: string;
    if (docRes.compressionAlgorithm === "GZIP") {
      tsvText = gunzipSync(Buffer.from(raw)).toString("utf8");
    } else {
      tsvText = Buffer.from(raw).toString("utf8");
    }

    // Parse TSV — strip BOM if present
    const cleanText = tsvText.replace(/^﻿/, "").replace(/\r/g, "");
    const lines = cleanText.trim().split("\n").filter(l => l.trim());

    // Debug: return raw headers + first row so we can see the actual format
    if (lines.length < 2) {
      return NextResponse.json({ status: "DONE", listings: [] });
    }

    const rawHeaders = lines[0].split("\t");
    const headers    = rawHeaders.map(h => h.trim().toLowerCase());
    const col        = (...names: string[]) => names.map(n => headers.findIndex(h => h === n || h.replace(/[^a-z0-9]/g, "-") === n)).find(i => i >= 0) ?? -1;

    const listings = lines.slice(1).map((line) => {
      const cells = line.split("\t");
      const get   = (...names: string[]) => { const i = col(...names); return i >= 0 ? (cells[i]?.trim() ?? "") : ""; };

      const sku       = get("seller-sku", "listing-id", "sku");
      const title     = get("item-name", "title");
      const asin      = get("asin1", "asin");
      const priceRaw  = parseFloat(get("price", "standard-price") || "0");
      const qtyRaw    = parseInt(get("quantity", "available-quantity", "fulfillment-channel-units") || "0", 10);
      const rawStatus = get("status") || "active";
      const image     = get("image-url");

      return {
        sku,
        asin:     asin || undefined,
        title:    title || undefined,
        status:   [rawStatus.toLowerCase() === "active" ? "BUYABLE" : rawStatus.toUpperCase()],
        price:    isNaN(priceRaw) ? undefined : priceRaw,
        quantity: isNaN(qtyRaw)   ? undefined : qtyRaw,
        image:    image || undefined,
      };
    }).filter(l => l.sku && l.sku.length > 0);

    return NextResponse.json({ status: "DONE", listings });
  } catch (err) {
    console.error("[amazon/listings GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
