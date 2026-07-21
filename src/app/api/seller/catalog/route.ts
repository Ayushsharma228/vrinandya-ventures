import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [products, pushed] = await Promise.all([
      prisma.product.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { name: true } },
          variants:  { select: { id: true, name: true, sku: true, price: true, stock: true, attributes: true, images: true } },
        },
      }),
      prisma.listingRequest.findMany({
        where: { sellerId: session.user.id, platform: "SHOPIFY", status: "LISTED" },
        select: { productId: true },
      }),
    ]);

    const pushedProductIds = new Set(pushed.map((r) => r.productId));

    return NextResponse.json({
      products: products.map((p) => ({ ...p, pushed: pushedProductIds.has(p.id) })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
