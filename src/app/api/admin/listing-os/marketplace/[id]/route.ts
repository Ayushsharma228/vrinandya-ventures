import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { validateListing } from "@/lib/listing/validation";

const VALID_STATUSES = [
  "DRAFT", "CONTENT_PENDING", "IN_REVIEW", "AWAITING_SELLER",
  "AWAITING_MARKETPLACE", "APPROVED", "LIVE", "REJECTED", "OPTIMIZATION_REQUIRED",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const listing = await prisma.marketplaceListing.findUnique({
    where:   { id },
    include: { listingContent: { select: { productId: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const now = new Date();
  const statusTimestamps: Record<string, Date | null> = {};
  if (body.status === "APPROVED")  statusTimestamps.approvedAt = now;
  if (body.status === "LIVE")      statusTimestamps.liveAt     = now;
  if (body.status === "REJECTED")  statusTimestamps.rejectedAt = now;
  if (body.status === "IN_REVIEW") statusTimestamps.submittedAt = now;

  // Re-validate when moving to IN_REVIEW
  let validationResult = listing.validationResult as Prisma.InputJsonValue | undefined;
  let optimizationScore = listing.optimizationScore;
  if (body.status === "IN_REVIEW") {
    const v = await validateListing({ productId: listing.listingContent.productId, platform: listing.platform });
    validationResult  = v as unknown as Prisma.InputJsonValue;
    optimizationScore = v.score;
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id },
    data:  {
      ...(body.status          ? { status: body.status as never }        : {}),
      ...(body.adminNote       !== undefined ? { adminNote: body.adminNote }          : {}),
      ...(body.rejectionReason !== undefined ? { rejectionReason: body.rejectionReason } : {}),
      ...(body.listingUrl      !== undefined ? { listingUrl: body.listingUrl }        : {}),
      ...statusTimestamps,
      validationResult,
      optimizationScore,
    },
  });

  // Update analytics optimization score
  await prisma.listingAnalytics.upsert({
    where:  { marketplaceListingId: id },
    create: { marketplaceListingId: id, optimizationScore },
    update: {
      optimizationScore,
      ...(body.status === "REJECTED" ? { rejectionCount: { increment: 1 } } : {}),
      ...(body.status === "LIVE" && listing.submittedAt
        ? { listingTimeHours: (now.getTime() - listing.submittedAt.getTime()) / 3600000 }
        : {}),
    },
  });

  // Notify seller when listing goes LIVE or is REJECTED
  if (body.status === "LIVE" || body.status === "REJECTED") {
    const lr = listing.listingRequestId
      ? await prisma.listingRequest.findUnique({ where: { id: listing.listingRequestId }, select: { sellerId: true } })
      : null;

    if (lr?.sellerId) {
      await prisma.notification.create({
        data: {
          userId:  lr.sellerId,
          type:    body.status === "LIVE" ? "LISTING_DONE" : "LISTING_REQUEST",
          title:   body.status === "LIVE" ? "Listing is Live!" : "Listing Rejected",
          message: body.status === "LIVE"
            ? `Your product listing on ${listing.platform} is now live.`
            : `Listing on ${listing.platform} was rejected. ${body.rejectionReason ?? ""}`.trim(),
        },
      });
    }
  }

  // Notify operations team when content is missing
  if (body.status === "CONTENT_PENDING") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId:  admin.id,
          type:    "GENERAL",
          title:   "Listing Needs Content",
          message: `A listing on ${listing.platform} is missing required content fields.`,
          data:    { listingId: id },
        },
      });
    }
  }

  return NextResponse.json({ listing: updated });
}
