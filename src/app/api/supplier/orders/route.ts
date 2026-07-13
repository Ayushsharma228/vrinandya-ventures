import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supplierStatus = req.nextUrl.searchParams.get("supplierStatus");

    const orders = await prisma.order.findMany({
      where: {
        supplierId: session.user.id,
        ...(supplierStatus ? { supplierStatus: supplierStatus as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, sku: true, images: true } } },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Supplier orders error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
