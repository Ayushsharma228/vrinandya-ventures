import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderSource } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SELLER" || session.user.plan !== "MARKETPLACE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, platform } = await req.json();

    if (!productId || !platform) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const listing = await prisma.listingRequest.create({
      data: {
        sellerId: session.user.id,
        productId,
        platform: platform as OrderSource,
        status: "PENDING",
      },
      include: { product: true },
    });

    // Notify admin
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "LISTING_REQUEST",
          title: "New Marketplace Listing Request",
          message: `${session.user.name} wants to list "${listing.product.name}" on ${platform}.`,
          data: { listingId: listing.id, productId, platform },
        },
      });
    }

    return NextResponse.json({ message: "Listing request sent to admin", listingId: listing.id });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
