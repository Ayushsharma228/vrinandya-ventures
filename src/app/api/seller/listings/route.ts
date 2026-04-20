import { NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest)() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listingRequest.findMany({
    where: { sellerId: session.user.id },
    include: {
      product: { select: { id: true, name: true, sku: true, images: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total:      listings.length,
    pending:    listings.filter(l => l.status === "PENDING").length,
    inProgress: listings.filter(l => l.status === "IN_PROGRESS").length,
    listed:     listings.filter(l => l.status === "LISTED").length,
    failed:     listings.filter(l => l.status === "FAILED").length,
  };

  return NextResponse.json({ listings, stats });
}
