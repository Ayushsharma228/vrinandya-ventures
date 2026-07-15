import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { validateListing } from "@/lib/listing/validation";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") ?? "";

  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const content = await prisma.listingContent.findUnique({ where: { productId } });
  if (!content) return NextResponse.json({ listings: [] });

  const listings = await prisma.marketplaceListing.findMany({
    where:   { listingContentId: content.id },
    include: { analytics: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.productId || !body?.platform) {
    return NextResponse.json({ error: "productId and platform required" }, { status: 400 });
  }

  const content = await prisma.listingContent.findUnique({ where: { productId: body.productId } });
  if (!content) return NextResponse.json({ error: "Listing content not found. Create content first." }, { status: 404 });

  // Don't allow duplicate active listings for same product+platform
  const existing = await prisma.marketplaceListing.findFirst({
    where: {
      listingContentId: content.id,
      platform:         body.platform as never,
      status:           { notIn: ["REJECTED"] },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Active listing already exists for this product on this marketplace", listingId: existing.id }, { status: 409 });
  }

  // Run validation
  const validation = await validateListing({ productId: body.productId, platform: body.platform });

  const listing = await prisma.marketplaceListing.create({
    data: {
      listingContentId:  content.id,
      platform:          body.platform as never,
      status:            validation.valid ? "IN_REVIEW" : "CONTENT_PENDING",
      validationResult:  validation as unknown as Prisma.InputJsonValue,
      optimizationScore: validation.score,
      ...(body.listingRequestId ? { listingRequestId: body.listingRequestId } : {}),
    },
  });

  // Create analytics record
  await prisma.listingAnalytics.create({
    data: { marketplaceListingId: listing.id, optimizationScore: validation.score },
  });

  return NextResponse.json({ listing, validation }, { status: 201 });
}
