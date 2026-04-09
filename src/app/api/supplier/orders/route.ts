import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = req.nextUrl.searchParams.get("status");
    const shippedOnly = req.nextUrl.searchParams.get("shippedOnly") === "1";
    const SHIPPED_STATUSES = ["SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

    const orders = await prisma.order.findMany({
      where: {
        ...(shippedOnly
          ? { status: { in: SHIPPED_STATUSES as any } }
          : status ? { status: status as any } : {}),
        items: {
          some: { product: { supplierId: session.user.id } },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { name: true } },
        items: {
          where: { product: { supplierId: session.user.id } },
          include: { product: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Supplier orders error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
