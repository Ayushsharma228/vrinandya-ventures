import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status as ListingStatus;
  if (platform && platform !== "ALL") where.platform = platform;
  if (search) {
    where.OR = [
      { seller: { name: { contains: search, mode: "insensitive" } } },
      { seller: { email: { contains: search, mode: "insensitive" } } },
      { product: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const listings = await prisma.listingRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, sku: true, images: true, price: true } },
    },
  });

  const stats = {
    total: await prisma.listingRequest.count(),
    pending: await prisma.listingRequest.count({ where: { status: "PENDING" } }),
    inProgress: await prisma.listingRequest.count({ where: { status: "IN_PROGRESS" } }),
    listed: await prisma.listingRequest.count({ where: { status: "LISTED" } }),
    failed: await prisma.listingRequest.count({ where: { status: "FAILED" } }),
  };

  return NextResponse.json({ listings, stats });
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status, adminNote, listedUrl } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const listing = await prisma.listingRequest.update({
    where: { id },
    data: {
      status: status as ListingStatus,
      adminNote: adminNote ?? undefined,
      listedUrl: listedUrl ?? undefined,
    },
    include: {
      seller: { select: { id: true, name: true } },
      product: { select: { name: true } },
    },
  });

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: listing.seller.id,
      type: status === "LISTED" ? "LISTING_DONE" : "LISTING_REQUEST",
      title: `Listing ${status === "LISTED" ? "Live" : status === "FAILED" ? "Failed" : "Updated"}`,
      message:
        status === "LISTED"
          ? `Your product "${listing.product.name}" is now listed on ${listing.platform}.`
          : status === "FAILED"
          ? `Listing for "${listing.product.name}" on ${listing.platform} failed.${adminNote ? ` Reason: ${adminNote}` : ""}`
          : `Listing for "${listing.product.name}" is ${status.toLowerCase()}.`,
    },
  });

  return NextResponse.json({ listing });
}
